package dev.aihub.common;

/** Thrown when a request is well-formed HTTP but carries a value the service cannot act on. */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}
