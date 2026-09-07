package dev.aihub.ingestion;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * AC-8: deletes R2 objects that were uploaded (a media_uploads row exists) but never claimed by
 * an entry, once {@code orphanRetention} has passed. R2 is deleted before the DB row so a crash
 * mid-sweep leaves an orphan row to retry next run rather than a leaked object with no record of
 * it - the failure mode a lost DB row would otherwise create.
 *
 * <p>Runs on a plain {@link org.springframework.scheduling.annotation.Scheduled} trigger
 * ({@link MediaCleanupScheduler}), not Quartz. ARCHITECTURE.md's "Scheduler: Quartz, strictly
 * JDBC JobStore" decision is written for the {@code routines} domain (user-facing reminders,
 * where a missed or duplicated fire is a product bug); this is single-instance object-storage
 * housekeeping with no user-visible effect from an occasional missed or repeated run. Standing up
 * Quartz's JDBC job store for one interior sweep felt like scope this ticket shouldn't carry -
 * flagged in the PR for the owner to confirm or override.
 */
@Service
public class MediaCleanupService {

    private final MediaUploadRepository mediaUploadRepository;
    private final ObjectStorageClient objectStorageClient;
    private final Duration orphanRetention;

    public MediaCleanupService(
            MediaUploadRepository mediaUploadRepository,
            ObjectStorageClient objectStorageClient,
            @Value("${media.orphan-retention}") Duration orphanRetention) {
        this.mediaUploadRepository = mediaUploadRepository;
        this.objectStorageClient = objectStorageClient;
        this.orphanRetention = orphanRetention;
    }

    public void deleteOrphanedUploads() {
        OffsetDateTime cutoff = OffsetDateTime.now().minus(orphanRetention);
        List<String> orphans = mediaUploadRepository.findUnclaimedIssuedBefore(cutoff);
        for (String mediaRef : orphans) {
            objectStorageClient.delete(mediaRef);
            mediaUploadRepository.delete(mediaRef);
        }
    }
}
