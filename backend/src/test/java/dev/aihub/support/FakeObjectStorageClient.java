package dev.aihub.support;

import dev.aihub.ingestion.ObjectMetadata;
import dev.aihub.ingestion.ObjectStorageClient;
import dev.aihub.ingestion.PresignedUpload;
import java.net.URI;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory {@link ObjectStorageClient} double (spring-conventions: R2 is a true external, mocked
 * in tests). {@link #putObject} simulates the client's direct-to-R2 PUT completing - tests call it
 * explicitly rather than this class faking the presigned URL actually being fetched, since the
 * backend under test never does that PUT itself either (ARCHITECTURE.md's ingestion decision).
 */
public class FakeObjectStorageClient implements ObjectStorageClient {

    private final Map<String, ObjectMetadata> objects = new ConcurrentHashMap<>();
    private final Map<String, byte[]> contents = new ConcurrentHashMap<>();

    @Override
    public PresignedUpload presignPut(String key, Duration ttl) {
        return new PresignedUpload(URI.create("https://fake-r2.test/" + key), OffsetDateTime.now().plus(ttl));
    }

    @Override
    public Optional<ObjectMetadata> headObject(String key) {
        return Optional.ofNullable(objects.get(key));
    }

    @Override
    public byte[] getObject(String key) {
        byte[] content = contents.get(key);
        return content == null ? new byte[0] : content;
    }

    @Override
    public void delete(String key) {
        objects.remove(key);
        contents.remove(key);
    }

    public void putObject(String key, String contentType, long contentLength) {
        objects.put(key, new ObjectMetadata(contentType, contentLength));
    }

    /** As {@link #putObject(String, String, long)}, also seeding the bytes {@link #getObject} returns (KAN-6). */
    public void putObject(String key, String contentType, byte[] content) {
        objects.put(key, new ObjectMetadata(contentType, content.length));
        contents.put(key, content);
    }

    public boolean exists(String key) {
        return objects.containsKey(key);
    }
}
