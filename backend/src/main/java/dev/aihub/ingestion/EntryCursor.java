package dev.aihub.ingestion;

import dev.aihub.common.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Base64;
import java.util.UUID;

/**
 * Opaque keyset-pagination cursor for the entries listing: the {@code (ts, id)} of the last row
 * of the previous page. Encoded so callers cannot construct or infer entry ids from it, though
 * it carries no confidentiality guarantee beyond that - ownership is still re-checked on every
 * call.
 */
record EntryCursor(OffsetDateTime ts, UUID id) {

    String encode() {
        String raw = ts.toInstant().toEpochMilli() + ":" + id;
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    static EntryCursor decode(String cursor) {
        try {
            String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
            int separator = raw.indexOf(':');
            Instant ts = Instant.ofEpochMilli(Long.parseLong(raw.substring(0, separator)));
            UUID id = UUID.fromString(raw.substring(separator + 1));
            return new EntryCursor(OffsetDateTime.ofInstant(ts, ZoneOffset.UTC), id);
        } catch (RuntimeException e) {
            throw new BadRequestException("Invalid cursor.");
        }
    }
}
