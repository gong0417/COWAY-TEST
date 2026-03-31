#!/usr/bin/env node
/**
 * ETL: /data/*.csv → PostgreSQL (ssm_cases, inspection_items, reliability_standards)
 * Uses: pg, csv-parser, one transaction per run.
 * - Empty CSV cells → SQL NULL; revision_date parsed to DATE or NULL.
 * - Duplicate PKs in CSV: last row wins before insert (dedupe).
 * - Duplicate PKs in DB: ON CONFLICT DO NOTHING (existing row kept).
 *
 * Loads repo root `.env` if present (DATABASE_URL or PG*).
 * Optional: DATA_DIR (default: ./data under repo root).
 */

import { createReadStream, existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import csv from "csv-parser";
import pg from "pg";

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
  console.warn("[importCsv] .env load:", e instanceof Error ? e.message : e);
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

function parseDate(raw) {
  const t = emptyToNull(raw);
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return t.slice(0, 10);
}

/**
 * @param {string} filePath
 * @returns {Promise<Record<string, string>[]>}
 */
function readCsv(filePath) {
  if (!existsSync(filePath)) {
    return Promise.reject(new Error(`File not found: ${filePath}`));
  }
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(filePath)
      .pipe(csv({ mapHeaders: ({ header }) => header.trim() }))
      .on("data", (row) => {
        const hasValue = Object.values(row).some(
          (v) => v != null && String(v).trim() !== "",
        );
        if (hasValue) rows.push(row);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
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
      `[importCsv] ${label}: ${dup.length} duplicate PK(s) in CSV — last row wins`,
    );
  }
  return [...map.values()];
}

function getPoolConfig() {
  const url = process.env.DATABASE_URL?.trim();
  if (url) return { connectionString: url };
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

const INSERT_SSM = `
INSERT INTO ssm_cases (
  ssm_id, ssm_defining, ssm_trouble, ssm_stress, ssm_strength, ssm_controling,
  prevention, test_item, test_criteria, product_line, document_title, file_url
) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
ON CONFLICT (ssm_id) DO NOTHING
`;

const INSERT_INSPECTION = `
INSERT INTO inspection_items (
  check_id, category, inspection_item, internal_standard, method, revision_date
) VALUES ($1,$2,$3,$4,$5,$6)
ON CONFLICT (check_id) DO NOTHING
`;

const INSERT_REL = `
INSERT INTO reliability_standards (
  standard_id, component_name, test_name, test_condition,
  acceptance_criteria, sample_size, related_doc
) VALUES ($1,$2,$3,$4,$5,$6,$7)
ON CONFLICT (standard_id) DO NOTHING
`;

async function main() {
  const pool = new pg.Pool({ ...getPoolConfig(), max: 5 });
  let client;
  try {
    client = await pool.connect();
    await client.query("BEGIN");

    const ssmRows = dedupe(
      await readCsv(FILES.ssm),
      (r) => emptyToNull(r["SSM ID"]),
      "ssm.csv",
    );
    let insSsm = 0;
    for (const r of ssmRows) {
      const q = await client.query(INSERT_SSM, [
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
      insSsm += q.rowCount;
    }

    const insRows = dedupe(
      await readCsv(FILES.inspection),
      (r) => emptyToNull(r.checkId),
      "inspection_items.csv",
    );
    let insIns = 0;
    for (const r of insRows) {
      const q = await client.query(INSERT_INSPECTION, [
        emptyToNull(r.checkId),
        emptyToNull(r.category),
        emptyToNull(r.inspectionItem),
        emptyToNull(r.internalStandard),
        emptyToNull(r.method),
        parseDate(r.revisionDate),
      ]);
      insIns += q.rowCount;
    }

    const relRows = dedupe(
      await readCsv(FILES.reliability),
      (r) => emptyToNull(r.standardId),
      "reliability_standards.csv",
    );
    let insRel = 0;
    for (const r of relRows) {
      const q = await client.query(INSERT_REL, [
        emptyToNull(r.standardId),
        emptyToNull(r.componentName),
        emptyToNull(r.testName),
        emptyToNull(r.testCondition),
        emptyToNull(r.acceptanceCriteria),
        emptyToNull(r.sampleSize),
        emptyToNull(r.relatedDoc),
      ]);
      insRel += q.rowCount;
    }

    await client.query("COMMIT");
    console.log(
      `[importCsv] OK DATA_DIR=${DATA_DIR}`,
    );
    console.log(
      `  ssm_cases:            inserted ${insSsm} / ${ssmRows.length} (skipped ${ssmRows.length - insSsm} existing PK)`,
    );
    console.log(
      `  inspection_items:   inserted ${insIns} / ${insRows.length} (skipped ${insRows.length - insIns})`,
    );
    console.log(
      `  reliability_standards: inserted ${insRel} / ${relRows.length} (skipped ${relRows.length - insRel})`,
    );
  } catch (e) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch (rb) {
        console.error("[importCsv] ROLLBACK failed:", rb);
      }
    }
    console.error("[importCsv] Failed:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main();
