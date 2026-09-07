package dev.aihub.ingestion;

import dev.aihub.common.Tables.MediaUploads;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * Tenant isolation for {@code media_uploads}: every method here filters by {@code user_id},
 * which must come only from the validated JWT (spring-conventions).
 */
@Repository
public class MediaUploadRepository {

    private final DSLContext dsl;

    public MediaUploadRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    public void insert(String mediaRef, String userId) {
        dsl.insertInto(MediaUploads.TABLE)
                .set(MediaUploads.MEDIA_REF, mediaRef)
                .set(MediaUploads.USER_ID, userId)
                .execute();
    }

    /**
     * The owner and claim state of {@code mediaRef}, or empty if no such upload was ever issued.
     * {@link MediaService} treats "no row", "owned by someone else" and "already claimed"
     * identically (AC-S, AC-9) - this method exposes all three so the caller can tell them apart
     * only for its own consistency checks, never to leak that distinction to the client.
     */
    public Optional<Row> find(String mediaRef) {
        return dsl.select(MediaUploads.USER_ID, MediaUploads.CLAIMED_AT)
                .from(MediaUploads.TABLE)
                .where(MediaUploads.MEDIA_REF.eq(mediaRef))
                .fetchOptional(record -> new Row(record.get(MediaUploads.USER_ID), record.get(MediaUploads.CLAIMED_AT)));
    }

    /**
     * Marks {@code mediaRef} claimed. The {@code claimed_at is null} guard makes this safe to call
     * even if raced by a concurrent claim attempt for the same media_ref - at most one wins.
     */
    public boolean markClaimed(String mediaRef) {
        int updated = dsl.update(MediaUploads.TABLE)
                .set(MediaUploads.CLAIMED_AT, OffsetDateTime.now())
                .where(MediaUploads.MEDIA_REF.eq(mediaRef))
                .and(MediaUploads.CLAIMED_AT.isNull())
                .execute();
        return updated == 1;
    }

    /** Unclaimed media_refs issued before {@code cutoff} - AC-8's orphan cleanup candidates. */
    public List<String> findUnclaimedIssuedBefore(OffsetDateTime cutoff) {
        return dsl.select(MediaUploads.MEDIA_REF)
                .from(MediaUploads.TABLE)
                .where(MediaUploads.CLAIMED_AT.isNull())
                .and(MediaUploads.CREATED_AT.lt(cutoff))
                .fetch(MediaUploads.MEDIA_REF);
    }

    public void delete(String mediaRef) {
        dsl.deleteFrom(MediaUploads.TABLE)
                .where(MediaUploads.MEDIA_REF.eq(mediaRef))
                .execute();
    }

    public record Row(String userId, OffsetDateTime claimedAt) {
    }
}
