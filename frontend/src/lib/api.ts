/**
 * NAS / Express API helpers (replaces Firebase client usage).
 */
export const COLLECTIONS = {
  failureCases: "failure_cases",
  reliabilityStandards: "reliability_standards",
  inspectionItems: "inspection_items",
  fileUploads: "file_uploads",
} as const;

/** Absolute API base (e.g. https://nas.example.com) or empty to use same-origin `/api` (Vite proxy in dev). */
export function apiUrl(path: string): string {
  const base = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  if (base) return `${base}${p}`;
  return p;
}
