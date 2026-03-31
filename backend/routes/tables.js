import { Router } from "express";

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

/**
 * @param {import('pg').Pool | null} pool
 */
export function createTableRouter(pool) {
  const router = Router();

  /** Discovery: all whitelisted tables and their GET URLs (mounted under `/api`). */
  router.get("/tables", (_req, res) => {
    res.json({
      tables: Object.keys(TABLE_META).map((name) => ({
        name,
        primaryKey: TABLE_META[name].pk,
        getAll: `/api/${name}`,
        getById: `/api/${name}/:id`,
      })),
    });
  });

  router.get("/:table", async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    if (!pool) {
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

  router.get("/:table/:id", async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    if (!pool) {
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    const id = req.params.id;
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

  router.post("/:table", async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    if (!pool) {
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    const body = req.body;
    if (!body || typeof body !== "object") {
      return res.status(400).json({ error: "JSON body required" });
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

  router.delete("/:table/:id", async (req, res, next) => {
    const table = req.params.table;
    const meta = TABLE_META[table];
    if (!meta) {
      return res.status(404).json({ error: "Unknown table" });
    }
    if (!pool) {
      return res.status(503).json({ error: "PostgreSQL is not configured" });
    }
    const id = req.params.id;
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
