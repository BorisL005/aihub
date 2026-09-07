package dev.aihub.common;

import dev.aihub.ingestion.MediaRejectedException;
import dev.aihub.ingestion.MediaUnavailableException;
import java.net.URI;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Maps domain exceptions to HTTP responses. Kept deliberately thin: the response bodies here are
 * the only place an error's wording is decided, so a leaking detail message can only ever be
 * introduced in one place.
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    private static final URI MEDIA_REJECTED_TYPE = URI.create("urn:aihub:media-rejected");
    private static final URI MEDIA_UNAVAILABLE_TYPE = URI.create("urn:aihub:media-unavailable");

    @ExceptionHandler(NotFoundException.class)
    ProblemDetail handleNotFound() {
        return ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Resource not found.");
    }

    @ExceptionHandler(BadRequestException.class)
    ProblemDetail handleBadRequest(BadRequestException exception) {
        return ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
    }

    /**
     * AC-4: the uploaded object's content-type/size failed validation. The client's "photo
     * rejected" state (not retryable) keys off {@code type}, never off {@code detail} wording.
     */
    @ExceptionHandler(MediaRejectedException.class)
    ProblemDetail handleMediaRejected(MediaRejectedException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problem.setType(MEDIA_REJECTED_TYPE);
        return problem;
    }

    /**
     * AC-7 / AC-9 / AC-S: the media_ref can't be claimed - unknown, foreign, or no object in R2
     * yet. The client's "couldn't save, try again" state (design review ruling 1, KAN-5) keys off
     * {@code type}.
     */
    @ExceptionHandler(MediaUnavailableException.class)
    ProblemDetail handleMediaUnavailable(MediaUnavailableException exception) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, exception.getMessage());
        problem.setType(MEDIA_UNAVAILABLE_TYPE);
        return problem;
    }
}
