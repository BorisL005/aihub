package dev.aihub.ingestion;

import dev.aihub.llm.LlmCallRepository;
import dev.aihub.llm.ModelRegistry;
import dev.aihub.llm.PromptLoader;
import dev.aihub.projecttype.ExtractionConfig;
import dev.aihub.projecttype.ProjectTypeRepository;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validator;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.metadata.Usage;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.content.Media;
import org.springframework.ai.converter.BeanOutputConverter;
import org.springframework.stereotype.Service;
import org.springframework.util.MimeTypeUtils;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

/**
 * Runs the extraction step of ARCHITECTURE.md's ingestion pipeline for one {@code receipts}
 * entry: load the project's prompt/model from {@code project_types} (AC-1), call the model on
 * the captured photo, validate the result (AC-2), and always log exactly one {@code llm_calls}
 * row (AC-3) before updating the entry. Called synchronously from {@link EntryService#createEntry}
 * on the ingest request's own virtual thread (ARCHITECTURE.md §1/§2 - no queue, no async hop).
 */
@Service
public class ReceiptExtractionService {

    private static final String USER_INSTRUCTION = "Extract the receipt fields from this photo.";
    private static final String OUTCOME_SUCCESS = "success";
    private static final String OUTCOME_VALIDATION_FAILED = "validation_failed";
    private static final String OUTCOME_ERROR = "error";

    private final ProjectTypeRepository projectTypeRepository;
    private final PromptLoader promptLoader;
    private final ModelRegistry modelRegistry;
    private final ObjectStorageClient objectStorageClient;
    private final LlmCallRepository llmCallRepository;
    private final EntryRepository entryRepository;
    private final Validator validator;
    private final JsonMapper jsonMapper;

    public ReceiptExtractionService(
            ProjectTypeRepository projectTypeRepository,
            PromptLoader promptLoader,
            ModelRegistry modelRegistry,
            ObjectStorageClient objectStorageClient,
            LlmCallRepository llmCallRepository,
            EntryRepository entryRepository,
            Validator validator,
            JsonMapper jsonMapper) {
        this.projectTypeRepository = projectTypeRepository;
        this.promptLoader = promptLoader;
        this.modelRegistry = modelRegistry;
        this.objectStorageClient = objectStorageClient;
        this.llmCallRepository = llmCallRepository;
        this.entryRepository = entryRepository;
        this.validator = validator;
        this.jsonMapper = jsonMapper;
    }

    /**
     * Extracts {@code entryId}'s receipt photo (stored at {@code mediaRef}) and writes the
     * outcome onto the entry. Never throws: every failure path (AC-2's validation failure, AC-8's
     * call failure) ends in a {@code needs_review} entry and a logged {@code llm_calls} row, not
     * an exception back to the caller - a bad extraction must never cost the capture itself.
     */
    public void extract(UUID projectId, String userId, UUID entryId, String mediaRef, String contentType) {
        ExtractionConfig config = projectTypeRepository
                .findExtractionConfig(projectId, userId)
                .orElseThrow(() -> new IllegalStateException("no extraction config for project " + projectId));

        BeanOutputConverter<ReceiptPayload> converter = new BeanOutputConverter<>(ReceiptPayload.class, jsonMapper);
        Prompt prompt = buildPrompt(config.extractionPrompt(), contentType, mediaRef, converter);

        Instant start = Instant.now();
        ChatResponse response;
        try {
            response = modelRegistry.call(config.extractionModel(), prompt);
        } catch (RuntimeException callFailure) {
            // AC-8: the provider call itself failed (timeout, error, retries exhausted) - no
            // model response exists to preserve.
            record(entryId, config, null, null, start, OUTCOME_ERROR);
            entryRepository.markNeedsReview(entryId, null);
            return;
        }

        Usage usage = response.getMetadata().getUsage();
        Integer promptTokens = usage == null ? null : usage.getPromptTokens();
        Integer completionTokens = usage == null ? null : usage.getCompletionTokens();
        String content = response.getResult().getOutput().getText();

        ReceiptPayload payload;
        try {
            payload = converter.convert(content);
            Set<ConstraintViolation<ReceiptPayload>> violations = validator.validate(payload);
            if (!violations.isEmpty()) {
                throw new IllegalArgumentException("extraction failed validation: " + violations);
            }
        } catch (RuntimeException invalid) {
            // AC-2: a result that fails Bean Validation or the receipts schema - the raw
            // response is preserved, never silently repaired or dropped.
            record(entryId, config, promptTokens, completionTokens, start, OUTCOME_VALIDATION_FAILED);
            entryRepository.markNeedsReview(entryId, jsonMapper.writeValueAsString(rawExtractionFrom(content)));
            return;
        }

        record(entryId, config, promptTokens, completionTokens, start, OUTCOME_SUCCESS);
        entryRepository.markExtracted(entryId, jsonMapper.writeValueAsString(payload));
    }

    private Prompt buildPrompt(
            String promptVersion, String contentType, String mediaRef, BeanOutputConverter<ReceiptPayload> converter) {
        String promptText = promptLoader.loadText(promptVersion);
        String systemText =
                new PromptTemplate(promptText).render(Map.of("format", converter.getFormat()));
        byte[] imageBytes = objectStorageClient.getObject(mediaRef);
        Media photo = Media.builder()
                .mimeType(MimeTypeUtils.parseMimeType(contentType))
                .data(imageBytes)
                .build();
        UserMessage userMessage =
                UserMessage.builder().text(USER_INSTRUCTION).media(List.of(photo)).build();
        return new Prompt(List.of(new SystemMessage(systemText), userMessage));
    }

    private void record(
            UUID entryId,
            ExtractionConfig config,
            Integer promptTokens,
            Integer completionTokens,
            Instant start,
            String validationOutcome) {
        long latencyMs = Duration.between(start, Instant.now()).toMillis();
        llmCallRepository.record(
                entryId, config.extractionPrompt(), config.extractionModel(), promptTokens, completionTokens,
                latencyMs, validationOutcome);
    }

    /**
     * Best-effort structured form of a response that failed validation: usually still valid
     * JSON (a bad field value, not bad syntax), so {@code readTree} captures it as-is; genuinely
     * unparseable text (e.g. the model answered in prose) is wrapped rather than discarded.
     */
    private JsonNode rawExtractionFrom(String content) {
        try {
            return jsonMapper.readTree(content);
        } catch (RuntimeException notJson) {
            return jsonMapper.valueToTree(Map.of("raw_text", content));
        }
    }
}
