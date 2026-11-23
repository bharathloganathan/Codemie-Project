package org.example;

import org.example.api.StudentApiServer;
import org.example.service.StudentService;

import java.io.IOException;

public class Main {
    public static void main(String[] args) throws IOException {
        new StudentApiServer(new StudentService(), 8000).start();
        System.out.println("Student API server started on http://localhost:8000");
    }
}
