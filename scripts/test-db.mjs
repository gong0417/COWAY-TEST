#!/usr/bin/env node
/**
 * Test PostgreSQL connectivity using backend/db/pool.js (reads repo root .env).
 *
 * Usage: npm run test:db
 */
import "../backend/loadEnv.js";
import { createPool, testDbConnection } from "../backend/db/pool.js";

const pool = createPool();
const result = await testDbConnection(pool);

if (pool) {
  await pool.end();
}

if (result.ok) {
  console.log("Connection OK");
  console.log("  database:", result.db);
  console.log("  user:    ", result.user);
  console.log("  version: ", result.version.split("\n")[0]);
  process.exit(0);
}

console.error("Connection failed:", result.error);
process.exit(1);
