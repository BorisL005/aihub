package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.common.Tables.Entries;
import dev.aihub.common.Tables.Projects;
import dev.aihub.support.AbstractIntegrationTest;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.JSONB;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class EntryRepositoryIntegrationTest extends AbstractIntegrationTest {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private EntryRepository entryRepository;

    // AC-S: the ownership join must exclude another user's project even when the caller
    // supplies its real id - this is the repository-level proof the controller-level 404 test
    // cannot provide, since EntryRepository takes no dependency on ProjectRepository's check.
    @Test
    void findPageReturnsNoEntriesForAnotherUsersProject() {
        String owner = uniqueUserId();
        String intruder = uniqueUserId();
        UUID projectId = provisionProject(owner);
        insertEntry(projectId, OffsetDateTime.now(), "camera", "pending");

        EntryRepository.Page ownerPage = entryRepository.findPage(projectId, owner, 20, null);
        EntryRepository.Page intruderPage = entryRepository.findPage(projectId, intruder, 20, null);

        assertThat(ownerPage.items()).hasSize(1);
        assertThat(intruderPage.items()).isEmpty();
        assertThat(intruderPage.nextCursor()).isNull();
    }

    // Same shape as isOwnedByUserReturnsFalseForNonexistentProject, at the entries layer.
    @Test
    void findPageReturnsNoEntriesForNonexistentProject() {
        String userId = uniqueUserId();

        EntryRepository.Page page = entryRepository.findPage(UUID.randomUUID(), userId, 20, null);

        assertThat(page.items()).isEmpty();
    }

    private UUID provisionProject(String userId) {
        projectRepository.ensureReceiptsProject(userId);
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
