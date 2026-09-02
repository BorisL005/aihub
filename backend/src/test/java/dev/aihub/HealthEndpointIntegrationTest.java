package dev.aihub;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Map;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.springframework.web.bind.annotation.RestController;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
class HealthEndpointIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @LocalServerPort
    private int port;

    @Autowired
    private DSLContext dslContext;

    @Autowired
    private ConfigurableApplicationContext applicationContext;

    private RestTestClient restTestClient;

    @BeforeEach
    void setUp() {
        restTestClient = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    @Test
    void healthEndpointReturnsUpAgainstRealPostgresContainer() {
        restTestClient.get().uri("/actuator/health").exchange()
                .expectStatus().isOk()
                .expectBody().jsonPath("$.status").isEqualTo("UP");
    }

    @Test
    void contextWiresJooqAndFlywayAgainstRealDatabase() {
        Number result = (Number) dslContext.fetchValue("select 1");
        assertThat(result.intValue()).isEqualTo(1);

        Number flywayTableCount = (Number) dslContext.fetchValue(
                "select count(*) from information_schema.tables where table_name = 'flyway_schema_history'");
        assertThat(flywayTableCount.intValue()).isEqualTo(1);
    }

    @Test
    void containsNoApplicationControllersServicesOrRepositories() {
        Map<String, Object> controllers = applicationContext.getBeansWithAnnotation(RestController.class);

        assertThat(controllers).isEmpty();
    }
}
