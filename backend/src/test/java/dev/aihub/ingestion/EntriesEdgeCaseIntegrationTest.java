package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.TestJwtSupport;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.JSONB;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

/**
 * QA edge-case probes beyond KAN-4's mapped AC tests: pagination boundaries, malformed path
 * variables, and a JWT shape the existing suite never exercises (missing {@code sub}).
 */
class EntriesEdgeCaseIntegrationTest extends AbstractIntegrationTest {

    // Pagination boundary: limit=1 (the documented minimum) must return exactly one item, not be
    // silently clamped or rejected.
    @Test
    void listEntriesAcceptsLimitAtExactlyOne() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        insertEntry(projectId, OffsetDateTime.now(), "camera", "pending");
        insertEntry(projectId, OffsetDateTime.now().minusMinutes(1), "camera", "pending");

        restTestClient.get().uri("/projects/{id}/entries?limit=1", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(1)
                .jsonPath("$.nextCursor").exists();
    }

    // Pagination boundary: limit=100 (the documented maximum) must be accepted, not rejected -
    // the existing suite only proves 101 is rejected and 20 (the default) works.
    @Test
    void listEntriesAcceptsLimitAtExactlyOneHundred() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);
        OffsetDateTime base = OffsetDateTime.now();
        for (int i = 0; i < 100; i++) {
            insertEntry(projectId, base.minusMinutes(i), "camera", "pending");
        }

        restTestClient.get().uri("/projects/{id}/entries?limit=100", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.items.length()").isEqualTo(100)
                .jsonPath("$.nextCursor").doesNotExist();
    }

    // A non-integer limit (type binding failure, not a range violation) must still be rejected
    // cleanly rather than surfacing as an unhandled 500.
    @Test
    void listEntriesRejects400ForNonNumericLimit() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries?limit=not-a-number", projectId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // A projectId path segment that isn't a UUID at all (not merely "a UUID that doesn't exist",
    // which is what AC-5's test covers) must not surface as an unhandled 500.
    @Test
    void listEntriesRejects400ForMalformedProjectIdPathVariable() {
        String userId = uniqueUserId();
        provisionProject(userId);

        restTestClient.get().uri("/projects/{id}/entries", "not-a-uuid")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isBadRequest();
    }

    // AC-2 / AC-9 edge case: a validly-signed, correct-issuer/audience, non-expired JWT that
    // simply carries no `sub` claim (distinct from an empty-string subject) is a shape the
    // existing "missing/malformed/expired" suite never exercises. `user_id` is NOT NULL in the
    // schema (V1 migration), so if this reaches the repository layer with a null user id it
    // should fail loudly - the AC-2 contract ("401, no project provisioned") is violated if it
    // instead reaches the database and either provisions a NULL-owned project or blows up as an
    // unhandled 500.
    @Test
    void listProjectsRejectsJwtWithNoSubjectClaimAndProvisionsNothing() {
        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.noSubjectToken())
                .exchange()
                .expectStatus().isUnauthorized();

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.isNull())).isZero();
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
        dsl.insertInto(dev.aihub.common.Tables.Entries.TABLE)
                .set(dev.aihub.common.Tables.Entries.PROJECT_ID, projectId)
                .set(dev.aihub.common.Tables.Entries.TS, ts)
                .set(dev.aihub.common.Tables.Entries.SOURCE, source)
                .set(dev.aihub.common.Tables.Entries.VALIDATION_STATUS, validationStatus)
                .set(dev.aihub.common.Tables.Entries.PAYLOAD, JSONB.valueOf("{}"))
                .execute();
    }
}
