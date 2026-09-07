package dev.aihub.ingestion;

import java.net.URI;
import java.time.OffsetDateTime;

/** A presigned PUT target: {@code uploadUrl} accepts one write to one key until {@code expiresAt}. */
public record PresignedUpload(URI uploadUrl, OffsetDateTime expiresAt) {
}
