import jwt from "jsonwebtoken";

/**
 * @param {string} token
 * @param {string} secret Supabase Dashboard → Project Settings → API → JWT Secret
 * @returns {{ id: string, username: string, role: 'admin' | 'user' } | null}
 */
export function userFromSupabaseAccessToken(token, secret) {
  try {
    const payload = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (!payload || typeof payload !== "object") return null;
    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) return null;

    const email = typeof payload.email === "string" ? payload.email.trim() : "";
    const meta =
      payload.user_metadata && typeof payload.user_metadata === "object"
        ? payload.user_metadata
        : {};
    const metaRole = meta.role === "admin" || meta.role === "user" ? meta.role : null;

    const adminEmails = (process.env.SUPABASE_ADMIN_EMAILS || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const em = email.toLowerCase();
    const role =
      metaRole ||
      (em && adminEmails.includes(em) ? "admin" : "user");

    return {
      id: sub,
      username: email || sub.slice(0, 8),
      role,
    };
  } catch {
    return null;
  }
}

/**
 * @returns {string | null}
 */
export function getSupabaseJwtSecret() {
  const s = process.env.SUPABASE_JWT_SECRET?.trim();
  return s && s.length > 0 ? s : null;
}
