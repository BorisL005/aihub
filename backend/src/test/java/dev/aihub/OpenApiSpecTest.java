package dev.aihub;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/**
 * AC-10: the endpoints this ticket introduces are described in the contract, committed in the
 * same change as their implementation. Plain unit test - a text check, no Spring context.
 */
class OpenApiSpecTest {

    @Test
    void specDescribesTheMediaUploadUrlAndCreateEntryEndpoints() throws IOException {
        Path specPath = Path.of("..", "api", "openapi.yaml");
        String spec = Files.readString(specPath);

        assertThat(spec).contains("/media/upload-url");
        assertThat(spec).contains("operationId: createMediaUploadUrl");
        assertThat(spec).contains("operationId: createEntry");
    }
}
