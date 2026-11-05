package dev.aihub.common;

import static org.jooq.impl.DSL.field;
import static org.jooq.impl.DSL.name;
import static org.jooq.impl.DSL.table;

import java.time.OffsetDateTime;
import java.util.UUID;
import org.jooq.Field;
import org.jooq.JSONB;
import org.jooq.Record;
import org.jooq.Table;
import org.jooq.impl.SQLDataType;

/**
 * Hand-written jOOQ table and field references. The project has no jOOQ codegen step (it would
 * require a live database at build time); this class is the single place table/column names are
 * spelled, so a rename only has to happen here.
 */
public final class Tables {

    private Tables() {
    }

    public static final class ProjectTypes {

        public static final Table<Record> TABLE = table(name("project_types"));
        public static final Field<UUID> ID = field(name("project_types", "id"), SQLDataType.UUID);
        public static final Field<String> NAME = field(name("project_types", "name"), SQLDataType.VARCHAR);
        public static final Field<JSONB> SCHEMA = field(name("project_types", "schema"), SQLDataType.JSONB);
        public static final Field<String> EXTRACTION_PROMPT =
                field(name("project_types", "extraction_prompt"), SQLDataType.VARCHAR);
        public static final Field<String> EXTRACTION_MODEL =
                field(name("project_types", "extraction_model"), SQLDataType.VARCHAR);
        public static final Field<String> ANSWER_MODEL =
                field(name("project_types", "answer_model"), SQLDataType.VARCHAR);

        private ProjectTypes() {
        }
    }

    public static final class Projects {

        public static final Table<Record> TABLE = table(name("projects"));
        public static final Field<UUID> ID = field(name("projects", "id"), SQLDataType.UUID);
        public static final Field<String> USER_ID = field(name("projects", "user_id"), SQLDataType.VARCHAR);
        public static final Field<UUID> PROJECT_TYPE_ID =
                field(name("projects", "project_type_id"), SQLDataType.UUID);
        public static final Field<String> NAME = field(name("projects", "name"), SQLDataType.VARCHAR);

        private Projects() {
        }
    }

    public static final class Entries {

        public static final Table<Record> TABLE = table(name("entries"));
        public static final Field<UUID> ID = field(name("entries", "id"), SQLDataType.UUID);
        public static final Field<UUID> PROJECT_ID = field(name("entries", "project_id"), SQLDataType.UUID);
        public static final Field<OffsetDateTime> TS =
                field(name("entries", "ts"), SQLDataType.TIMESTAMPWITHTIMEZONE);
        public static final Field<String> SOURCE = field(name("entries", "source"), SQLDataType.VARCHAR);
        public static final Field<String> VALIDATION_STATUS =
                field(name("entries", "validation_status"), SQLDataType.VARCHAR);
        public static final Field<JSONB> PAYLOAD = field(name("entries", "payload"), SQLDataType.JSONB);
        public static final Field<String> MEDIA_REF = field(name("entries", "media_ref"), SQLDataType.VARCHAR);
        public static final Field<String> IDEMPOTENCY_KEY =
                field(name("entries", "idempotency_key"), SQLDataType.VARCHAR);
        public static final Field<JSONB> RAW_EXTRACTION =
                field(name("entries", "raw_extraction"), SQLDataType.JSONB);

        private Entries() {
        }
    }

    public static final class MediaUploads {

        public static final Table<Record> TABLE = table(name("media_uploads"));
        public static final Field<String> MEDIA_REF = field(name("media_uploads", "media_ref"), SQLDataType.VARCHAR);
        public static final Field<String> USER_ID = field(name("media_uploads", "user_id"), SQLDataType.VARCHAR);
        public static final Field<OffsetDateTime> CREATED_AT =
                field(name("media_uploads", "created_at"), SQLDataType.TIMESTAMPWITHTIMEZONE);
        public static final Field<OffsetDateTime> CLAIMED_AT =
                field(name("media_uploads", "claimed_at"), SQLDataType.TIMESTAMPWITHTIMEZONE);

        private MediaUploads() {
        }
    }

    public static final class LlmCalls {

        public static final Table<Record> TABLE = table(name("llm_calls"));
        public static final Field<UUID> ID = field(name("llm_calls", "id"), SQLDataType.UUID);
        public static final Field<UUID> ENTRY_ID = field(name("llm_calls", "entry_id"), SQLDataType.UUID);
        public static final Field<String> PROMPT_VERSION =
                field(name("llm_calls", "prompt_version"), SQLDataType.VARCHAR);
        public static final Field<String> MODEL = field(name("llm_calls", "model"), SQLDataType.VARCHAR);
        public static final Field<Integer> INPUT_TOKENS =
                field(name("llm_calls", "input_tokens"), SQLDataType.INTEGER);
        public static final Field<Integer> OUTPUT_TOKENS =
                field(name("llm_calls", "output_tokens"), SQLDataType.INTEGER);
        public static final Field<Integer> LATENCY_MS =
                field(name("llm_calls", "latency_ms"), SQLDataType.INTEGER);
        public static final Field<String> VALIDATION_OUTCOME =
                field(name("llm_calls", "validation_outcome"), SQLDataType.VARCHAR);

        private LlmCalls() {
        }
    }
}
