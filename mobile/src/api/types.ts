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
