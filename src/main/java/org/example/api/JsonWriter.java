package org.example.api;

import org.example.model.Student;

import java.util.List;

/**
 * Minimal JSON writer for API responses.
 *
 * Avoids adding JSON dependencies/frameworks; supports only required output shapes.
 */
public final class JsonWriter {

    private JsonWriter() {
    }

    public static String students(List<Student> students) {
        StringBuilder sb = new StringBuilder();
        sb.append('[');
        for (int i = 0; i < students.size(); i++) {
            if (i > 0) {
                sb.append(',');
            }
            sb.append(studentObject(students.get(i)));
        }
        sb.append(']');
        return sb.toString();
    }

    public static String student(Student student) {
        return studentObject(student);
    }

    public static String deleteResult(boolean success) {
        return "{\"success\":" + success + "}";
    }

    public static String error(ErrorCode code, String message) {
        return "{\"code\":" + quote(code.code()) + ",\"message\":" + quote(message) + "}";
    }

    private static String studentObject(Student student) {
        StringBuilder sb = new StringBuilder();
        sb.append('{');
        sb.append("\"id\":").append(quote(student.id()));
        sb.append(',');
        sb.append("\"name\":").append(quote(student.name()));
        sb.append(',');
        sb.append("\"email\":").append(quote(student.email()));
        sb.append(',');
        sb.append("\"department\":").append(quote(student.department()));
        sb.append(',');
        sb.append("\"phone\":").append(student.phone() == null ? "null" : quote(student.phone()));
        sb.append(',');
        sb.append("\"status\":").append(student.status() == null ? "null" : quote(student.status()));
        sb.append('}');
        return sb.toString();
    }

    private static String quote(String value) {
        if (value == null) {
            return "null";
        }
        return "\"" + escape(value) + "\"";
    }

    private static String escape(String value) {
        StringBuilder sb = new StringBuilder(value.length() + 16);
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }
}
