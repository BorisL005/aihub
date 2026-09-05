import type { Entry, EntryPage, Project } from "./types";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export interface ApiClientConfig {
  baseUrl: string;
  getAccessToken: () => Promise<string>;
}

async function request<T>(config: ApiClientConfig, path: string): Promise<T> {
  const token = await config.getAccessToken();
  const response = await fetch(`${config.baseUrl}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new ApiError(response.status, `${path} failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}

export interface ListEntriesParams {
  limit?: number;
  cursor?: string;
}

export interface ApiClient {
  listProjects(): Promise<Project[]>;
  listProjectEntries(projectId: string, params?: ListEntriesParams): Promise<EntryPage>;
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
  };
}
