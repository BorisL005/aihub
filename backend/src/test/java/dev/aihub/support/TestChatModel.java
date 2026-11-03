package dev.aihub.support;

import java.util.List;
import java.util.function.Function;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.metadata.ChatResponseMetadata;
import org.springframework.ai.chat.metadata.DefaultUsage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.chat.model.Generation;
import org.springframework.ai.chat.prompt.Prompt;

/**
 * In-memory {@link ChatModel} double (spring-conventions: LLM providers are a true external,
 * mocked in tests). Defaults to a valid receipt extraction on every call, so tests that aren't
 * about extraction's failure paths see the ordinary {@code extracted} outcome without each
 * having to configure a response; KAN-6-specific tests call {@link #respondWithJson} or
 * {@link #failAllCallsWith} to exercise AC-2/AC-3/AC-8. {@link #reset()} is called before every
 * test (see {@link AbstractIntegrationTest}) so no test's configuration leaks into the next.
 */
public class TestChatModel implements ChatModel {

    private static final String DEFAULT_VALID_RECEIPT_JSON =
            "{\"merchant\":\"Test Merchant\",\"purchased_at\":\"2026-01-15\",\"total\":12.34,\"currency\":\"CAD\"}";

    private volatile Function<Prompt, ChatResponse> behavior = prompt -> response(DEFAULT_VALID_RECEIPT_JSON);
    private volatile RuntimeException failure;

    @Override
    public ChatResponse call(Prompt prompt) {
        RuntimeException toThrow = failure;
        if (toThrow != null) {
            throw toThrow;
        }
        return behavior.apply(prompt);
    }

    /** The next (and every subsequent, until {@link #reset()}) call returns this response text. */
    public void respondWithJson(String json) {
        this.behavior = prompt -> response(json);
        this.failure = null;
    }

    /** Every call (including every retry attempt) throws {@code exception} until {@link #reset()} - AC-8. */
    public void failAllCallsWith(RuntimeException exception) {
        this.failure = exception;
    }

    public void reset() {
        this.behavior = prompt -> response(DEFAULT_VALID_RECEIPT_JSON);
        this.failure = null;
    }

    private static ChatResponse response(String json) {
        Generation generation = new Generation(new AssistantMessage(json));
        ChatResponseMetadata metadata = ChatResponseMetadata.builder()
                .usage(new DefaultUsage(100, 20))
                .build();
        return new ChatResponse(List.of(generation), metadata);
    }
}
