package dev.aihub.ingestion;

import java.util.UUID;

/** A project owned by the caller, as returned by {@code GET /projects}. */
public record ProjectResponse(UUID id, String name, String projectType) {
}
