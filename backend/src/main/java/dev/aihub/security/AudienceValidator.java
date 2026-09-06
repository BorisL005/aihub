package dev.aihub.security;

import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;

/**
 * Rejects a JWT whose {@code aud} claim does not contain this API's expected audience. Without
 * this, any access token Auth0 issues for the same tenant - including one minted for an entirely
 * different API - would otherwise pass validation here, since issuer and signature alone don't
 * distinguish between a tenant's APIs.
 */
public class AudienceValidator implements OAuth2TokenValidator<Jwt> {

    private static final OAuth2Error INVALID_AUDIENCE =
            new OAuth2Error("invalid_token", "The required audience is missing", null);

    private final String expectedAudience;

    public AudienceValidator(String expectedAudience) {
        this.expectedAudience = expectedAudience;
    }

    @Override
    public OAuth2TokenValidatorResult validate(Jwt jwt) {
        if (jwt.getAudience() != null && jwt.getAudience().contains(expectedAudience)) {
            return OAuth2TokenValidatorResult.success();
        }
        return OAuth2TokenValidatorResult.failure(INVALID_AUDIENCE);
    }
}
