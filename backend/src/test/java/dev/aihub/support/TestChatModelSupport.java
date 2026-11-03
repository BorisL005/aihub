package dev.aihub.support;

import org.springframework.ai.chat.model.ChatModel;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;

/**
 * Provides the {@link TestChatModel} bean as the app's {@link ChatModel} so the context starts
 * without {@code spring.ai.openai.api-key} configured, and so {@link
 * dev.aihub.llm.ModelRegistry} calls a deterministic double instead of a real provider - mirrors
 * {@link TestObjectStorageSupport}'s role for R2.
 */
@TestConfiguration
public class TestChatModelSupport {

    @Bean
    TestChatModel testChatModel() {
        return new TestChatModel();
    }

    @Bean
    ChatModel chatModel(TestChatModel testChatModel) {
        return testChatModel;
    }
}
