package dev.aihub.ingestion;

import java.time.Duration;
import java.util.Optional;

/**
 * Abstraction over the R2 (S3-compatible) object storage bucket that holds capture media.
 * Mocked in tests (spring-conventions - R2 is a true external), so no test depends on a real
 * bucket being reachable.
 */
public interface ObjectStorageClient {

    /** A presigned PUT URL authorising a write to exactly one key, expiring after {@code ttl}. */
    PresignedUpload presignPut(String key, Duration ttl);

    /** Metadata for the object at {@code key}, or empty if no object exists there yet. */
    Optional<ObjectMetadata> headObject(String key);

    /** Deletes the object at {@code key}. A no-op if nothing exists there. */
    void delete(String key);
}
