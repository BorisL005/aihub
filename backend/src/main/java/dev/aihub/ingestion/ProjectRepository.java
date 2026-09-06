package dev.aihub.ingestion;

import dev.aihub.common.Tables.ProjectTypes;
import dev.aihub.common.Tables.Projects;
import java.util.List;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * Tenant isolation for {@code projects}: every method here filters by {@code user_id}, which
 * must come only from the validated JWT (spring-conventions - never a path/query/body value).
 */
@Repository
public class ProjectRepository {

    static final String RECEIPTS_PROJECT_TYPE = "receipts";
    private static final String RECEIPTS_PROJECT_NAME = "Receipts";

    private final DSLContext dsl;

    public ProjectRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * Idempotent at the database level: a unique constraint on
     * {@code (user_id, project_type_id)} plus {@code ON CONFLICT DO NOTHING} means two
     * concurrent calls for the same user can never create two rows (AC-11).
     */
    public void ensureReceiptsProject(String userId) {
        UUID receiptsTypeId = dsl.select(ProjectTypes.ID)
                .from(ProjectTypes.TABLE)
                .where(ProjectTypes.NAME.eq(RECEIPTS_PROJECT_TYPE))
                .fetchOne(ProjectTypes.ID);
        if (receiptsTypeId == null) {
            throw new IllegalStateException("receipts project_type is not seeded");
        }

        dsl.insertInto(Projects.TABLE)
                .set(Projects.USER_ID, userId)
                .set(Projects.PROJECT_TYPE_ID, receiptsTypeId)
                .set(Projects.NAME, RECEIPTS_PROJECT_NAME)
                .onConflict(Projects.USER_ID, Projects.PROJECT_TYPE_ID)
                .doNothing()
                .execute();
    }

    public List<ProjectResponse> findAllByUserId(String userId) {
        return dsl.select(Projects.ID, Projects.NAME, ProjectTypes.NAME)
                .from(Projects.TABLE)
                .join(ProjectTypes.TABLE)
                .on(Projects.PROJECT_TYPE_ID.eq(ProjectTypes.ID))
                .where(Projects.USER_ID.eq(userId))
                .orderBy(Projects.NAME)
                .fetch(record -> new ProjectResponse(
                        record.get(Projects.ID), record.get(Projects.NAME), record.get(ProjectTypes.NAME)));
    }

    public boolean isOwnedByUser(UUID projectId, String userId) {
        return dsl.fetchExists(dsl.selectOne()
                .from(Projects.TABLE)
                .where(Projects.ID.eq(projectId).and(Projects.USER_ID.eq(userId))));
    }
}
