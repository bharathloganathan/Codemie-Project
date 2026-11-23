package org.example.api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.example.model.Student;
import org.example.service.StudentService;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public class StudentApiServer {
    private final StudentService service;
    private final HttpServer server;

    public StudentApiServer(StudentService service, int port) throws IOException {
        this(service, new InetSocketAddress(port));
    }

    public StudentApiServer(StudentService service, InetSocketAddress bindAddress) throws IOException {
        this.service = service;
        this.server = HttpServer.create(bindAddress, 0);
        server.createContext("/", new Router(routes(), staticRoutes()));
    }

    public void start() {
        server.start();
    }

    public void stop() {
        server.stop(0);
    }

    // HttpServer.create binds immediately, so the port is known before start().
    public int port() {
        return server.getAddress().getPort();
    }

    public List<Route> routes() {
        return List.of(
            new Route("GET", "/students", "List all students", "none", "Student[]", this::listStudents),
            new Route("POST", "/students", "Create a student", "StudentRequest", "Student", this::createStudent),
            new Route("GET", "/students/{id}", "Fetch a student by id", "none", "Student", this::getStudentById),
            new Route("DELETE", "/students/{id}", "Delete a student", "none", "DeleteResponse", this::deleteStudent)
        );
    }

    public List<Route> staticRoutes() {
        return List.of(
            new Route("GET", "/", "Student management page", "none", "text/html", this::serveIndex),
            new Route("GET", "/style.css", "Page stylesheet", "none", "text/css", this::serveStyle),
            new Route("GET", "/app.js", "Page script", "none", "application/javascript", this::serveScript)
        );
    }

    private void serveIndex(HttpExchange exchange) throws IOException {
        serveFile(exchange, "frontend/index.html", "text/html; charset=UTF-8");
    }

    private void serveStyle(HttpExchange exchange) throws IOException {
        serveFile(exchange, "frontend/style.css", "text/css; charset=UTF-8");
    }

    private void serveScript(HttpExchange exchange) throws IOException {
        serveFile(exchange, "frontend/app.js", "application/javascript; charset=UTF-8");
    }

    private static void serveFile(HttpExchange exchange, String file, String contentType) throws IOException {
        byte[] body = java.nio.file.Files.readAllBytes(java.nio.file.Path.of(file));
        exchange.getResponseHeaders().set("Content-Type", contentType);
        exchange.sendResponseHeaders(200, body.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(body);
        }
    }

    public record Route(String method, String path, String summary, String requestType, String responseType, HttpHandler handler) {
    }

    private static final String MALFORMED_FORM_MESSAGE = "Malformed form data.";

    private void listStudents(HttpExchange exchange) throws IOException {
        sendJson(exchange, 200, JsonWriter.students(service.getStudents()));
    }

    private void createStudent(HttpExchange exchange) throws IOException {
        Map<String, String> params;
        try {
            params = readForm(exchange);
        } catch (IllegalArgumentException e) {
            sendJson(exchange, ErrorCode.VALIDATION_ERROR.status(),
                JsonWriter.error(ErrorCode.VALIDATION_ERROR, MALFORMED_FORM_MESSAGE));
            return;
        }
        Student student;
        try {
            student = service.createStudent(
                params.getOrDefault("name", ""),
                params.getOrDefault("email", ""),
                params.getOrDefault("department", ""),
                params.getOrDefault("phone", "")
            );
        } catch (IllegalArgumentException e) {
            sendJson(exchange, ErrorCode.VALIDATION_ERROR.status(),
                JsonWriter.error(ErrorCode.VALIDATION_ERROR, e.getMessage()));
            return;
        }
        sendJson(exchange, 201, JsonWriter.student(student));
    }

    private void getStudentById(HttpExchange exchange) throws IOException {
        String id = exchange.getRequestURI().getPath().substring("/students/".length());
        Optional<Student> student = service.getStudent(id);
        if (student.isPresent()) {
            sendJson(exchange, 200, JsonWriter.student(student.get()));
        } else {
            sendStudentNotFound(exchange);
        }
    }

    private void deleteStudent(HttpExchange exchange) throws IOException {
        String id = exchange.getRequestURI().getPath().substring("/students/".length());
        if (service.deleteStudent(id)) {
            sendJson(exchange, 200, JsonWriter.deleteResult(true));
        } else {
            sendStudentNotFound(exchange);
        }
    }

    private static void sendStudentNotFound(HttpExchange exchange) throws IOException {
        sendJson(exchange, ErrorCode.NOT_FOUND.status(), JsonWriter.error(ErrorCode.NOT_FOUND, "Student not found"));
    }

    private static Map<String, String> readForm(HttpExchange exchange) throws IOException {
        String rawBody = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
        if (rawBody.isBlank()) {
            return Map.of();
        }
        return parseForm(rawBody);
    }

    private static Map<String, String> parseForm(String rawBody) {
        java.util.Map<String, String> values = new java.util.HashMap<>();
        for (String pair : rawBody.split("&")) {
            String[] item = pair.split("=", 2);
            if (item.length == 2) {
                values.put(item[0], java.net.URLDecoder.decode(item[1], StandardCharsets.UTF_8));
            }
        }
        return values;
    }

    static void sendJson(HttpExchange exchange, int status, String body) throws IOException {
        byte[] payload = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json");
        exchange.sendResponseHeaders(status, payload.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(payload);
        }
    }
}