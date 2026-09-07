package dev.aihub.ingestion;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

/**
 * Plain unit test - no Spring context, no Testcontainers, no network. Presigning is a local
 * signature computation (no I/O), so a real {@link S3Presigner} with throwaway credentials proves
 * the TTL is wired correctly (AC-7); {@link S3Client} is mocked (spring-conventions: R2 is a true
 * external) for the headObject/delete paths.
 */
class R2ObjectStorageClientTest {

    private static final String BUCKET = "aihub-media";
    private static final Duration TTL = Duration.ofMinutes(15);

    private final S3Client s3Client = mock(S3Client.class);
    private final S3Presigner presigner = S3Presigner.builder()
            .region(Region.of("auto"))
            .credentialsProvider(StaticCredentialsProvider.create(AwsBasicCredentials.create("test-key", "test-secret")))
            .endpointOverride(URI.create("https://test-account.r2.cloudflarestorage.com"))
            .build();
    private final R2ObjectStorageClient client = new R2ObjectStorageClient(s3Client, presigner, BUCKET);

    // AC-7: the presigned URL expires 15 minutes from now and authorises PUT to this one key -
    // never GET, never a bucket listing (there is no such presign call to make in the first place).
    @Test
    void presignPutIssuesAFifteenMinutePutOnlyUrlForTheGivenKey() {
        OffsetDateTime before = OffsetDateTime.now();

        PresignedUpload presigned = client.presignPut("uploads/abc-123", TTL);

        assertThat(Duration.between(before, presigned.expiresAt())).isCloseTo(TTL, Duration.ofSeconds(5));
        assertThat(presigned.uploadUrl().toString()).contains("uploads/abc-123").contains(BUCKET);
    }

    @Test
    void headObjectReturnsMetadataWhenTheObjectExists() {
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenReturn(HeadObjectResponse.builder().contentType("image/jpeg").contentLength(2048L).build());

        Optional<ObjectMetadata> metadata = client.headObject("uploads/abc-123");

        assertThat(metadata).contains(new ObjectMetadata("image/jpeg", 2048L));
    }

    @Test
    void headObjectReturnsEmptyWhenTheObjectDoesNotExist() {
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenThrow(S3Exception.builder().statusCode(404).build());

        assertThat(client.headObject("uploads/missing")).isEmpty();
    }

    @Test
    void headObjectPropagatesOtherFailures() {
        when(s3Client.headObject(any(HeadObjectRequest.class)))
                .thenThrow(S3Exception.builder().statusCode(500).build());

        assertThatThrownBy(() -> client.headObject("uploads/abc-123")).isInstanceOf(S3Exception.class);
    }

    @Test
    void deleteRemovesTheObjectAtTheGivenKey() {
        client.delete("uploads/abc-123");

        verify(s3Client)
                .deleteObject(DeleteObjectRequest.builder().bucket(BUCKET).key("uploads/abc-123").build());
    }
}
