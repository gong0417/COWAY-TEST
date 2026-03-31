import pg from "pg";
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(repoRoot, ".env");
if (existsSync(envPath)) {
  const raw = readFileSync(envPath, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
    if (!m || line.trim().startsWith("#")) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function poolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return { connectionString: url };
  const host = process.env.PGHOST || "127.0.0.1";
  const port = Number(process.env.PGPORT || 5432);
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  if (user && database) {
    return { host, port, user, password, database };
  }
  return null;
}

const cfg = poolConfig();
if (!cfg) {
  console.error(
    "DB 연결 정보가 없습니다. .env에 DATABASE_URL 또는 PGUSER+PGDATABASE(+PGPASSWORD)를 설정하세요.",
  );
  process.exit(1);
}

const pool = new pg.Pool({ ...cfg, connectionTimeoutMillis: 8000 });
try {
  const r = await pool.query("SELECT COUNT(*)::bigint AS c FROM ssm_cases");
  console.log("SELECT COUNT(*) FROM ssm_cases →", String(r.rows[0].c));
} catch (e) {
  console.error("쿼리 실패:", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await pool.end();
}
