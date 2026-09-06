package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ProjectRepositoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProjectRepository projectRepository;

    // AC-9
    @Test
    void ensureReceiptsProjectStoresJwtSubClaimVerbatimAsUserId() {
        String userId = "auth0|abc123-" + UUID.randomUUID();

        projectRepository.ensureReceiptsProject(userId);

        String storedUserId = dsl.select(Projects.USER_ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userId))
                .fetchOne(Projects.USER_ID);
        assertThat(storedUserId).isEqualTo(userId);
    }

    // AC-11 (structural half - one row per user, no duplicates from a repeated call)
    @Test
    void ensureReceiptsProjectIsIdempotentForTheSameUser() {
        String userId = uniqueUserId();

        projectRepository.ensureReceiptsProject(userId);
        projectRepository.ensureReceiptsProject(userId);

        assertThat(dsl.fetchCount(Projects.TABLE, Projects.USER_ID.eq(userId))).isEqualTo(1);
    }

    // AC-S (decision 2's "never attach to another user's user_id")
    @Test
    void ensureReceiptsProjectCreatesSeparateProjectsForDifferentUsers() {
        String userA = uniqueUserId();
        String userB = uniqueUserId();

        projectRepository.ensureReceiptsProject(userA);
        projectRepository.ensureReceiptsProject(userB);

        UUID projectA = dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userA))
                .fetchOne(Projects.ID);
        UUID projectB = dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userB))
                .fetchOne(Projects.ID);

        assertThat(projectA).isNotNull().isNotEqualTo(projectB);
    }

    // AC-S
    @Test
    void isOwnedByUserReturnsFalseForAnotherUsersProject() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        projectRepository.ensureReceiptsProject(owner);
        UUID projectId = dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(owner))
                .fetchOne(Projects.ID);

        assertThat(projectRepository.isOwnedByUser(projectId, owner)).isTrue();
        assertThat(projectRepository.isOwnedByUser(projectId, intruder)).isFalse();
    }

    // AC-5 / AC-S
    @Test
    void isOwnedByUserReturnsFalseForNonexistentProject() {
        assertThat(projectRepository.isOwnedByUser(UUID.randomUUID(), uniqueUserId())).isFalse();
    }
}
