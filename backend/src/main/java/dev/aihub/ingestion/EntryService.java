package dev.aihub.ingestion;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aihub.common.NotFoundException;
import dev.aihub.security.AuthenticatedUser;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class EntryService {

    private final ProjectRepository projectRepository;
    private final EntryRepository entryRepository;
    private final ObjectMapper objectMapper;

    public EntryService(
            ProjectRepository projectRepository, EntryRepository entryRepository, ObjectMapper objectMapper) {
        this.projectRepository = projectRepository;
        this.entryRepository = entryRepository;
        this.objectMapper = objectMapper;
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
        EntryRepository.Page page = entryRepository.findPage(projectId, limit, cursor);

        List<EntryResponse> items = page.items().stream()
                .map(row -> new EntryResponse(
                        row.id(), row.ts(), row.source(), row.validationStatus(), parsePayload(row.payloadJson())))
                .toList();
        String nextCursor = page.nextCursor() == null ? null : page.nextCursor().encode();
        return new EntryPageResponse(items, nextCursor);
    }

    private JsonNode parsePayload(String payloadJson) {
        try {
            return objectMapper.readTree(payloadJson);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("stored entry payload is not valid JSON", e);
        }
    }
}
