package org.example.api;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Very small router to dispatch requests to API routes and static routes.
 * Supports literal paths and the pattern /students/{id}.
 */
public class Router implements HttpHandler {

    private final Map<String, HttpHandler> staticHandlers;
    private final HttpHandler getStudentById;
    private final HttpHandler deleteStudentById;
    private final HttpHandler notFound;

    public Router(List<StudentApiServer.Route> apiRoutes, List<StudentApiServer.Route> staticRoutes) {
        this.staticHandlers = new HashMap<>();

        HttpHandler getStudentByIdFound = null;
        HttpHandler deleteStudentByIdFound = null;

        for (StudentApiServer.Route r : apiRoutes) {
            if ("/students/{id}".equals(r.path())) {
                if ("GET".equalsIgnoreCase(r.method())) {
                    getStudentByIdFound = r.handler();
                } else if ("DELETE".equalsIgnoreCase(r.method())) {
                    deleteStudentByIdFound = r.handler();
                }
            } else {
                staticHandlers.put(key(r.method(), r.path()), r.handler());
            }
        }

        for (StudentApiServer.Route r : staticRoutes) {
            staticHandlers.put(key(r.method(), r.path()), r.handler());
        }

        this.getStudentById = getStudentByIdFound;
        this.deleteStudentById = deleteStudentByIdFound;
        this.notFound = exchange -> {
            byte[] body = "Not Found".getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(404, body.length);
            exchange.getResponseBody().write(body);
            exchange.close();
        };
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        String method = exchange.getRequestMethod();
        String path = exchange.getRequestURI().getPath();

        HttpHandler handler = staticHandlers.get(key(method, path));
        if (handler != null) {
            handler.handle(exchange);
            return;
        }

        if (path.startsWith("/students/") && path.length() > "/students/".length()) {
            if ("GET".equalsIgnoreCase(method) && getStudentById != null) {
                getStudentById.handle(exchange);
                return;
            }
            if ("DELETE".equalsIgnoreCase(method) && deleteStudentById != null) {
                deleteStudentById.handle(exchange);
                return;
            }
        }

        notFound.handle(exchange);
    }

    private static String key(String method, String path) {
        return method.toUpperCase() + " " + path;
    }
}
