package dev.aihub.support;

import java.util.UUID;
import org.jooq.DSLContext;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.client.RestTestClient;
import org.testcontainers.containers.PostgreSQLContainer;

/**
 * Shared Testcontainers Postgres + real-HTTP test client for KAN-4's endpoint tests. Every test
 * that uses this base picks a fresh random {@code user_id} (see {@link #uniqueUserId()}) rather
 * than relying on database cleanup between tests, since the Postgres container and Spring context
 * are shared across test classes for speed.
 *
 * <p>Deliberately NOT {@code @Testcontainers}/{@code @Container}: that annotation pair stops the
 * container in {@code afterAll} of whichever test class runs it, which breaks every subclass that
 * runs afterward when (as here) multiple classes share one container. This is Testcontainers'
 * documented "singleton container" pattern instead - start it once in a static initializer and
 * let its own Ryuk reaper clean it up at JVM exit.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT)
@Import(TestJwtSupport.class)
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:17-alpine");

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @LocalServerPort
    private int port;

    @Autowired
    protected DSLContext dsl;

    protected RestTestClient restTestClient;

    @BeforeEach
    void setUpRestTestClient() {
        restTestClient = RestTestClient.bindToServer().baseUrl("http://localhost:" + port).build();
    }

    protected static String uniqueUserId() {
        return "auth0|test-" + UUID.randomUUID();
    }
}
