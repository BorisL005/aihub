package dev.aihub.ingestion;

import dev.aihub.common.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.UUID;

/**
 * Opaque keyset-pagination cursor for the entries listing: the {@code (ts, id)} of the last row
 * of the previous page. Encoded so callers cannot construct or infer entry ids from it, though
 * it carries no confidentiality guarantee beyond that - ownership is still re-checked on every
 * call.
 *
 * <p>{@code ts} is carried as its full ISO-8601 representation, not epoch milliseconds - Postgres
 * {@code timestamptz} stores microsecond precision, and truncating to milliseconds on encode would
 * make the decoded cursor sort before the real boundary row, silently skipping any entry that
 * shares a millisecond with it on the next page.
 */
record EntryCursor(OffsetDateTime ts, UUID id) {

    private static final char SEPARATOR = '|';

    String encode() {
        String raw = ts + String.valueOf(SEPARATOR) + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static EntryCursor decode(String cursor) {
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            int separator = raw.lastIndexOf(SEPARATOR);
            OffsetDateTime ts = OffsetDateTime.parse(raw.substring(0, separator));
            UUID id = UUID.fromString(raw.substring(separator + 1));
            return new EntryCursor(ts, id);
        } catch (RuntimeException e) {
            throw new BadRequestException("Invalid cursor.");
        }
    }
}
