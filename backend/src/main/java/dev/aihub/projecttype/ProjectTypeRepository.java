package dev.aihub.projecttype;

import dev.aihub.common.Tables.ProjectTypes;
import dev.aihub.common.Tables.Projects;
import java.util.Optional;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * Reads the {@code project_types} catalog row through its owning project. Tenant isolation
 * (spring-conventions): this query touches {@code projects}, so it filters on
 * {@code projects.user_id} even though {@link dev.aihub.ingestion.EntryService} has already
 * checked ownership before calling here - the same defense-in-depth pattern {@link
 * dev.aihub.ingestion.EntryRepository} uses.
 */
@Repository
public class ProjectTypeRepository {

    private final DSLContext dsl;

    public ProjectTypeRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** Empty if {@code projectId} does not exist or is not owned by {@code userId} (AC-S). */
    public Optional<ExtractionConfig> findExtractionConfig(UUID projectId, String userId) {
        return dsl.select(ProjectTypes.EXTRACTION_PROMPT, ProjectTypes.EXTRACTION_MODEL)
                .from(ProjectTypes.TABLE)
                .join(Projects.TABLE)
                .on(Projects.PROJECT_TYPE_ID.eq(ProjectTypes.ID))
                .where(Projects.ID.eq(projectId).and(Projects.USER_ID.eq(userId)))
                .fetchOptional(record -> new ExtractionConfig(
                        record.get(ProjectTypes.EXTRACTION_PROMPT), record.get(ProjectTypes.EXTRACTION_MODEL)));
    }
}
