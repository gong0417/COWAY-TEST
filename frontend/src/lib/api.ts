import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";
import { isAuthOfflineMode } from "@/lib/authMode";
import { authHeaders, clearAuthToken } from "@/lib/authToken";

function onUnauthorizedResponse(path: string, status: number) {
  if (isAuthOfflineMode()) return;
  if (
    status === 401 &&
    !path.includes("/auth/login") &&
    !path.includes("/auth/register")
  ) {
    clearAuthToken();
    try {
      window.dispatchEvent(new CustomEvent("rs-unauthorized"));
    } catch {
      /* ignore */
    }
  }
}

/** `fetch` to API with Bearer token; use for uploads and non-JSON responses. */
export function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), {
    ...init,
    headers: {
      ...authHeaders(),
      ...normalizeHeaders(init?.headers),
    },
  }).then((res) => {
    onUnauthorizedResponse(path, res.status);
    return res;
  });
}

/**
 * API base for the Node backend.
 * - `VITE_API_BASE_URL` when set (e.g. explicit NAS URL)
 * - Production build: same-origin (Docker nginx proxies `/api` → backend)
 * - Dev: `http://localhost:3000`
 *
 * `GET /api/collections` (via `fetchApiJson` / `useFetchJson`): backend uses PostgreSQL
 * `SELECT` when `DATABASE_URL` (or PG*) is set; otherwise reads `data/*.csv`.
 */
export function getApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (import.meta.env.PROD) return "";
  return "http://localhost:3000";
}

/** Full URL to the backend, e.g. `http://localhost:3000/api/collections` */
export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export const COLLECTIONS = {
  failureCases: "failure_cases",
  reliabilityStandards: "reliability_standards",
  inspectionItems: "inspection_items",
  fileUploads: "file_uploads",
} as const;

/** Response shape of `GET /api/collections`. */
export interface CollectionsResponse {
  failureCases: FailureCase[];
  reliabilityStandards: ReliabilityStandard[];
  inspectionItems: InspectionItem[];
}

/**
 * JSON GET/POST helper with consistent errors.
 * For 204 No Content, returns `undefined` as `T`.
 */
export async function fetchApiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T | undefined> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...authHeaders(),
      ...normalizeHeaders(init?.headers),
    },
  });
  onUnauthorizedResponse(path, res.status);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status} ${res.statusText}`);
  }
  if (res.status === 204) return undefined;
  const text = await res.text();
  if (!text) return undefined;
  return JSON.parse(text) as T;
}

function normalizeHeaders(
  h: HeadersInit | undefined,
): Record<string, string> {
  if (!h) return {};
  if (h instanceof Headers) {
    const o: Record<string, string> = {};
    h.forEach((v, k) => {
      o[k] = v;
    });
    return o;
  }
  if (Array.isArray(h)) {
    return Object.fromEntries(h);
  }
  return { ...h };
}

export async function fetchCollections(): Promise<CollectionsResponse> {
  const data = await fetchApiJson<CollectionsResponse>("/api/collections", {
    method: "GET",
  });
  if (!data) {
    throw new Error("Empty response from /api/collections");
  }
  return data;
}
