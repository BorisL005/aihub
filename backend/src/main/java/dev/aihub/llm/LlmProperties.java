package dev.aihub.llm;

import java.util.Map;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Maps the logical model names stored in {@code project_types} (e.g. {@code "vision-cheap"}) to
 * a concrete provider model id (e.g. {@code "gpt-5-mini"}). Changing which model a logical name
 * resolves to is a configuration change (env var), never a code change - ARCHITECTURE.md: "Model
 * experiments = editing a DB row", and the DB row only ever names the logical tier.
 *
 * @param models logical name -&gt; concrete model id, read from {@code aihub.llm.models.*}.
 */
@ConfigurationProperties(prefix = "aihub.llm")
public record LlmProperties(Map<String, String> models) {
}
