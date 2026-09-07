package dev.aihub.ingestion;

import java.net.URI;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Wires the R2 (S3-compatible) bucket that holds capture media. Only created when {@code
 * r2.endpoint} (env var {@code R2_ENDPOINT}) is configured - mirrors {@code
 * SecurityConfig.jwtDecoder}'s pattern, so tests can supply their own {@link ObjectStorageClient}
 * (spring-conventions: R2 is a true external, mocked in tests) without a real bucket. Env vars
 * {@code R2_ENDPOINT}/{@code R2_ACCESS_KEY_ID}/{@code R2_SECRET_ACCESS_KEY} already exist as
 * repo secrets for the KAN-10 eval-sync job; {@code R2_BUCKET} is new, for this ticket's bucket.
 */
@Configuration
@ConditionalOnProperty(prefix = "r2", name = "endpoint")
public class MediaStorageConfig {

    @Bean
    ObjectStorageClient objectStorageClient(Environment env) {
        String endpoint = env.getRequiredProperty("r2.endpoint");
        String bucket = env.getRequiredProperty("r2.bucket");
        AwsBasicCredentials credentials = AwsBasicCredentials.create(
                env.getRequiredProperty("r2.access-key-id"), env.getRequiredProperty("r2.secret-access-key"));
        StaticCredentialsProvider credentialsProvider = StaticCredentialsProvider.create(credentials);
        // R2 has no regions; Cloudflare's own docs specify the literal pseudo-region "auto".
        Region region = Region.of("auto");

        S3Client s3Client = S3Client.builder()
                .endpointOverride(URI.create(endpoint))
                .region(region)
                .credentialsProvider(credentialsProvider)
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .httpClientBuilder(UrlConnectionHttpClient.builder())
                .build();
        S3Presigner presigner = S3Presigner.builder()
                .endpointOverride(URI.create(endpoint))
                .region(region)
                .credentialsProvider(credentialsProvider)
                .serviceConfiguration(
                        S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();

        return new R2ObjectStorageClient(s3Client, presigner, bucket);
    }
}
