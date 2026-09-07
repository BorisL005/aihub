package dev.aihub.ingestion;

import jakarta.validation.constraints.NotBlank;

/** Request body for {@code POST /projects/{projectId}/entries}. See {@code api/openapi.yaml}. */
public record CreateEntryRequest(@NotBlank String mediaRef, @NotBlank String idempotencyKey) {
}
