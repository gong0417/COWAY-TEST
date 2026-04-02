/**
 * Merge CSV-backed collections with JSON overlays (PostgreSQL replacement).
 */
import { mapSsmFromPg, mapStandardFromPg } from "../db/pgCollections.js";
import { parseAllFromDisk } from "./csvParse.js";
import {
  loadReliabilityStandardsOverlay,
  loadSsmOverlay,
} from "./stateStore.js";

const SSM_COLS = [
  "ssm_id",
  "ssm_defining",
  "ssm_trouble",
  "ssm_stress",
  "ssm_strength",
  "ssm_controling",
  "prevention",
  "test_item",
  "test_criteria",
  "product_line",
  "document_title",
  "file_url",
];

const REL_COLS = [
  "standard_id",
  "component_name",
  "test_name",
  "test_condition",
  "acceptance_criteria",
  "sample_size",
  "related_doc",
];

function emptySsmRow(id) {
  const o = { ssm_id: id };
  for (const k of SSM_COLS) {
    if (k !== "ssm_id") o[k] = null;
  }
  return o;
}

function emptyRelRow(id) {
  const o = { standard_id: id };
  for (const k of REL_COLS) {
    if (k !== "standard_id") o[k] = null;
  }
  return o;
}

/** @param {{ id: string } & Record<string, unknown>} c */
export function failureCaseToSsmPgRow(c) {
  return {
    ssm_id: c.id,
    ssm_defining: c.ssmDefining ?? c.partName ?? null,
    ssm_trouble: c.ssmTrouble ?? c.summary ?? c.title ?? null,
    ssm_stress: c.ssmStress ?? null,
    ssm_strength: c.ssmStrength ?? null,
    ssm_controling: c.ssmControlling ?? null,
    prevention: c.prevention ?? null,
    test_item: c.testItem ?? null,
    test_criteria: c.testCriteria ?? null,
    product_line: c.productLine ?? null,
    document_title: c.documentTitle ?? null,
    file_url: c.documentUrl ?? null,
  };
}

/** @param {{ id: string } & Record<string, unknown>} s */
export function reliabilityStandardToRelPgRow(s) {
  return {
    standard_id: s.id,
    component_name: s.componentName ?? null,
    test_name: s.testName ?? null,
    test_condition: s.testCondition ?? null,
    acceptance_criteria: s.acceptanceCriteria ?? null,
    sample_size: s.sampleSize ?? null,
    related_doc: s.relatedDoc ?? null,
  };
}

function normalizeSsmRow(row) {
  const o = emptySsmRow(String(row.ssm_id ?? ""));
  for (const k of SSM_COLS) {
    if (row[k] !== undefined) o[k] = row[k];
  }
  return o;
}

function normalizeRelRow(row) {
  const o = emptyRelRow(String(row.standard_id ?? ""));
  for (const k of REL_COLS) {
    if (row[k] !== undefined) o[k] = row[k];
  }
  return o;
}

/**
 * @param {string} dataDir
 * @returns {Record<string, unknown>[]}
 */
export function mergeSsmPgRows(dataDir) {
  const { failureCases } = parseAllFromDisk(dataDir);
  const overlay = loadSsmOverlay(dataDir);
  const baseMap = new Map();
  for (const c of failureCases) {
    if (overlay.deletedCsvIds.includes(c.id)) continue;
    baseMap.set(c.id, failureCaseToSsmPgRow(c));
  }
  for (const [id, doc] of Object.entries(overlay.byId)) {
    const prev = baseMap.get(id);
    const merged = normalizeSsmRow({
      ...(prev || emptySsmRow(id)),
      ...doc,
      ssm_id: id,
    });
    baseMap.set(id, merged);
  }
  return Array.from(baseMap.values()).sort((a, b) =>
    String(a.ssm_id).localeCompare(String(b.ssm_id), "ko"),
  );
}

/**
 * @param {string} dataDir
 * @returns {Record<string, unknown>[]}
 */
export function mergeReliabilityPgRows(dataDir) {
  const { reliabilityStandards } = parseAllFromDisk(dataDir);
  const overlay = loadReliabilityStandardsOverlay(dataDir);
  const baseMap = new Map();
  for (const s of reliabilityStandards) {
    if (overlay.deletedCsvIds.includes(s.id)) continue;
    baseMap.set(s.id, reliabilityStandardToRelPgRow(s));
  }
  for (const [id, doc] of Object.entries(overlay.byId)) {
    const prev = baseMap.get(id);
    const merged = normalizeRelRow({
      ...(prev || emptyRelRow(id)),
      ...doc,
      standard_id: id,
    });
    baseMap.set(id, merged);
  }
  return Array.from(baseMap.values()).sort((a, b) =>
    String(a.standard_id).localeCompare(String(b.standard_id), "ko"),
  );
}

/**
 * @param {string} dataDir
 */
export function mergedFailureCasesForApi(dataDir) {
  return mergeSsmPgRows(dataDir).map((row) => mapSsmFromPg(row));
}

/**
 * @param {string} dataDir
 */
export function mergedReliabilityStandardsForApi(dataDir) {
  return mergeReliabilityPgRows(dataDir).map((row) => mapStandardFromPg(row));
}
