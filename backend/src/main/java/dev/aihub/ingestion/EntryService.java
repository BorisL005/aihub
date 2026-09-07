package dev.aihub.ingestion;

import dev.aihub.common.NotFoundException;
import dev.aihub.security.AuthenticatedUser;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

@Service
public class EntryService {

    // AC-4: the only content types the receipts flow accepts, and the maximum object size.
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/heic");
    private static final long MAX_CONTENT_LENGTH_BYTES = 10L * 1024 * 1024;

    private final ProjectRepository projectRepository;
    private final EntryRepository entryRepository;
    private final MediaUploadRepository mediaUploadRepository;
    private final ObjectStorageClient objectStorageClient;
    private final JsonMapper jsonMapper;

    public EntryService(
            ProjectRepository projectRepository,
            EntryRepository entryRepository,
            MediaUploadRepository mediaUploadRepository,
            ObjectStorageClient objectStorageClient,
            JsonMapper jsonMapper) {
        this.projectRepository = projectRepository;
        this.entryRepository = entryRepository;
        this.mediaUploadRepository = mediaUploadRepository;
        this.objectStorageClient = objectStorageClient;
        this.jsonMapper = jsonMapper;
    }

    /**
     * Same 404 for a nonexistent project and for one owned by a different user (AC-5, AC-S) - the
     * ownership check happens before any entry data is touched.
     */
    public EntryPageResponse listEntries(AuthenticatedUser user, UUID projectId, int limit, String rawCursor) {
        if (!projectRepository.isOwnedByUser(projectId, user.userId())) {
            throw new NotFoundException();
        }

        EntryCursor cursor = rawCursor == null ? null : EntryCursor.decode(rawCursor);
        EntryRepository.Page page = entryRepository.findPage(projectId, user.userId(), limit, cursor);

        List<EntryResponse> items = page.items().stream()
                .map(row -> new EntryResponse(
                        row.id(), row.ts(), row.source(), row.validationStatus(), parsePayload(row.payloadJson())))
                .toList();
        String nextCursor = page.nextCursor() == null ? null : page.nextCursor().encode();
        return new EntryPageResponse(items, nextCursor);
    }

    /**
     * AC-1 / AC-3 / AC-4 / AC-9 / AC-S: claims {@code request.mediaRef()} as a new {@code camera}
     * entry. Ownership and idempotency are checked before anything in R2 is touched or mutated;
     * the media_ref's owner and claim state are checked before the (network) headObject call so a
     * foreign or already-claimed media_ref never triggers an R2 round trip.
     */
    @Transactional
    public CreateEntryResult createEntry(AuthenticatedUser user, UUID projectId, CreateEntryRequest request) {
        if (!projectRepository.isOwnedByUser(projectId, user.userId())) {
            throw new NotFoundException();
        }

        Optional<EntryRepository.Row> existing =
                entryRepository.findByIdempotencyKey(projectId, request.idempotencyKey());
        if (existing.isPresent()) {
            return new CreateEntryResult(toResponse(existing.get()), false);
        }

        mediaUploadRepository
                .find(request.mediaRef())
                .filter(row -> row.userId().equals(user.userId()))
                .filter(row -> row.claimedAt() == null)
                .orElseThrow(() -> new MediaUnavailableException("media_ref is unavailable"));

        ObjectMetadata metadata = objectStorageClient
                .headObject(request.mediaRef())
                .orElseThrow(() -> new MediaUnavailableException("no object exists at media_ref yet"));
        if (!ALLOWED_CONTENT_TYPES.contains(metadata.contentType()) || metadata.contentLength() > MAX_CONTENT_LENGTH_BYTES) {
            objectStorageClient.delete(request.mediaRef());
            throw new MediaRejectedException("uploaded object fails the content-type/size check");
        }

        Optional<EntryRepository.Row> inserted =
                entryRepository.insertCameraEntry(projectId, request.mediaRef(), request.idempotencyKey());
        if (inserted.isPresent()) {
            mediaUploadRepository.markClaimed(request.mediaRef());
            return new CreateEntryResult(toResponse(inserted.get()), true);
        }
        // Lost a race against an identical concurrent retry (AC-3): the winner's row is the answer.
        EntryRepository.Row winner = entryRepository
                .findByIdempotencyKey(projectId, request.idempotencyKey())
                .orElseThrow(() -> new IllegalStateException("insert conflicted but no row exists"));
        return new CreateEntryResult(toResponse(winner), false);
    }

    private EntryResponse toResponse(EntryRepository.Row row) {
        return new EntryResponse(row.id(), row.ts(), row.source(), row.validationStatus(), parsePayload(row.payloadJson()));
    }

    private JsonNode parsePayload(String payloadJson) {
        try {
            return jsonMapper.readTree(payloadJson);
        } catch (JacksonException e) {
            throw new IllegalStateException("stored entry payload is not valid JSON", e);
        }
    }

    /** {@code created} distinguishes a fresh row (201) from an idempotent replay (200, AC-3). */
    public record CreateEntryResult(EntryResponse entry, boolean created) {
    }
}
