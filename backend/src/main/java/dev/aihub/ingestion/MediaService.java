package dev.aihub.ingestion;

import dev.aihub.security.AuthenticatedUser;
import java.time.Duration;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class MediaService {

    private final MediaUploadRepository mediaUploadRepository;
    private final ObjectStorageClient objectStorageClient;
    private final Duration uploadUrlTtl;

    public MediaService(
            MediaUploadRepository mediaUploadRepository,
            ObjectStorageClient objectStorageClient,
            @Value("${media.upload-url-ttl}") Duration uploadUrlTtl) {
        this.mediaUploadRepository = mediaUploadRepository;
        this.objectStorageClient = objectStorageClient;
        this.uploadUrlTtl = uploadUrlTtl;
    }

    /**
     * AC-1 / AC-7: generates an opaque, server-chosen media_ref (not derived from any entry or
     * project id - notes for dev) owned by the caller, and a presigned PUT URL valid for {@code
     * uploadUrlTtl} that authorises a write to that one key only.
     */
    @Transactional
    public MediaUploadUrlResponse createUploadUrl(AuthenticatedUser user) {
        String mediaRef = "uploads/" + UUID.randomUUID();
        mediaUploadRepository.insert(mediaRef, user.userId());
        PresignedUpload presigned = objectStorageClient.presignPut(mediaRef, uploadUrlTtl);
        return new MediaUploadUrlResponse(mediaRef, presigned.uploadUrl().toString(), presigned.expiresAt());
    }
}
