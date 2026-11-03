package dev.aihub.llm;

import java.time.Duration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.http.client.ClientHttpRequestFactoryBuilder;
import org.springframework.boot.http.client.HttpClientSettings;
import org.springframework.boot.restclient.RestClientCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.resilience.annotation.EnableResilientMethods;

@Configuration
@EnableConfigurationProperties(LlmProperties.class)
@EnableResilientMethods
public class LlmConfig {

    // Notes for dev: "Budget 30 seconds end to end for the ingest request. On timeout, fall
    // through to AC-8." Leaves headroom under that budget for the rest of the request (ownership
    // check, insert, llm_calls write) rather than spending the full 30s in the HTTP call alone.
    private static final Duration MODEL_CALL_TIMEOUT = Duration.ofSeconds(25);

    /**
     * Applied to every auto-configured {@code RestClient.Builder} in the context, including the
     * one Spring AI's OpenAI starter builds its client from - so a hung provider call fails fast
     * into {@link ModelRegistry}'s retry instead of holding the request open past the budget
     * above.
     */
    @Bean
    RestClientCustomizer aihubModelCallTimeoutCustomizer() {
        HttpClientSettings settings = HttpClientSettings.defaults().withTimeouts(MODEL_CALL_TIMEOUT, MODEL_CALL_TIMEOUT);
        return builder -> builder.requestFactory(ClientHttpRequestFactoryBuilder.detect().build(settings));
    }
}
