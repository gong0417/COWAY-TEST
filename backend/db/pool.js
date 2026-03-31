import pg from "pg";

/**
 * Build pool options from `DATABASE_URL` or `PGHOST` / `PGPORT` / `PGUSER` / `PGPASSWORD` / `PGDATABASE`.
 * Load repo root `.env` via `import "./loadEnv.js"` in `index.js` (or call `dotenv.config()` before importing this module).
 */
export function getPoolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return { connectionString: url, max: 10 };
  }
  const host = process.env.PGHOST || "127.0.0.1";
  const port = Number(process.env.PGPORT || 5432);
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  if (!user || !database) {
    return null;
  }
  return { host, port, user, password, database, max: 10 };
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
  return Boolean(process.env.PGUSER && process.env.PGDATABASE);
}

/**
 * Run a simple health query. Use to verify credentials and network.
 * @param {import('pg').Pool | null} pool
 * @returns {Promise<{ ok: true, db: string, user: string, version: string } | { ok: false, error: string }>}
 */
export async function testDbConnection(pool) {
  if (!pool) {
    return { ok: false, error: "Pool not configured (set DATABASE_URL or PGUSER+PGDATABASE)" };
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
