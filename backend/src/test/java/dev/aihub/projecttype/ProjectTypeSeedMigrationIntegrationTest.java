package dev.aihub.projecttype;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.aihub.common.Tables.ProjectTypes;
import dev.aihub.support.AbstractIntegrationTest;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import org.jooq.Record;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

class ProjectTypeSeedMigrationIntegrationTest extends AbstractIntegrationTest {

    private static final Set<String> EXPECTED_FIELDS = Set.of(
            "merchant", "purchased_at", "total", "currency", "tax_total", "payment_method", "line_items");
    private static final Set<String> EXPECTED_REQUIRED_FIELDS =
            Set.of("merchant", "purchased_at", "total", "currency");

    @Autowired
    private ObjectMapper objectMapper;

    // AC-6
    @Test
    void seedsReceiptsProjectTypeWithExactFieldSchemaAndLogicalModelNames() throws Exception {
        Record row = dsl
                .select(ProjectTypes.NAME, ProjectTypes.SCHEMA, ProjectTypes.EXTRACTION_MODEL, ProjectTypes.ANSWER_MODEL)
                .from(ProjectTypes.TABLE)
                .where(ProjectTypes.NAME.eq("receipts"))
                .fetchOne();

        assertThat(row).isNotNull();

        JsonNode schema = objectMapper.readTree(row.get(ProjectTypes.SCHEMA).data());

        List<String> properties = new ArrayList<>();
        schema.get("properties").fieldNames().forEachRemaining(properties::add);
        assertThat(properties).containsExactlyInAnyOrderElementsOf(EXPECTED_FIELDS);

        List<String> required = new ArrayList<>();
        schema.get("required").forEach(node -> required.add(node.asText()));
        assertThat(required).containsExactlyInAnyOrderElementsOf(EXPECTED_REQUIRED_FIELDS);

        String extractionModel = row.get(ProjectTypes.EXTRACTION_MODEL);
        String answerModel = row.get(ProjectTypes.ANSWER_MODEL);
        assertThat(extractionModel).isNotBlank();
        assertThat(answerModel).isNotBlank();
        assertThat(extractionModel.toLowerCase()).doesNotContain("gpt", "gemini", "claude", "sonnet", "opus");
        assertThat(answerModel.toLowerCase()).doesNotContain("gpt", "gemini", "claude", "sonnet", "opus");
    }

    // AC-9
    @Test
    void hasNoUsersTableAfterMigrationsRun() {
        Number count = (Number) dsl.fetchValue(
                "select count(*) from information_schema.tables where table_name = 'users'");
        assertThat(count.intValue()).isZero();
    }
}
