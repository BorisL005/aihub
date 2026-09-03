package dev.aihub.support;

import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.RSASSASigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import dev.aihub.security.AudienceValidator;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.NoSuchAlgorithmException;
import java.security.interfaces.RSAPublicKey;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;

/**
 * Issues real, signed RS256 JWTs against a test-only key pair and exposes a matching
 * {@link JwtDecoder} bean, so integration tests exercise Spring Security's actual token
 * validation - issuer, expiry and audience, mirroring {@code SecurityConfig.jwtDecoder} - without
 * depending on network access to a real Auth0 tenant.
 */
@TestConfiguration
public class TestJwtSupport {

    static final String TEST_ISSUER = "https://test.aihub.dev/";
    static final String TEST_AUDIENCE = "https://api.test.aihub.dev/";

    private static final KeyPair KEY_PAIR = generateKeyPair();

    @Bean
    JwtDecoder jwtDecoder() {
        NimbusJwtDecoder decoder =
                NimbusJwtDecoder.withPublicKey((RSAPublicKey) KEY_PAIR.getPublic()).build();
        OAuth2TokenValidator<Jwt> validator = new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(TEST_ISSUER), new AudienceValidator(TEST_AUDIENCE));
        decoder.setJwtValidator(validator);
        return decoder;
    }

    public static String validToken(String subject) {
        return token(
                subject, TEST_ISSUER, TEST_AUDIENCE, Instant.now().minusSeconds(5), Instant.now().plusSeconds(300));
    }

    public static String expiredToken(String subject) {
        return token(
                subject, TEST_ISSUER, TEST_AUDIENCE, Instant.now().minusSeconds(600), Instant.now().minusSeconds(300));
    }

    public static String wrongIssuerToken(String subject) {
        return token(
                subject,
                "https://not-the-configured-issuer.example/",
                TEST_AUDIENCE,
                Instant.now().minusSeconds(5),
                Instant.now().plusSeconds(300));
    }

    public static String wrongAudienceToken(String subject) {
        return token(
                subject,
                TEST_ISSUER,
                "https://some-other-api.example/",
                Instant.now().minusSeconds(5),
                Instant.now().plusSeconds(300));
    }

    private static String token(
            String subject, String issuer, String audience, Instant issuedAt, Instant expiresAt) {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(subject)
                .issuer(issuer)
                .audience(List.of(audience))
                .issueTime(Date.from(issuedAt))
                .expirationTime(Date.from(expiresAt))
                .build();
        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.RS256), claims);
        try {
            jwt.sign(new RSASSASigner(KEY_PAIR.getPrivate()));
        } catch (JOSEException e) {
            throw new IllegalStateException(e);
        }
        return jwt.serialize();
    }

    private static KeyPair generateKeyPair() {
        try {
            KeyPairGenerator generator = KeyPairGenerator.getInstance("RSA");
            generator.initialize(2048);
            return generator.generateKeyPair();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
