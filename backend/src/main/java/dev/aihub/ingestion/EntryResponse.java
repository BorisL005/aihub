package dev.aihub.ingestion;

import java.time.OffsetDateTime;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

/** A single entry row, as returned by {@code GET /projects/{projectId}/entries}. */
public record EntryResponse(
        UUID id, OffsetDateTime ts, String source, String validationStatus, JsonNode payload) {
}
