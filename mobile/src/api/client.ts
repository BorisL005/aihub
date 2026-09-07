import type { CreateEntryRequest, Entry, EntryPage, MediaUploadUrl, ProblemDetail, Project } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    // Set only for a `application/problem+json` body (KAN-5's 400s carry one) - the stable
    // discriminator client UI branches on. See ProblemDetail in ./types.
    public readonly problemType?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
}

async function request<T>(
  config: ApiClientConfig,
  path: string,
  init?: { method?: string; body?: unknown; signal?: AbortSignal },
): Promise<T> {
  const token = await config.getAccessToken();
  const response = await fetch(`${config.baseUrl}${path}`, {
    method: init?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: init?.signal,
  });
  if (!response.ok) {
    const problemType = await readProblemType(response);
    throw new ApiError(response.status, `${path} failed with status ${response.status}`, problemType);
  }
  return (await response.json()) as T;
}

async function readProblemType(response: Response): Promise<string | undefined> {
  try {
    const problem = (await response.json()) as ProblemDetail;
    return problem.type;
  } catch {
    return undefined;
  }
}

export interface ListEntriesParams {
  limit?: number;
  cursor?: string;
}

export interface CreateEntryResult {
  entry: Entry;
  /** false when idempotencyKey matched a request already processed (AC-3) - the entry is not new. */
  created: boolean;
}

export interface ApiClient {
  listProjects(): Promise<Project[]>;
  listProjectEntries(projectId: string, params?: ListEntriesParams): Promise<EntryPage>;
  createMediaUploadUrl(signal?: AbortSignal): Promise<MediaUploadUrl>;
  createEntry(projectId: string, body: CreateEntryRequest, signal?: AbortSignal): Promise<CreateEntryResult>;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  return {
    listProjects: () => request<Project[]>(config, "/projects"),
    listProjectEntries: (projectId, params = {}) => {
      const query = new URLSearchParams();
      if (params.limit != null) {
        query.set("limit", String(params.limit));
      }
      if (params.cursor) {
        query.set("cursor", params.cursor);
      }
      const queryString = query.toString();
      const path = `/projects/${projectId}/entries${queryString ? `?${queryString}` : ""}`;
      return request<EntryPage>(config, path);
    },
    createMediaUploadUrl: (signal) =>
      request<MediaUploadUrl>(config, "/media/upload-url", { method: "POST", signal }),
    createEntry: async (projectId, body, signal) => {
      const token = await config.getAccessToken();
      const response = await fetch(`${config.baseUrl}/projects/${projectId}/entries`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
      });
      if (!response.ok) {
        const problemType = await readProblemType(response);
        throw new ApiError(response.status, `createEntry failed with status ${response.status}`, problemType);
      }
      const entry = (await response.json()) as Entry;
      return { entry, created: response.status === 201 };
    },
  };
}
