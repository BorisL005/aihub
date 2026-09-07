package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.MediaUploads;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.FakeObjectStorageClient;
import java.time.OffsetDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/** AC-8: unclaimed uploads older than the retention window are swept; nothing else is touched. */
class MediaCleanupServiceIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private MediaCleanupService mediaCleanupService;

    @Autowired
    private FakeObjectStorageClient storage;

    @Test
    void deletesOnlyUnclaimedUploadsOlderThanTheRetentionWindow() {
        String orphan = insertUpload(uniqueUserId(), OffsetDateTime.now().minusHours(25), null);
        String recentUnclaimed = insertUpload(uniqueUserId(), OffsetDateTime.now().minusHours(1), null);
        String oldButClaimed = insertUpload(uniqueUserId(), OffsetDateTime.now().minusHours(25), OffsetDateTime.now());
        storage.putObject(orphan, "image/jpeg", 1024);
        storage.putObject(recentUnclaimed, "image/jpeg", 1024);
        storage.putObject(oldButClaimed, "image/jpeg", 1024);

        mediaCleanupService.deleteOrphanedUploads();

        assertThat(storage.exists(orphan)).isFalse();
        assertThat(dsl.fetchExists(MediaUploads.TABLE, MediaUploads.MEDIA_REF.eq(orphan))).isFalse();

        assertThat(storage.exists(recentUnclaimed)).isTrue();
        assertThat(dsl.fetchExists(MediaUploads.TABLE, MediaUploads.MEDIA_REF.eq(recentUnclaimed)))
                .isTrue();
        assertThat(storage.exists(oldButClaimed)).isTrue();
        assertThat(dsl.fetchExists(MediaUploads.TABLE, MediaUploads.MEDIA_REF.eq(oldButClaimed)))
                .isTrue();
    }

    private String insertUpload(String userId, OffsetDateTime createdAt, OffsetDateTime claimedAt) {
        String mediaRef = "uploads/" + java.util.UUID.randomUUID();
        dsl.insertInto(MediaUploads.TABLE)
                .set(MediaUploads.MEDIA_REF, mediaRef)
                .set(MediaUploads.USER_ID, userId)
                .set(MediaUploads.CREATED_AT, createdAt)
                .set(MediaUploads.CLAIMED_AT, claimedAt)
                .execute();
        return mediaRef;
    }
}
