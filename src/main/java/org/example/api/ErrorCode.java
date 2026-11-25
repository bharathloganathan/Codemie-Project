package org.example.api;

/**
 * Error codes used by the API responses.
 *
 * Kept intentionally lightweight (no external dependencies) to match the project's architecture.
 */
public enum ErrorCode {
    VALIDATION_ERROR(400, "VALIDATION_ERROR"),
    NOT_FOUND(404, "NOT_FOUND"),
    INTERNAL_ERROR(500, "INTERNAL_ERROR");

    private final int status;
    private final String code;

    ErrorCode(int status, String code) {
        this.status = status;
        this.code = code;
    }

    public int status() {
        return status;
    }

    public String code() {
        return code;
    }
}
