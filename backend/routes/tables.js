import { Router } from "express";
import {
  inspectionPgRowToOverlayDoc,
  mergeInspectionPgRows,
  mergeReliabilityPgRows,
  mergeSsmPgRows,
} from "../src/collectionMerge.js";
import { parseAllFromDisk } from "../src/csvParse.js";
import {
  loadInspectionOverlay,
  loadReliabilityStandardsOverlay,
  loadSsmOverlay,
  saveInspectionOverlay,
  saveReliabilityStandardsOverlay,
  saveSsmOverlay,
} from "../src/stateStore.js";

/**
 * Whitelisted tables only (matches db/schema.sql). Prevents arbitrary SQL.
 * @type {Record<string, { pk: string; columns: string[] }>}
 */
export const TABLE_META = {
  ssm_cases: {
    pk: "ssm_id",
    columns: [
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
    ],
  },
  inspection_items: {
    pk: "check_id",
    columns: [
      "check_id",
      "category",
      "inspection_item",
      "internal_standard",
      "method",
      "revision_date",
    ],
  },
  reliability_standards: {
    pk: "standard_id",
    columns: [
      "standard_id",
      "component_name",
      "test_name",
      "test_condition",
      "acceptance_criteria",
      "sample_size",
      "related_doc",
    ],
  },
};

function validateBodyColumns(table, body) {
  const meta = TABLE_META[table];
  const allowed = new Set(meta.columns);
  const keys = Object.keys(body ?? {}).filter((k) => body[k] !== undefined);
  const bad = keys.filter((k) => !allowed.has(k));
  if (bad.length) {
    const err = new Error(`Unknown columns: ${bad.join(", ")}`);
    err.status = 400;
    throw err;
  }
}

function normalizeValue(col, value) {
  if (value === null || value === "") return null;
  if (col === "revision_date" && typeof value === "string") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return null;
    return value.slice(0, 10);
  }
  return value;
}

function requireDataDir(dataDir, res) {
  if (!dataDir || typeof dataDir !== "string") {
    res.status(500).json({ error: "Server dataDir is not configured" });
    return false;
  }
  return true;
}

function deleteSsmFileBacked(dataDir, id) {
  const overlay = loadSsmOverlay(dataDir);
  const { failureCases } = parseAllFromDisk(dataDir);
  const inCsv = failureCases.some((c) => c.id === id);
  if (inCsv && !overlay.deletedCsvIds.includes(id)) {
    overlay.deletedCsvIds.push(id);
  }
  delete overlay.byId[id];
  saveSsmOverlay(dataDir, overlay);
}

function deleteReliabilityFileBacked(dataDir, id) {
  const overlay = loadReliabilityStandardsOverlay(dataDir);
  const { reliabilityStandards } = parseAllFromDisk(dataDir);
  const inCsv = reliabilityStandards.some((s) => s.id === id);
  if (inCsv && !overlay.deletedCsvIds.includes(id)) {
    overlay.deletedCsvIds.push(id);
  }
  delete overlay.byId[id];
  saveReliabilityStandardsOverlay(dataDir, overlay);
}

function deleteInspectionFileBacked(dataDir, id) {
  const overlay = loadInspectionOverlay(dataDir);
  const { inspectionItems } = parseAllFromDisk(dataDir);
  const inCsv = inspectionItems.some((r) => r.id === id);
  if (inCsv && !overlay.deletedCsvIds.includes(id)) {
    overlay.deletedCsvIds.push(id);
  }
  delete overlay.byId[id];
  saveInspectionOverlay(dataDir, overlay);
}

/**
 * @param {import('pg').Pool | null} pool
 * @param {{ dataDir?: string; requireAuth?: import('express').RequestHandler; requireAdmin?: import('express').RequestHandler }} [opts]
 */
