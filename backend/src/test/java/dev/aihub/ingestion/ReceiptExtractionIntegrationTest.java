package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import dev.aihub.common.Tables.Entries;
import dev.aihub.common.Tables.LlmCalls;
import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.FakeObjectStorageClient;
import dev.aihub.support.TestJwtSupport;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.jooq.JSONB;
import org.jooq.Record5;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.ResourceAccessException;

/** KAN-6: extraction wired into the KAN-5 ingest endpoint. */
class ReceiptExtractionIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FakeObjectStorageClient storage;

    // AC-1 / AC-9
    @Test
    void createEntryStoresTheValidatedExtractionWithExtractedStatus() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);
        testChatModel.respondWithJson(
                "{\"merchant\":\"SOHO\",\"purchased_at\":\"2026-02-01\",\"total\":30.75,\"currency\":\"CAD\"}");

        byte[] body = postEntry(userId, projectId, mediaRef, 201);
        String json = new String(body, StandardCharsets.UTF_8);
        assertThat((String) JsonPath.read(json, "$.validationStatus")).isEqualTo("extracted");
        assertThat((String) JsonPath.read(json, "$.payload.merchant")).isEqualTo("SOHO");
        assertThat(((Number) JsonPath.read(json, "$.payload.total")).doubleValue()).isEqualTo(30.75);
        assertThat((String) JsonPath.read(json, "$.payload.currency")).isEqualTo("CAD");
        assertThat((String) JsonPath.read(json, "$.payload.purchased_at")).isEqualTo("2026-02-01");
    }

    // AC-2: missing total fails Bean Validation - needs_review, raw response preserved, nothing
    // silently defaulted.
    @Test
    void missingTotalIsStoredAsNeedsReviewWithTheRawResponsePreserved() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);
        testChatModel.respondWithJson("{\"merchant\":\"SOHO\",\"purchased_at\":\"2026-02-01\",\"currency\":\"CAD\"}");

        byte[] body = postEntry(userId, projectId, mediaRef, 201);
        String json = new String(body, StandardCharsets.UTF_8);
        assertThat((String) JsonPath.read(json, "$.validationStatus")).isEqualTo("needs_review");

        UUID entryId = singleEntryId(projectId);
        String rawExtraction = dsl.select(Entries.RAW_EXTRACTION)
                .from(Entries.TABLE)
                .where(Entries.ID.eq(entryId))
                .fetchOne(record -> record.get(Entries.RAW_EXTRACTION).data());
        assertThat(rawExtraction).contains("SOHO");
    }

    // AC-2 (negative amount half) + AC-3: exactly one llm_calls row is written, success or not.
    @Test
    void negativeTotalIsStoredAsNeedsReviewAndExactlyOneLlmCallIsLogged() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);
        testChatModel.respondWithJson(
                "{\"merchant\":\"SOHO\",\"purchased_at\":\"2026-02-01\",\"total\":-5.00,\"currency\":\"CAD\"}");

        byte[] body = postEntry(userId, projectId, mediaRef, 201);
        assertThat((String) JsonPath.read(new String(body, StandardCharsets.UTF_8), "$.validationStatus"))
                .isEqualTo("needs_review");

        UUID entryId = singleEntryId(projectId);
        assertThat(dsl.fetchCount(LlmCalls.TABLE, LlmCalls.ENTRY_ID.eq(entryId))).isEqualTo(1);
        String outcome = dsl.select(LlmCalls.VALIDATION_OUTCOME)
                .from(LlmCalls.TABLE)
                .where(LlmCalls.ENTRY_ID.eq(entryId))
                .fetchOne(LlmCalls.VALIDATION_OUTCOME);
        assertThat(outcome).isEqualTo("validation_failed");
    }

    // AC-3 (success half) + AC-4: a clean extraction logs exactly one llm_calls row, with token
    // counts and a prompt_version/model matching what V4's seed and PromptLoader actually use.
    @Test
    void aSuccessfulExtractionLogsExactlyOneLlmCallWithTokenCountsAndPromptVersion() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);

        byte[] body = postEntry(userId, projectId, mediaRef, 201);
        assertThat((String) JsonPath.read(new String(body, StandardCharsets.UTF_8), "$.validationStatus"))
                .isEqualTo("extracted");

        UUID entryId = singleEntryId(projectId);
        assertThat(dsl.fetchCount(LlmCalls.TABLE, LlmCalls.ENTRY_ID.eq(entryId))).isEqualTo(1);
        Record5<String, Integer, Integer, String, String> row = dsl.select(
                        LlmCalls.VALIDATION_OUTCOME, LlmCalls.INPUT_TOKENS, LlmCalls.OUTPUT_TOKENS,
                        LlmCalls.PROMPT_VERSION, LlmCalls.MODEL)
                .from(LlmCalls.TABLE)
                .where(LlmCalls.ENTRY_ID.eq(entryId))
                .fetchOne();
        assertThat(row.value1()).isEqualTo("success");
        assertThat(row.value2()).isEqualTo(100);
        assertThat(row.value3()).isEqualTo(20);
        assertThat(row.value4()).isEqualTo("receipt_extraction/v1");
        assertThat(row.value5()).isEqualTo("vision-cheap");
    }

    // AC-8: the provider call fails outright (after retries) - needs_review, no raw response to
    // preserve, failure still recorded in llm_calls, and the user still sees the entry rather
    // than losing the capture.
    @Test
    void aFailedModelCallIsStoredAsNeedsReviewWithNoRawExtraction() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);
        testChatModel.failAllCallsWith(new ResourceAccessException("simulated provider timeout"));

        byte[] body = postEntry(userId, projectId, mediaRef, 201);
        String json = new String(body, StandardCharsets.UTF_8);
        assertThat((String) JsonPath.read(json, "$.validationStatus")).isEqualTo("needs_review");
        assertThat((Object) JsonPath.read(json, "$.payload")).asInstanceOf(
                        org.assertj.core.api.InstanceOfAssertFactories.MAP)
                .isEmpty();

        UUID entryId = singleEntryId(projectId);
        JSONB rawExtraction = dsl.select(Entries.RAW_EXTRACTION)
                .from(Entries.TABLE)
                .where(Entries.ID.eq(entryId))
                .fetchOne(Entries.RAW_EXTRACTION);
        assertThat(rawExtraction).isNull();
        String outcome = dsl.select(LlmCalls.VALIDATION_OUTCOME)
                .from(LlmCalls.TABLE)
                .where(LlmCalls.ENTRY_ID.eq(entryId))
                .fetchOne(LlmCalls.VALIDATION_OUTCOME);
        assertThat(outcome).isEqualTo("error");
    }

    private byte[] postEntry(String userId, UUID projectId, String mediaRef, int expectedStatus) {
        return restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isEqualTo(expectedStatus)
                .expectBody()
                .returnResult()
                .getResponseBody();
    }

    private UUID singleEntryId(UUID projectId) {
        return dsl.select(Entries.ID)
                .from(Entries.TABLE)
                .where(Entries.PROJECT_ID.eq(projectId))
                .fetchOne(Entries.ID);
    }

    private String issueUploadUrl(String userId) {
        byte[] body = restTestClient.post().uri("/media/upload-url")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .returnResult()
                .getResponseBody();
        return JsonPath.read(new String(body, StandardCharsets.UTF_8), "$.mediaRef");
    }

    private UUID provisionProject(String userId) {
        projectRepository.ensureReceiptsProject(userId);
        return dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userId))
                .fetchOne(Projects.ID);
    }
}
