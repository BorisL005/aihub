package dev.aihub.llm;

import dev.aihub.common.Tables.LlmCalls;
import java.util.UUID;
import org.jooq.DSLContext;
import org.springframework.stereotype.Repository;

/**
 * Append-only log of outbound model calls (ARCHITECTURE.md: "Observability in v1 is this
 * table"). Never exposed through any API - {@code entry_id} is the only link back to tenant
 * data, and nothing in this ticket reads these rows by user, so there is no ownership-join query
 * to test here (spring-conventions' tenant-isolation test rule applies to queries that return
 * tenant data to a caller; this repository only ever writes).
 */
@Repository
public class LlmCallRepository {

    private final DSLContext dsl;

    public LlmCallRepository(DSLContext dsl) {
        this.dsl = dsl;
    }

    /** AC-3: one row per outbound call attempt, whatever its outcome. */
    public void record(
            UUID entryId,
            String promptVersion,
            String model,
            Integer inputTokens,
            Integer outputTokens,
            long latencyMs,
            String validationOutcome) {
        dsl.insertInto(LlmCalls.TABLE)
                .set(LlmCalls.ENTRY_ID, entryId)
                .set(LlmCalls.PROMPT_VERSION, promptVersion)
                .set(LlmCalls.MODEL, model)
                .set(LlmCalls.INPUT_TOKENS, inputTokens)
                .set(LlmCalls.OUTPUT_TOKENS, outputTokens)
                .set(LlmCalls.LATENCY_MS, (int) latencyMs)
                .set(LlmCalls.VALIDATION_OUTCOME, validationOutcome)
                .execute();
    }
}
