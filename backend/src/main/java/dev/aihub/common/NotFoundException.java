package dev.aihub.common;

/**
 * Thrown by a service when the caller requested a resource that either does not exist or is not
 * owned by them. The two cases are deliberately indistinguishable to callers of this exception —
 * {@link ApiExceptionHandler} maps it to a single generic 404 body either way, so a response can
 * never reveal whether a resource exists but belongs to someone else.
 */
public class NotFoundException extends RuntimeException {

    public NotFoundException() {
        super("not found");
    }
}
