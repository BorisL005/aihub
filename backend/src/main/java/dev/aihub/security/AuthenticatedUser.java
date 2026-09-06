package dev.aihub.security;

import org.springframework.security.oauth2.jwt.Jwt;

/**
 * The caller's identity, resolved from the validated JWT's {@code sub} claim.
 *
 * <p>Per ARCHITECTURE.md decision 1, this is the only identity AI Hub stores about a person —
 * there is no local {@code users} table. {@link #userId()} is the exact Auth0 {@code sub}
 * claim value and is the only value tenant tables may store as {@code user_id}.
 */
public record AuthenticatedUser(String userId) {

    public static AuthenticatedUser from(Jwt jwt) {
        return new AuthenticatedUser(jwt.getSubject());
    }
}
