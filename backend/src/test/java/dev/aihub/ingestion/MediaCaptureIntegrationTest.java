package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import dev.aihub.common.Tables.Entries;
import dev.aihub.common.Tables.MediaUploads;
import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.FakeObjectStorageClient;
import dev.aihub.support.TestJwtSupport;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.JSONB;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

/** KAN-5: presigned upload + entry claim (POST /media/upload-url, POST .../entries). */
class MediaCaptureIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private FakeObjectStorageClient storage;

    // AC-7 (TTL half - R2 rejecting a PUT past this instant is R2's own behaviour, not
    // backend-observable): the presigned URL's advertised expiry is 15 minutes out.
    @Test
    void uploadUrlExpiresFifteenMinutesFromIssue() {
        String userId = uniqueUserId();
        OffsetDateTime before = OffsetDateTime.now();

        byte[] body = restTestClient.post().uri("/media/upload-url")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.mediaRef").exists()
                .jsonPath("$.uploadUrl").exists()
                .jsonPath("$.expiresAt").exists()
                .returnResult()
                .getResponseBody();
        String json = new String(body, StandardCharsets.UTF_8);
        OffsetDateTime expiresAt = OffsetDateTime.parse((String) JsonPath.read(json, "$.expiresAt"));

        assertThat(Duration.between(before, expiresAt)).isCloseTo(Duration.ofMinutes(15), Duration.ofSeconds(30));
        String mediaRef = JsonPath.read(json, "$.mediaRef");
        assertThat(dsl.fetchOne(MediaUploads.TABLE, MediaUploads.MEDIA_REF.eq(mediaRef)).get(MediaUploads.USER_ID))
                .isEqualTo(userId);
    }

    // AC-1
    @Test
    void createEntryStoresCameraSourceRowWithPendingStatusAfterUpload() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isEqualTo(201)
                .expectBody()
                .jsonPath("$.id").exists()
                .jsonPath("$.source").isEqualTo("camera")
                .jsonPath("$.validationStatus").isEqualTo("pending")
                .jsonPath("$.payload").exists();

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isEqualTo(1);
        assertThat(dsl.fetchOne(MediaUploads.TABLE, MediaUploads.MEDIA_REF.eq(mediaRef)).get(MediaUploads.CLAIMED_AT))
                .isNotNull();
    }

    // AC-2: the backend contribution - a freshly created entry sorts first on the very next list.
    @Test
    void newlyCreatedEntryAppearsFirstOnTheNextListCall() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        insertOlderEntry(projectId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);

        byte[] createBody = restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isEqualTo(201)
                .expectBody()
                .returnResult()
                .getResponseBody();
        String newEntryId = JsonPath.read(new String(createBody, StandardCharsets.UTF_8), "$.id");

        restTestClient.get().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items[0].id").isEqualTo(newEntryId)
                .jsonPath("$.items[0].validationStatus").isEqualTo("pending");
    }

    // AC-3
    @Test
    void repeatingTheSameIdempotencyKeyReturnsTheOriginalEntryWithoutCreatingASecondRow() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 1024);
        String idempotencyKey = UUID.randomUUID().toString();
        String requestBody = "{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + idempotencyKey + "\"}";

        byte[] firstBody = restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .exchange()
                .expectStatus().isEqualTo(201)
                .expectBody()
                .returnResult()
                .getResponseBody();
        String firstId = JsonPath.read(new String(firstBody, StandardCharsets.UTF_8), "$.id");

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body(requestBody)
                .exchange()
                .expectStatus().isEqualTo(200)
                .expectBody()
                .jsonPath("$.id").isEqualTo(firstId);

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isEqualTo(1);
    }

    // AC-4
    @Test
    void rejectsAnUploadWithADisallowedContentTypeAndDeletesTheObject() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "application/pdf", 1024);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-rejected");

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isZero();
        assertThat(storage.exists(mediaRef)).isFalse();
    }

    // AC-4 (size half)
    @Test
    void rejectsAnUploadOverTenMegabytesAndDeletesTheObject() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, "image/jpeg", 10L * 1024 * 1024 + 1);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-rejected");

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isZero();
        assertThat(storage.exists(mediaRef)).isFalse();
    }

    // AC-4 (QA regression for review blocker B2): R2 can return a null Content-Type (e.g. an
    // object PUT without one, since the presigned PUT does not bind the header - see the Majors
    // list). EntryService.java:88 used to NPE out of Set.of(...).contains(null) here, producing a
    // 500 with the object left in R2 instead of AC-4's required 400 + delete. Fixed in ea239ee;
    // this proves it at the HTTP boundary, not just by reading the null-check.
    @Test
    void rejectsAnUploadWithNoContentTypeAndDeletesTheObject() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        storage.putObject(mediaRef, null, 1024);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-rejected");

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isZero();
        assertThat(storage.exists(mediaRef)).isFalse();
    }

    // AC-9
    @Test
    void rejectsAMediaRefWithNoObjectInStorage() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        String mediaRef = issueUploadUrl(userId);
        // Deliberately never call storage.putObject - the client never finished the PUT.

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-unavailable");

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isZero();
    }

    // AC-9 (unknown media_ref, never issued at all)
    @Test
    void rejectsAMediaRefThatWasNeverIssued() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"uploads/" + UUID.randomUUID() + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-unavailable");
    }

    // AC-S: caller may not create an entry in a project owned by someone else.
    @Test
    void createEntryReturns404ForProjectOwnedByAnotherUser() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        UUID projectId = provisionProject(owner);
        String mediaRef = issueUploadUrl(intruder);
        storage.putObject(mediaRef, "image/jpeg", 1024);

        restTestClient.post().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(intruder))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + mediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isNotFound();

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(projectId))).isZero();
    }

    // AC-S: a media_ref issued to user A can never be claimed by user B, even into B's own project.
    @Test
    void createEntryRejectsAMediaRefIssuedToAnotherUser() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        UUID ownerProjectId = provisionProject(owner);
        UUID intruderProjectId = provisionProject(intruder);
        String ownersMediaRef = issueUploadUrl(owner);
        storage.putObject(ownersMediaRef, "image/jpeg", 1024);

        restTestClient.post().uri("/projects/{id}/entries", intruderProjectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(intruder))
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"" + ownersMediaRef + "\",\"idempotencyKey\":\"" + UUID.randomUUID() + "\"}")
                .exchange()
                .expectStatus().isBadRequest()
                .expectBody()
                .jsonPath("$.type").isEqualTo("urn:aihub:media-unavailable");

        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(ownerProjectId))).isZero();
        assertThat(dsl.fetchCount(Entries.TABLE, Entries.PROJECT_ID.eq(intruderProjectId))).isZero();
    }

    // Auth boundary on both new endpoints (same contract as the existing GET, spring-conventions).
    @Test
    void endpointsRejectMissingJwt() {
        restTestClient.post().uri("/media/upload-url").exchange().expectStatus().isUnauthorized();
        restTestClient.post().uri("/projects/{id}/entries", UUID.randomUUID())
                .contentType(MediaType.APPLICATION_JSON)
                .body("{\"mediaRef\":\"x\",\"idempotencyKey\":\"y\"}")
                .exchange()
                .expectStatus().isUnauthorized();
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

    private void insertOlderEntry(UUID projectId) {
        dsl.insertInto(Entries.TABLE)
                .set(Entries.PROJECT_ID, projectId)
                .set(Entries.TS, OffsetDateTime.now().minusDays(1))
                .set(Entries.SOURCE, "camera")
                .set(Entries.VALIDATION_STATUS, "pending")
                .set(Entries.PAYLOAD, JSONB.valueOf("{}"))
                .execute();
    }
}
