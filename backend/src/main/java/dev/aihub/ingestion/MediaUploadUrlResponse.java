package dev.aihub.ingestion;

import java.time.OffsetDateTime;

/** Response body for {@code POST /media/upload-url}. See {@code api/openapi.yaml}. */
public record MediaUploadUrlResponse(String mediaRef, String uploadUrl, OffsetDateTime expiresAt) {
}
