package dev.aihub.ingestion;

/** Metadata of a stored object, as needed to validate it against AC-4's content-type/size rule. */
public record ObjectMetadata(String contentType, long contentLength) {
}
