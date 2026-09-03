package dev.aihub.security;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Resource-server security: every endpoint requires a JWT validated against the Auth0 tenant,
 * except the health probe. There is no session, no CSRF token, no login flow — Auth0 owns
 * authentication entirely (ARCHITECTURE.md: "we do not write our own auth").
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/actuator/health").permitAll()
                        .anyRequest().authenticated())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
        return http.build();
    }

    /**
     * Only created when {@code auth0.issuer-uri} (env var {@code AUTH0_ISSUER_URI}) is
     * configured, so that tests can supply their own {@link JwtDecoder} without a real Auth0
     * tenant. In production this must be set — with no decoder bean, {@code oauth2ResourceServer}
     * fails fast at startup rather than silently accepting unvalidated tokens.
     */
    @Bean
    @ConditionalOnProperty(prefix = "auth0", name = "issuer-uri")
    JwtDecoder jwtDecoder(Environment env) {
        return JwtDecoders.fromIssuerLocation(env.getRequiredProperty("auth0.issuer-uri"));
    }
}
