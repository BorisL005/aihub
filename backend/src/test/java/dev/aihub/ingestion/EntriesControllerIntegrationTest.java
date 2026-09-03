package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import dev.aihub.common.Tables.Entries;
import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.TestJwtSupport;
import java.nio.charset.StandardCharsets;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.JSONB;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class EntriesControllerIntegrationTest extends AbstractIntegrationTest {

    // AC-3
    @Test
    void listEntriesReturnsEmptyListForProjectWithNoEntries() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(0)
                .jsonPath("$.nextCursor").doesNotExist();
    }

    // AC-4
    @Test
    void listEntriesPaginatesTwentyFiveEntriesOrderedByTsDescendingWithCursor() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        OffsetDateTime base = OffsetDateTime.now();
        for (int i = 0; i < 25; i++) {
            insertEntry(projectId, base.minusMinutes(i), "camera", "pending");
        }

        byte[] firstPageBody = restTestClient.get().uri("/projects/{id}/entries?limit=20", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(20)
                .jsonPath("$.items[0].id").exists()
                .jsonPath("$.items[0].ts").exists()
                .jsonPath("$.items[0].source").isEqualTo("camera")
                .jsonPath("$.items[0].validationStatus").isEqualTo("pending")
                .jsonPath("$.items[0].payload").exists()
                .jsonPath("$.nextCursor").exists()
                .returnResult()
                .getResponseBody();
        String cursor = JsonPath.read(new String(firstPageBody, StandardCharsets.UTF_8), "$.nextCursor");

        restTestClient.get().uri("/projects/{id}/entries?limit=20&cursor={cursor}", projectId, cursor)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(5)
                .jsonPath("$.nextCursor").doesNotExist();
    }

    // AC-4 (cursor precision): entries sharing a timestamp across a page boundary must not be
    // silently dropped by cursor truncation.
    @Test
    void listEntriesDoesNotSkipEntriesSharingTheSameTimestampAcrossAPageBoundary() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        OffsetDateTime sharedTs = OffsetDateTime.now();
        for (int i = 0; i < 3; i++) {
            insertEntry(projectId, sharedTs, "camera", "pending");
        }

        byte[] firstPageBody = restTestClient.get().uri("/projects/{id}/entries?limit=1", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(1)
                .jsonPath("$.nextCursor").exists()
                .returnResult()
                .getResponseBody();
        String cursor = JsonPath.read(new String(firstPageBody, StandardCharsets.UTF_8), "$.nextCursor");

        restTestClient.get().uri("/projects/{id}/entries?limit=10&cursor={cursor}", projectId, cursor)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(2);
    }

    // Notes for dev: reject a limit above 100 with 400
    @Test
    void listEntriesRejects400ForLimitAboveMaximum() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries?limit=101", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isBadRequest();
    }

    @Test
    void listEntriesRejects400ForLimitBelowMinimum() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries?limit=0", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // AC-4 / EntryCursor.decode
    @Test
    void listEntriesRejects400ForMalformedCursor() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries?cursor=not-a-real-cursor", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // AC-5
    @Test
    void listEntriesReturns404ForNonexistentProject() {
        String userId = uniqueUserId();
        provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries", UUID.randomUUID())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.detail").exists();
    }

    // AC-S
    @Test
    void listEntriesReturns404ForProjectOwnedByAnotherUser() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        UUID projectId = provisionProject(owner);
        insertEntry(projectId, OffsetDateTime.now(), "camera", "pending");

        restTestClient.get().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(intruder))
                .exchange()
                .expectStatus().isNotFound()
                .expectBody()
                .jsonPath("$.items").doesNotExist();
    }

    // AC-2
    @Test
    void listEntriesRejectsMissingMalformedAndExpiredJwt() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries", projectId).exchange().expectStatus().isUnauthorized();

        restTestClient.get().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-jwt")
                .exchange()
                .expectStatus().isUnauthorized();

        restTestClient.get().uri("/projects/{id}/entries", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.expiredToken(userId))
                .exchange()
                .expectStatus().isUnauthorized();
    }

    private UUID provisionProject(String userId) {
        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk();
        return dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userId))
                .fetchOne(Projects.ID);
    }

    private void insertEntry(UUID projectId, OffsetDateTime ts, String source, String validationStatus) {
        dsl.insertInto(Entries.TABLE)
                .set(Entries.PROJECT_ID, projectId)
                .set(Entries.TS, ts)
                .set(Entries.SOURCE, source)
                .set(Entries.VALIDATION_STATUS, validationStatus)
                .set(Entries.PAYLOAD, JSONB.valueOf("{}"))
                .execute();
    }
}
