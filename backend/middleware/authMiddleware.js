import jwt from "jsonwebtoken";
import { userFromSupabaseAccessToken, getSupabaseJwtSecret } from "../auth/supabaseJwt.js";
import { getAuthProvider } from "../config/authMode.js";

const DEV_FALLBACK = "dev-only-insecure-jwt-secret-min-16";

/**
 * @returns {string}
 */
export function getJwtSecret() {
  const s = process.env.JWT_SECRET?.trim();
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "JWT_SECRET must be set to a string of at least 16 characters in production",
    );
  }
  return DEV_FALLBACK;
}

/**
 * Attach `req.user` from Bearer token (JWT mode: app JWT; Supabase mode: Supabase access_token).
 * @type {import('express').RequestHandler}
 */
export function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  const token =
    typeof h === "string" && h.startsWith("Bearer ")
      ? h.slice(7).trim()
      : null;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (getAuthProvider() === "supabase") {
    const secret = getSupabaseJwtSecret();
    if (!secret) {
      if (process.env.NODE_ENV === "production") {
        return res.status(500).json({ error: "Server misconfiguration (Supabase JWT)" });
      }
      return res.status(503).json({
        error: "SUPABASE_JWT_SECRET is not set (required when AUTH_PROVIDER=supabase)",
      });
    }
    const user = userFromSupabaseAccessToken(token, secret);
    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = user;
    return next();
  }

  try {
    const secret = getJwtSecret();
    const payload = jwt.verify(token, secret);
    const sub = payload.sub;
    req.user = {
      id: typeof sub === "string" || typeof sub === "number" ? String(sub) : "",
      username: String(payload.username ?? ""),
      role: payload.role === "admin" ? "admin" : "user",
    };
    if (!req.user.username || !req.user.id) {
      return res.status(401).json({ error: "Invalid token payload" });
    }
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** @type {import('express').RequestHandler} */
export function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}
