#!/usr/bin/env node
/**
 * Apply db/schema.sql using the same env as the backend (DATABASE_URL, PG*, or DB_*).
 * Usage: node scripts/apply-schema.mjs
 */
import "../backend/loadEnv.js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { getPoolConfig } from "../backend/db/pool.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const schemaPath = join(root, "db", "schema.sql");

const cfg = getPoolConfig();
if (!cfg) {
  console.error(
    "[apply-schema] No DB config. Set DATABASE_URL or PGUSER+PGDATABASE or DB_USER+DB_NAME in .env",
  );
  process.exit(1);
}

const sql = readFileSync(schemaPath, "utf8");
const client = new pg.Client(cfg);

try {
  await client.connect();
  await client.query(sql);
  console.log("[apply-schema] OK:", schemaPath);
} catch (e) {
  console.error("[apply-schema]", e instanceof Error ? e.message : e);
  process.exit(1);
} finally {
  await client.end().catch(() => {});
}
