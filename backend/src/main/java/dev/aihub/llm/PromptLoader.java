package dev.aihub.llm;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.util.StreamUtils;

/**
 * Resolves a {@code project_type.extraction_prompt} value (e.g. {@code "receipt_extraction/v1"})
 * to the versioned classpath resource it names. The prompt text lives only in that resource file
 * - this class is the one place that turns an identifier into file content, so a prompt is never
 * duplicated as a string literal elsewhere (spring-conventions).
 */
@Component
public class PromptLoader {

    private static final String PROMPTS_ROOT = "prompts/";
    private static final String TEMPLATE_EXTENSION = ".st";

    /** The template text for {@code promptVersion}, e.g. {@code "receipt_extraction/v1"}. */
    public String loadText(String promptVersion) {
        Resource resource = resolve(promptVersion);
        try {
            return StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new UncheckedIOException("failed to load prompt resource for '" + promptVersion + "'", e);
        }
    }

    private Resource resolve(String promptVersion) {
        return new ClassPathResource(PROMPTS_ROOT + promptVersion + TEMPLATE_EXTENSION);
    }
}
