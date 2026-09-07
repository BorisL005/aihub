package dev.aihub.ingestion;

/**
 * The uploaded object fails AC-4's content-type/size rule. Distinct from {@link
 * MediaUnavailableException} so the client can tell "take another photo" (not retryable) apart
 * from "try again" (retryable) - see {@link dev.aihub.common.ApiExceptionHandler}.
 */
public class MediaRejectedException extends RuntimeException {

    public MediaRejectedException(String message) {
        super(message);
    }
}
