package dev.aihub.ingestion;

/**
 * The claimed {@code media_ref} is unknown, not owned by the caller (AC-S), or has no object in
 * R2 yet (AC-9) - the same client-facing "couldn't save, try again" state as AC-7's expired
 * presigned URL (design review ruling 1, KAN-5). These three causes are deliberately
 * indistinguishable to the caller: a media_ref belonging to another user must look identical to
 * one that never existed.
 */
public class MediaUnavailableException extends RuntimeException {

    public MediaUnavailableException(String message) {
        super(message);
    }
}
