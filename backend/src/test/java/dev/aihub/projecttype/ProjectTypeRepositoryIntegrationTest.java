package dev.aihub.projecttype;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.Projects;
import dev.aihub.ingestion.ProjectRepository;
import dev.aihub.support.AbstractIntegrationTest;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ProjectTypeRepositoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private ProjectTypeRepository projectTypeRepository;

    // AC-1: the seeded receipts row's prompt identifier and logical model name.
    @Test
    void findExtractionConfigReturnsThePromptIdentifierAndLogicalModelForTheOwner() {
        String userId = uniqueUserId();
        UUID projectId = provisionProject(userId);

        Optional<ExtractionConfig> config = projectTypeRepository.findExtractionConfig(projectId, userId);

        assertThat(config).isPresent();
        assertThat(config.get().extractionPrompt()).isEqualTo("receipt_extraction/v1");
        assertThat(config.get().extractionModel()).isEqualTo("vision-cheap");
    }

    // AC-S: a project owned by user A is invisible to this lookup when queried as user B.
    @Test
    void findExtractionConfigIsEmptyForAnotherUsersProject() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        UUID projectId = provisionProject(owner);

        assertThat(projectTypeRepository.findExtractionConfig(projectId, intruder)).isEmpty();
    }

    // AC-S
    @Test
    void findExtractionConfigIsEmptyForANonexistentProject() {
        assertThat(projectTypeRepository.findExtractionConfig(UUID.randomUUID(), uniqueUserId()))
                .isEmpty();
    }

    private UUID provisionProject(String userId) {
        projectRepository.ensureReceiptsProject(userId);
        return dsl.select(Projects.ID)
                .from(Projects.TABLE)
                .where(Projects.USER_ID.eq(userId))
                .fetchOne(Projects.ID);
    }
}
