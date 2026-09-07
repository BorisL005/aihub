package dev.aihub.support;

import dev.aihub.ingestion.ObjectStorageClient;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Provides the {@link FakeObjectStorageClient} bean so the app context can start without
 * {@code r2.*} configured - mirrors {@link TestJwtSupport}'s role for {@code auth0.*}.
 */
@TestConfiguration
public class TestObjectStorageSupport {

    @Bean
    ObjectStorageClient objectStorageClient() {
        return new FakeObjectStorageClient();
    }
}
