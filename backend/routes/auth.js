import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getAuthProvider } from "../config/authMode.js";
import { getJwtSecret, requireAuth } from "../middleware/authMiddleware.js";

const SALT_ROUNDS = 12;

const USE_SUPABASE_BODY = {
  error:
    "이 프로젝트는 Supabase Auth를 사용합니다. 앱에서 회원가입·로그인하거나 Supabase 대시보드에서 사용자를 관리하세요.",
  code: "USE_SUPABASE_AUTH",
};

function jwtExpiresIn() {
  return process.env.JWT_EXPIRES_IN?.trim() || "7d";
}

/**
 * @param {import('pg').Pool | null} pool
 */
export function createAuthRouter(pool) {
  const router = Router();
  const supabaseAuth = getAuthProvider() === "supabase";

  router.post("/register", async (req, res, next) => {
    try {
      if (supabaseAuth) {
        return res.status(400).json(USE_SUPABASE_BODY);
      }
      if (!pool) {
        return res.status(503).json({ error: "Database not configured" });
      }
      const { username, password } = req.body ?? {};
      const u = String(username ?? "")
        .trim()
        .toLowerCase();
      const p = String(password ?? "");
      if (u.length < 3 || u.length > 50) {
        return res
          .status(400)
          .json({ error: "Username must be 3–50 characters" });
      }
      if (!/^[a-z0-9_]+$/.test(u)) {
        return res.status(400).json({
          error: "Username may contain lowercase letters, digits, and underscore only",
        });
      }
      if (p.length < 8) {
        return res
          .status(400)
          .json({ error: "Password must be at least 8 characters" });
      }
      const hash = await bcrypt.hash(p, SALT_ROUNDS);
      const countRes = await pool.query(
        "SELECT COUNT(*)::int AS c FROM users",
      );
      const isFirst = countRes.rows[0].c === 0;
      const role = isFirst ? "admin" : "user";
      const ins = await pool.query(
        `INSERT INTO users (username, password_hash, role)
         VALUES ($1, $2, $3)
         RETURNING id, username, role, created_at`,
        [u, hash, role],
      );
      const row = ins.rows[0];
      const secret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: String(row.id),
          username: row.username,
          role: row.role,
        },
        secret,
        { expiresIn: jwtExpiresIn() },
      );
      res.status(201).json({
        token,
        user: {
          id: String(row.id),
          username: row.username,
          role: row.role,
          created_at: row.created_at,
        },
      });
    } catch (e) {
      if (e && e.code === "23505") {
        return res.status(409).json({ error: "Username already taken" });
      }
      if (e && e.message?.includes("JWT_SECRET")) {
        return res.status(500).json({ error: "Server misconfiguration" });
      }
      next(e);
    }
  });

  router.post("/login", async (req, res, next) => {
    try {
      if (supabaseAuth) {
        return res.status(400).json(USE_SUPABASE_BODY);
      }
      if (!pool) {
        return res.status(503).json({ error: "Database not configured" });
      }
      const { username, password } = req.body ?? {};
      const u = String(username ?? "")
        .trim()
        .toLowerCase();
      const p = String(password ?? "");
      if (!u || !p) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }
      const { rows } = await pool.query(
        `SELECT id, username, password_hash, role, created_at
         FROM users WHERE username = $1`,
        [u],
      );
      if (!rows.length) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const row = rows[0];
      const ok = await bcrypt.compare(p, row.password_hash);
      if (!ok) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      const secret = getJwtSecret();
      const token = jwt.sign(
        {
          sub: String(row.id),
          username: row.username,
          role: row.role,
        },
        secret,
        { expiresIn: jwtExpiresIn() },
      );
      res.json({
        token,
        user: {
          id: String(row.id),
          username: row.username,
          role: row.role,
          created_at: row.created_at,
        },
      });
    } catch (e) {
      if (e && e.message?.includes("JWT_SECRET")) {
        return res.status(500).json({ error: "Server misconfiguration" });
      }
      next(e);
    }
  });

  router.get("/me", requireAuth, (req, res) => {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        role: req.user.role,
      },
    });
  });

  return router;
}