export function createTableRouter(pool, opts = {}) {
  const dataDir = opts.dataDir;
  const { requireAuth, requireAdmin } = opts;
  const router = Router();

  /** Discovery: all whitelisted tables and their GET URLs (mounted under `/api`). */
  router.get("/tables", requireAuth, (_req, res) => {
    res.json({
      tables: Object.keys(TABLE_META).map((name) => ({
        name,
        primaryKey: TABLE_META[name].pk,
        getAll: `/api/${name}`,
        getById: `/api/${name}/:id`,
      })),
    });
  });

  router.get("/:table", requireAuth, async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    if (!pool) {
      if (table === "ssm_cases") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          return res.json(mergeSsmPgRows(dataDir));
        } catch (e) {
          return next(e);
        }
      }
      if (table === "reliability_standards") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          return res.json(mergeReliabilityPgRows(dataDir));
        } catch (e) {
          return next(e);
        }
      }
      if (table === "inspection_items") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          return res.json(mergeInspectionPgRows(dataDir));
        } catch (e) {
          return next(e);
        }
      }
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ${table} ORDER BY ${meta.pk} ASC`,
      );
      res.json(rows);
    } catch (e) {
      next(e);
    }
  });

  router.get("/:table/:id", requireAuth, async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    const id = req.params.id;
    if (!pool) {
      if (table === "ssm_cases") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeSsmPgRows(dataDir);
          const row = rows.find((r) => String(r.ssm_id) === id);
          if (!row) return res.status(404).json({ error: "Not found" });
          return res.json(row);
        } catch (e) {
          return next(e);
        }
      }
      if (table === "reliability_standards") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeReliabilityPgRows(dataDir);
          const row = rows.find((r) => String(r.standard_id) === id);
          if (!row) return res.status(404).json({ error: "Not found" });
          return res.json(row);
        } catch (e) {
          return next(e);
        }
      }
      if (table === "inspection_items") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeInspectionPgRows(dataDir);
          const row = rows.find((r) => String(r.check_id) === id);
          if (!row) return res.status(404).json({ error: "Not found" });
          return res.json(row);
        } catch (e) {
          return next(e);
        }
      }
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ${table} WHERE ${meta.pk} = $1`,
        [id],
      );
      if (!rows.length) {
        return res.status(404).json({ error: "Not found" });
      }
      res.json(rows[0]);
    } catch (e) {
      next(e);
    }
  });

  router.post("/:table", requireAuth, requireAdmin, async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "JSON body required" });
    }
    if (!pool) {
      if (
        table !== "ssm_cases" &&
        table !== "reliability_standards" &&
        table !== "inspection_items"
      ) {
        return res.status(503).json({ error: "PostgreSQL is not configured" });
      }
      if (!requireDataDir(dataDir, res)) return;
      try {
        validateBodyColumns(table, body);
        const pkVal = body[meta.pk];
        if (pkVal == null || String(pkVal).trim() === "") {
          return res.status(400).json({ error: `${meta.pk} is required` });
        }
        const id = String(pkVal).trim();
        const overlay =
          table === "ssm_cases"
            ? loadSsmOverlay(dataDir)
            : table === "reliability_standards"
              ? loadReliabilityStandardsOverlay(dataDir)
              : loadInspectionOverlay(dataDir);
        const rowsMerged =
          table === "ssm_cases"
            ? mergeSsmPgRows(dataDir)
            : table === "reliability_standards"
              ? mergeReliabilityPgRows(dataDir)
              : mergeInspectionPgRows(dataDir);
        const existing = rowsMerged.find((r) => String(r[meta.pk]) === id);
        if (existing && !overlay.byId[id]) {
          return res.status(409).json({ error: "Duplicate primary key" });
        }
        const mergedRow = {};
        for (const c of meta.columns) {
          mergedRow[c] =
            body[c] !== undefined
              ? normalizeValue(c, body[c])
              : existing?.[c] ?? null;
        }
        mergedRow[meta.pk] = id;
        if (table === "inspection_items") {
          const appDoc = inspectionPgRowToOverlayDoc(mergedRow);
          overlay.byId[id] = { ...overlay.byId[id], ...appDoc };
          saveInspectionOverlay(dataDir, overlay);
          const rows = mergeInspectionPgRows(dataDir);
          const row = rows.find((r) => String(r.check_id) === id);
          return res.status(201).json(row);
        }
        overlay.byId[id] = { ...overlay.byId[id], ...mergedRow };
        if (table === "ssm_cases") {
          saveSsmOverlay(dataDir, overlay);
          const rows = mergeSsmPgRows(dataDir);
          const row = rows.find((r) => String(r[meta.pk]) === id);
          return res.status(201).json(row);
        }
        saveReliabilityStandardsOverlay(dataDir, overlay);
        const rows = mergeReliabilityPgRows(dataDir);
        const row = rows.find((r) => String(r[meta.pk]) === id);
        return res.status(201).json(row);
      } catch (e) {
        if (e && e.status === 400) {
          return res.status(400).json({ error: e.message });
        }
        return next(e);
      }
    }
    try {
      validateBodyColumns(table, body);
      if (body[meta.pk] == null || String(body[meta.pk]).trim() === "") {
        return res.status(400).json({ error: `${meta.pk} is required` });
      }
      const cols = meta.columns.filter((c) => body[c] !== undefined);
      const values = cols.map((c) => normalizeValue(c, body[c]));
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`;
      const { rows } = await pool.query(sql, values);
      res.status(201).json(rows[0]);
    } catch (e) {
      if (e && e.code === "23505") {
        return res.status(409).json({ error: "Duplicate primary key" });
      }
      if (e && e.status === 400) {
        return res.status(400).json({ error: e.message });
      }
      next(e);
    }
  });

  router.delete("/:table/:id", requireAuth, requireAdmin, async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    const id = req.params.id;
    if (!pool) {
      if (table === "ssm_cases") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeSsmPgRows(dataDir);
          if (!rows.some((r) => String(r[meta.pk]) === id)) {
            return res.status(404).json({ error: "Not found" });
          }
          deleteSsmFileBacked(dataDir, id);
          return res.status(204).end();
        } catch (e) {
          return next(e);
        }
      }
      if (table === "reliability_standards") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeReliabilityPgRows(dataDir);
          if (!rows.some((r) => String(r[meta.pk]) === id)) {
            return res.status(404).json({ error: "Not found" });
          }
          deleteReliabilityFileBacked(dataDir, id);
          return res.status(204).end();
        } catch (e) {
          return next(e);
        }
      }
      if (table === "inspection_items") {
        if (!requireDataDir(dataDir, res)) return;
        try {
          const rows = mergeInspectionPgRows(dataDir);
          if (!rows.some((r) => String(r[meta.pk]) === id)) {
            return res.status(404).json({ error: "Not found" });
          }
          deleteInspectionFileBacked(dataDir, id);
          return res.status(204).end();
        } catch (e) {
          return next(e);
        }
      }
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    try {
      const r = await pool.query(
        `DELETE FROM ${table} WHERE ${meta.pk} = $1`,
        [id],
      );
      if (r.rowCount === 0) {
        return res.status(404).json({ error: "Not found" });
      }
      res.status(204).end();
    } catch (e) {
      next(e);
    }
  });

  return router;
}
