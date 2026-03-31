#!/usr/bin/env node
/**
 * Reads data/*.csv and upserts into PostgreSQL (pg).
 *
 * Env (see .env.example):
 *   DATABASE_URL=postgresql://user:pass@host:5432/dbname
 *   Or: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 * Optional:
 *   DATA_DIR=./data   (folder containing the three CSV files)
 *
 * Usage: npm run import-pg
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import Papa from "papaparse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

try {
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
        v = v.slice(1, -1).replace(/\\n/g, "\n");
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  }
} catch (e) {
  console.warn("[import-pg] Could not load .env:", e instanceof Error ? e.message : e);
}

const DATA_DIR = process.env.DATA_DIR
  ? join(repoRoot, process.env.DATA_DIR)
  : join(repoRoot, "data");

const FILES = {
  ssm: join(DATA_DIR, "ssm.csv"),
  inspection: join(DATA_DIR, "inspection_items.csv"),
  reliability: join(DATA_DIR, "reliability_standards.csv"),
};

function emptyToNull(v) {
  if (v == null) return null;
  const s = String(v).trim();
  return s === "" ? null : s;
}

function parseDate(s) {
  const t = emptyToNull(s);
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return t.slice(0, 10);
}

function parseCsv(path) {
  if (!existsSync(path)) {
    throw new Error(`File not found: ${path}`);
  }
  const text = readFileSync(path, "utf8");
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors?.length) {
    const sample = parsed.errors.slice(0, 5);
    console.warn("[import-pg] CSV parse warnings:", sample);
  }
  return parsed.data.filter((row) =>
    Object.values(row).some((v) => v != null && String(v).trim() !== ""),
  );
}

function dedupe(rows, keyFn, label) {
  const map = new Map();
  const dup = [];
  for (const row of rows) {
    const k = keyFn(row);
    if (!k) continue;
    if (map.has(k)) dup.push(k);
    map.set(k, row);
  }
  if (dup.length) {
    console.warn(
      `[import-pg] ${label}: ${dup.length} duplicate key(s) in CSV — using last row for each`,
    );
  }
  return [...map.values()];
}

function getPoolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    return { connectionString: url };
  }
  const host = process.env.PGHOST || "127.0.0.1";
  const port = Number(process.env.PGPORT || 5432);
  const user = process.env.PGUSER;
  const password = process.env.PGPASSWORD;
  const database = process.env.PGDATABASE;
  if (!user || !database) {
    throw new Error(
      "Set DATABASE_URL or PGUSER + PGDATABASE (and optionally PGHOST, PGPORT, PGPASSWORD)",
    );
  }
  return { host, port, user, password, database };
}

const UPSERT_SSM = `
INSERT INTO ssm_cases (
  ssm_id, ssm_defining, ssm_trouble, ssm_stress, ssm_strength, ssm_controling,
  prevention, test_item, test_criteria, product_line, document_title, file_url
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ON CONFLICT (ssm_id) DO UPDATE SET
  ssm_defining = EXCLUDED.ssm_defining,
  ssm_trouble = EXCLUDED.ssm_trouble,
  ssm_stress = EXCLUDED.ssm_stress,
  ssm_strength = EXCLUDED.ssm_strength,
  ssm_controling = EXCLUDED.ssm_controling,
  prevention = EXCLUDED.prevention,
  test_item = EXCLUDED.test_item,
  test_criteria = EXCLUDED.test_criteria,
  product_line = EXCLUDED.product_line,
  document_title = EXCLUDED.document_title,
  file_url = EXCLUDED.file_url
`;

const UPSERT_INSPECTION = `
INSERT INTO inspection_items (
  check_id, category, inspection_item, internal_standard, method, revision_date
) VALUES ($1,$2,$3,$4,$5,$6)
ON CONFLICT (check_id) DO UPDATE SET
  category = EXCLUDED.category,
  inspection_item = EXCLUDED.inspection_item,
  internal_standard = EXCLUDED.internal_standard,
  method = EXCLUDED.method,
  revision_date = EXCLUDED.revision_date
`;

const UPSERT_REL = `
INSERT INTO reliability_standards (
  standard_id, component_name, test_name, test_condition,
  acceptance_criteria, sample_size, related_doc
) VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (standard_id) DO UPDATE SET
  component_name = EXCLUDED.component_name,
  test_name = EXCLUDED.test_name,
  test_condition = EXCLUDED.test_condition,
  acceptance_criteria = EXCLUDED.acceptance_criteria,
  sample_size = EXCLUDED.sample_size,
  related_doc = EXCLUDED.related_doc
`;

async function main() {
  const pool = new pg.Pool({
    ...getPoolConfig(),
    max: 5,
  });

  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const ssmRows = dedupe(
      parseCsv(FILES.ssm),
      (r) => emptyToNull(r["SSM ID"]),
      "ssm.csv",
    );
    let nSsm = 0;
    for (const r of ssmRows) {
      await client.query(UPSERT_SSM, [
        emptyToNull(r["SSM ID"]),
        emptyToNull(r["ssm.defining"]),
        emptyToNull(r["ssm.trouble"]),
        emptyToNull(r["ssm.stress"]),
        emptyToNull(r["ssm.strength"]),
        emptyToNull(r["ssm.controling"]),
        emptyToNull(r["재발 방지 대책"]),
        emptyToNull(r["시험 항목"]),
        emptyToNull(r["시험 기준"]),
        emptyToNull(r["제품군"]),
        emptyToNull(r["ssm.document제 목1"]),
        emptyToNull(r["파일명1"]),
      ]);
      nSsm += 1;
    }

    const insRows = dedupe(
      parseCsv(FILES.inspection),
      (r) => emptyToNull(r.checkId),
      "inspection_items.csv",
    );
    let nIns = 0;
    for (const r of insRows) {
      await client.query(UPSERT_INSPECTION, [
        emptyToNull(r.checkId),
        emptyToNull(r.category),
        emptyToNull(r.inspectionItem),
        emptyToNull(r.internalStandard),
        emptyToNull(r.method),
        parseDate(r.revisionDate),
      ]);
      nIns += 1;
    }

    const relRows = dedupe(
      parseCsv(FILES.reliability),
      (r) => emptyToNull(r.standardId),
      "reliability_standards.csv",
    );
    let nRel = 0;
    for (const r of relRows) {
      await client.query(UPSERT_REL, [
        emptyToNull(r.standardId),
        emptyToNull(r.componentName),
        emptyToNull(r.testName),
        emptyToNull(r.testCondition),
        emptyToNull(r.acceptanceCriteria),
        emptyToNull(r.sampleSize),
        emptyToNull(r.relatedDoc),
      ]);
      nRel += 1;
    }

    await client.query("COMMIT");
    console.log(
      `[import-pg] Done: ssm_cases=${nSsm}, inspection_items=${nIns}, reliability_standards=${nRel}`,
    );
  } catch (e) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rb) {
        console.error("[import-pg] Rollback failed:", rb);
      }
    }
    console.error("[import-pg] Failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
