// Mirrors api/openapi.yaml's Project, Entry and EntryPage schemas. An endpoint or field not in
// that spec does not exist - keep this file in sync with it, not the other way around.

export type ValidationStatus = "pending" | "extracted" | "needs_review";

export interface Project {
  id: string;
  name: string;
  projectType: string;
}

export interface Entry {
  id: string;
  ts: string;
  source: string;
  validationStatus: ValidationStatus;
  payload: Record<string, unknown>;
}

export interface EntryPage {
  items: Entry[];
  nextCursor?: string;
}

export interface MediaUploadUrl {
  mediaRef: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface CreateEntryRequest {
  mediaRef: string;
  idempotencyKey: string;
}

/**
 * RFC 9457 problem details, as produced by Spring's ProblemDetail. `type` is the stable
 * discriminator for the two ways POST .../entries can fail (KAN-5) - `detail` is human text for
 * logs only, never branched on.
 */
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
}

export const MEDIA_REJECTED_TYPE = "urn:aihub:media-rejected";
export const MEDIA_UNAVAILABLE_TYPE = "urn:aihub:media-unavailable";
