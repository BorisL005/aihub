package dev.aihub.llm;

import java.util.Map;
import java.util.concurrent.TimeUnit;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.resilience.annotation.ConcurrencyLimit;
import org.springframework.resilience.annotation.Retryable;
import org.springframework.stereotype.Component;

/**
 * Resolves a {@code project_type}'s logical model name (e.g. {@code "vision-cheap"}) to a
 * concrete call against the configured provider. This is the one class in the codebase allowed
 * to name a concrete provider type or model id (spring-conventions - "feature code never names a
 * provider or model id"); {@link dev.aihub.ingestion.ReceiptExtractionService} only ever passes
 * the logical name through.
 *
 * <p>v1 has exactly one provider (OpenAI, ARCHITECTURE.md's model table) behind one {@link
 * ChatModel} bean; every logical name maps to a model id on that same provider. A second
 * provider would add a second {@code ChatModel} bean and a lookup here, not a change to any
 * caller.
 */
@Component
public class ModelRegistry {

    private final ChatModel chatModel;
    private final Map<String, String> modelIdsByLogicalName;

    public ModelRegistry(ChatModel chatModel, LlmProperties properties) {
        this.chatModel = chatModel;
        this.modelIdsByLogicalName = properties.models();
    }

    /**
     * Calls the model behind {@code logicalModelName} with {@code prompt}. Wrapped with Framework
     * 7's jittered-backoff retry and a concurrency cap (ARCHITECTURE.md §2 / Notes for dev on
     * KAN-6) rather than Resilience4j; Spring AI's own built-in retry is disabled
     * ({@code spring.ai.retry.max-attempts=1}, application.yml) so the two layers never stack.
     * Only this method - never the caller - is annotated, so the proxy-based retry/limit actually
     * applies (a self-invoked call on the same bean would bypass it).
     */
    @Retryable(maxRetries = 2, delay = 200, multiplier = 2.0, jitter = 100, timeUnit = TimeUnit.MILLISECONDS)
    @ConcurrencyLimit(4)
    public ChatResponse call(String logicalModelName, Prompt prompt) {
        String modelId = modelIdsByLogicalName.get(logicalModelName);
        if (modelId == null) {
            throw new IllegalStateException("no concrete model id configured for logical model '" + logicalModelName
                    + "' (aihub.llm.models." + logicalModelName + ")");
        }
        Prompt resolvedPrompt = new Prompt(
                prompt.getInstructions(), OpenAiChatOptions.builder().model(modelId).build());
        return chatModel.call(resolvedPrompt);
    }
}
