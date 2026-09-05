package dev.aihub.ingestion;

import dev.aihub.common.Tables.Entries;
import dev.aihub.common.Tables.Projects;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.jooq.Condition;
import org.jooq.DSLContext;
import org.jooq.impl.DSL;
import org.springframework.stereotype.Repository;

/**
 * Tenant isolation for {@code entries} is enforced structurally: every query here joins through
 * {@code projects} and filters on {@code projects.user_id} (spring-conventions - ownership join),
 * not merely on the caller having checked ownership first.
 */
@Repository
public class EntryRepository {

    private final DSLContext dsl;

    public EntryRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /**
     * One page of entries for {@code projectId} owned by {@code userId}, ordered by {@code ts}
     * descending, id-tiebroken. Returns an empty page for a project that does not exist or is
     * owned by a different user - the ownership join makes that indistinguishable at this layer,
     * matching {@link EntryService}'s pre-check.
     */
    public Page findPage(UUID projectId, String userId, int limit, EntryCursor cursor) {
        Condition condition = Entries.PROJECT_ID.eq(projectId).and(Projects.USER_ID.eq(userId));
        if (cursor != null) {
            condition = condition.and(
                    DSL.row(Entries.TS, Entries.ID).lt(DSL.row(cursor.ts(), cursor.id())));
        }

        List<Row> rows = dsl.select(Entries.ID, Entries.TS, Entries.SOURCE, Entries.VALIDATION_STATUS, Entries.PAYLOAD)
                .from(Entries.TABLE)
                .join(Projects.TABLE)
                .on(Entries.PROJECT_ID.eq(Projects.ID))
                .where(condition)
                .orderBy(Entries.TS.desc(), Entries.ID.desc())
                .limit(limit + 1)
                .fetch(record -> new Row(
                        record.get(Entries.ID),
                        record.get(Entries.TS),
                        record.get(Entries.SOURCE),
                        record.get(Entries.VALIDATION_STATUS),
                        record.get(Entries.PAYLOAD).data()));

        boolean hasMore = rows.size() > limit;
        List<Row> page = hasMore ? rows.subList(0, limit) : rows;
        EntryCursor nextCursor = hasMore ? new EntryCursor(page.getLast().ts(), page.getLast().id()) : null;
        return new Page(page, nextCursor);
    }

    record Row(UUID id, OffsetDateTime ts, String source, String validationStatus, String payloadJson) {
    }

    record Page(List<Row> items, EntryCursor nextCursor) {
    }
}
