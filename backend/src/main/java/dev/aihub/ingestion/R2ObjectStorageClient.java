package dev.aihub.ingestion;

import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Exception;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.model.PutObjectPresignRequest;

/**
 * R2 is S3-compatible (ARCHITECTURE.md object storage decision), so the AWS SDK's S3 client and
 * presigner work unchanged against it - {@link MediaStorageConfig} is the only place that knows
 * this is R2 rather than real S3 (an endpoint override).
 */
public class R2ObjectStorageClient implements ObjectStorageClient {

    private static final int NOT_FOUND_STATUS = 404;

    private final S3Client s3Client;
    private final S3Presigner presigner;
    private final String bucket;

    public R2ObjectStorageClient(S3Client s3Client, S3Presigner presigner, String bucket) {
        this.s3Client = s3Client;
        this.presigner = presigner;
        this.bucket = bucket;
    }

    @Override
    public PresignedUpload presignPut(String key, Duration ttl) {
        PutObjectRequest putObjectRequest =
                PutObjectRequest.builder().bucket(bucket).key(key).build();
        PutObjectPresignRequest presignRequest = PutObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .putObjectRequest(putObjectRequest)
                .build();
        PresignedPutObjectRequest presigned = presigner.presignPutObject(presignRequest);
        return new PresignedUpload(
                URI.create(presigned.url().toString()), OffsetDateTime.ofInstant(presigned.expiration(), ZoneOffset.UTC));
    }

    @Override
    public Optional<ObjectMetadata> headObject(String key) {
        try {
            HeadObjectResponse response = s3Client.headObject(
                    HeadObjectRequest.builder().bucket(bucket).key(key).build());
            return Optional.of(new ObjectMetadata(response.contentType(), response.contentLength()));
        } catch (S3Exception e) {
            if (e.statusCode() == NOT_FOUND_STATUS) {
                return Optional.empty();
            }
            throw e;
        }
    }

    @Override
    public void delete(String key) {
        s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucket).key(key).build());
    }
}
