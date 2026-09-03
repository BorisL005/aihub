package dev.aihub.ingestion;

import com.fasterxml.jackson.databind.JsonNode;
import java.time.OffsetDateTime;
import java.util.UUID;

/** A single entry row, as returned by {@code GET /projects/{projectId}/entries}. */
public record EntryResponse(
        UUID id, OffsetDateTime ts, String source, String validationStatus, JsonNode payload) {
}
