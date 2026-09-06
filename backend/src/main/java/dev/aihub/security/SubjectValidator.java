package dev.aihub.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Rejects a JWT that carries no {@code sub} claim (or a blank one). Nothing in
 * {@link org.springframework.security.oauth2.jwt.JwtValidators#createDefaultWithIssuer} requires
 * its presence, but {@link AuthenticatedUser#from} feeds it straight into {@code user_id}, which
 * is {@code NOT NULL} on every tenant table - without this validator that shape reaches the
 * repository layer and surfaces as an unhandled 500 instead of the 401 every other invalid-token
 * shape gets.
 */
public class SubjectValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error MISSING_SUBJECT =
            new OAuth2Error("invalid_token", "The sub claim is missing", null);

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getSubject() != null && !jwt.getSubject().isBlank()) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(MISSING_SUBJECT);
    }
}
