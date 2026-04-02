import pg from "pg";

/**
 * Build pool options from:
 * - `DATABASE_URL`, or
 * - `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`, or
 * - `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` (Docker Compose 등 호환)
 *
 * Load repo root `.env` via `import "./loadEnv.js"` in `index.js`.
 */
export function getPoolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return { connectionString: url, max: 10 };
  }

  let host = process.env.PGHOST?.trim();
  let port = process.env.PGPORT?.trim();
  let user = process.env.PGUSER?.trim();
  let password = process.env.PGPASSWORD;
  let database = process.env.PGDATABASE?.trim();

  if (!user || !database) {
    host = process.env.DB_HOST?.trim() || host;
    port = process.env.DB_PORT?.trim() || port;
    user = process.env.DB_USER?.trim() || user;
    if (process.env.DB_PASSWORD !== undefined) {
      password = process.env.DB_PASSWORD;
    }
    database = process.env.DB_NAME?.trim() || database;
  }

  host = host || "127.0.0.1";
  const portNum = Number(port || 5432);
  if (!user || !database) {
    return null;
  }
  return {
    host,
    port: Number.isFinite(portNum) ? portNum : 5432,
    user,
    password,
    database,
    max: 10,
  };
}

/**
 * Create a new Pool (new instance each call). Prefer `getPool()` for a shared singleton.
 * @returns {import('pg').Pool | null}
 */
export function createPool() {
  const cfg = getPoolConfig();
  if (!cfg) return null;
  return new pg.Pool(cfg);
}

let _singleton;

/**
 * Shared pool for the process (lazy). Returns `null` if env is not configured.
 * @returns {import('pg').Pool | null}
 */
export function getPool() {
  if (_singleton !== undefined) return _singleton;
  _singleton = createPool();
  return _singleton;
}

export function isPoolConfigured() {
  if (process.env.DATABASE_URL?.trim()) return true;
  if (process.env.PGUSER?.trim() && process.env.PGDATABASE?.trim()) return true;
  return Boolean(process.env.DB_USER?.trim() && process.env.DB_NAME?.trim());
}

/**
 * Run a simple health query. Use to verify credentials and network.
 * @param {import('pg').Pool | null} pool
 * @returns {Promise<{ ok: true, db: string, user: string, version: string } | { ok: false, error: string }>}
 */
export async function testDbConnection(pool) {
  if (!pool) {
    return {
      ok: false,
      error:
        "Pool not configured (set DATABASE_URL, or PGUSER+PGDATABASE, or DB_USER+DB_NAME)",
    };
  }
  try {
    const { rows } = await pool.query(
      `SELECT current_database()::text AS db, current_user AS user, version() AS version`,
    );
    const row = rows[0];
    return {
      ok: true,
      db: row.db,
      user: row.user,
      version: row.version,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
