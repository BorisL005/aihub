package dev.aihub.ingestion;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * A page of entries, ordered by {@code ts} descending. {@code nextCursor} is omitted from the
 * JSON response when this is the last page.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record EntryPageResponse(List<EntryResponse> items, String nextCursor) {
}
