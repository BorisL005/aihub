package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import dev.aihub.support.TestJwtSupport;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

class ProjectsControllerIntegrationTest extends AbstractIntegrationTest {

    // AC-1
    @Test
    void listProjectsReturnsOnlyCallersProjectsWithTypeName() {
        String userId = uniqueUserId();

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.length()").isEqualTo(1)
                .jsonPath("$[0].id").exists()
                .jsonPath("$[0].name").isEqualTo("Receipts")
                .jsonPath("$[0].projectType").isEqualTo("receipts");
    }

    // AC-1 (isolation half)
    @Test
    void listProjectsDoesNotReturnAnotherUsersProjects() {
        String userA = uniqueUserId();
        String userB = uniqueUserId();
        callListProjects(userA);
        callListProjects(userB);

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userA))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.length()").isEqualTo(1);
    }

    // AC-2
    @Test
    void listProjectsRejectsMissingJwt() {
        restTestClient.get().uri("/projects").exchange().expectStatus().isUnauthorized();
    }

    // AC-2
    @Test
    void listProjectsRejectsMalformedJwt() {
        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer not-a-real-jwt")
                .exchange()
                .expectStatus().isUnauthorized();
    }

    // AC-2
    @Test
    void listProjectsRejectsExpiredJwtAndProvisionsNothing() {
        String userId = uniqueUserId();

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.expiredToken(userId))
                .exchange()
                .expectStatus().isUnauthorized();

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isZero();
    }

    // AC-2 (issuer validation - mirrors SecurityConfig.jwtDecoder's issuer pinning)
    @Test
    void listProjectsRejectsJwtFromAnUnexpectedIssuerAndProvisionsNothing() {
        String userId = uniqueUserId();

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.wrongIssuerToken(userId))
                .exchange()
                .expectStatus().isUnauthorized();

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isZero();
    }

    // AC-2 (audience validation - a token minted for a different API in the same tenant)
    @Test
    void listProjectsRejectsJwtWithAnUnexpectedAudienceAndProvisionsNothing() {
        String userId = uniqueUserId();

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.wrongAudienceToken(userId))
                .exchange()
                .expectStatus().isUnauthorized();

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isZero();
    }

    // AC-10
    @Test
    void firstAuthenticatedRequestProvisionsExactlyOneReceiptsProject() {
        String userId = uniqueUserId();

        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.length()").isEqualTo(1)
                .jsonPath("$[0].name").isEqualTo("Receipts")
                .jsonPath("$[0].projectType").isEqualTo("receipts");

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isEqualTo(1);
    }

    // AC-11
    @Test
    void repeatedAndConcurrentRequestsProvisionOnlyOneReceiptsProject() throws Exception {
        String userId = uniqueUserId();

        callListProjects(userId);
        callListProjects(userId);

        int concurrency = 8;
        ExecutorService pool = Executors.newFixedThreadPool(concurrency);
        CountDownLatch ready = new CountDownLatch(concurrency);
        CountDownLatch go = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < concurrency; i++) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    awaitUninterruptibly(go);
                    callListProjects(userId);
                }));
            }
            ready.await();
            go.countDown();
            for (Future<?> future : futures) {
                future.get();
            }
        } finally {
            pool.shutdown();
        }

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isEqualTo(1);
    }

    private void callListProjects(String userId) {
        restTestClient.get().uri("/projects")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + TestJwtSupport.validToken(userId))
                .exchange()
                .expectStatus().isOk();
    }

    private static void awaitUninterruptibly(CountDownLatch latch) {
        try {
            latch.await();
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
