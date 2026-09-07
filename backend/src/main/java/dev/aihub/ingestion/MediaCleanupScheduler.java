package dev.aihub.ingestion;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/** Triggers {@link MediaCleanupService}'s AC-8 sweep hourly. See that class for why not Quartz. */
@Component
public class MediaCleanupScheduler {

    private final MediaCleanupService mediaCleanupService;

    public MediaCleanupScheduler(MediaCleanupService mediaCleanupService) {
        this.mediaCleanupService = mediaCleanupService;
    }

    @Scheduled(fixedRate = 3_600_000, initialDelay = 3_600_000)
    void sweep() {
        mediaCleanupService.deleteOrphanedUploads();
    }
}
