package dev.aihub;

import static org.assertj.core.api.Assertions.assertThat;

import dev.aihub.support.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;

class HealthEndpointIntegrationTest extends AbstractIntegrationTest {

    @Test
    void healthEndpointReturnsUpAgainstRealPostgresContainer() {
        restTestClient.get().uri("/actuator/health").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.status").isEqualTo("UP");
    }

    @Test
    void contextWiresJooqAndFlywayAgainstRealDatabase() {
        Number result = (Number) dsl.fetchValue("select 1");
        assertThat(result.intValue()).isEqualTo(1);

        Number flywayTableCount = (Number) dsl.fetchValue(
                "select count(*) from information_schema.tables where table_name = 'flyway_schema_history'");
        assertThat(flywayTableCount.intValue()).isEqualTo(1);
    }
}
