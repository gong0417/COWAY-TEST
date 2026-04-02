/**
 * Set `VITE_AUTH_OFFLINE=true` in repo-root `.env` (see vite `envDir`).
 * UI-only dev: skip API login; session stored in localStorage only.
 * Do not enable in production builds.
 */
export function isAuthOfflineMode(): boolean {
  const v = import.meta.env.VITE_AUTH_OFFLINE;
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1";
}

const OFFLINE_SESSION_KEY = "rs_offline_session";

export type OfflineSession = {
  username: string;
  role: "admin" | "user";
};

export function readOfflineSession(): OfflineSession | null {
  try {
    const raw = localStorage.getItem(OFFLINE_SESSION_KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as OfflineSession;
    if (!o?.username || (o.role !== "admin" && o.role !== "user")) return null;
    return o;
  } catch {
    return null;
  }
}

export function writeOfflineSession(session: OfflineSession): void {
  localStorage.setItem(OFFLINE_SESSION_KEY, JSON.stringify(session));
}

export function clearOfflineSession(): void {
  localStorage.removeItem(OFFLINE_SESSION_KEY);
}
