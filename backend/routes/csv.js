import express from "express";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { parseAllFromDisk } from "../src/csvParse.js";
import {
  loadInspectionOverlay,
  saveInspectionOverlay,
  loadFileUploads,
  saveFileUploads,
  mergeInspectionItems,
} from "../src/stateStore.js";
import { loadCollectionsFromPool } from "../db/pgCollections.js";
import {
  mergedFailureCasesForApi,
  mergedReliabilityStandardsForApi,
} from "../src/collectionMerge.js";
import { getAuthProvider } from "../config/authMode.js";

const ALLOWED_CSV = new Set([
  "ssm.csv",
  "inspection_items.csv",
  "reliability_standards.csv",
]);

/**
 * CSV / overlay routes; read APIs use PostgreSQL (SELECT) when `pool` is set, else CSV files.
 * @param {import('express').Express} app
 * @param {{ dataDir: string; uploadsDir: string; upload: import('multer').Multer; pool?: import('pg').Pool | null; requireAuth: import('express').RequestHandler; requireAdmin: import('express').RequestHandler }} ctx
 */
export function registerCsvRoutes(app, {
  dataDir,
  uploadsDir,
  upload,
  pool,
  requireAuth,
  requireAdmin,
}) {
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      dataDir,
      pg: Boolean(pool),
      authProvider: getAuthProvider(),
    });
  });

  app.get("/api/db/:name", requireAuth, requireAdmin, (req, res, next) => {
    try {
      const name = req.params.name;
      if (!ALLOWED_CSV.has(name)) {
        return res.status(404).json({ error: "Unknown file" });
      }
      const path = join(dataDir, name);
      if (!existsSync(path)) {
        return res.status(404).json({ error: "Not found" });
      }
      res.type("text/csv; charset=utf-8");
      res.send(readFileSync(path, "utf8"));
    } catch (e) {
      next(e);
    }
  });

  app.get("/api/collections", requireAuth, async (_req, res, next) => {
    if (pool) {
      try {
        const data = await loadCollectionsFromPool(pool);
        const overlay = loadInspectionOverlay(dataDir);
        return res.json({
          failureCases: data.failureCases,
          reliabilityStandards: data.reliabilityStandards,
          inspectionItems: mergeInspectionItems(data.inspectionItems, overlay),
        });
      } catch (e) {
        console.error("[api/collections] PostgreSQL:", e);
        return next(e);
      }
    }
    try {
      const { inspectionItems } = parseAllFromDisk(dataDir);
      const overlay = loadInspectionOverlay(dataDir);
      res.json({
        failureCases: mergedFailureCasesForApi(dataDir),
        reliabilityStandards: mergedReliabilityStandardsForApi(dataDir),
        inspectionItems: mergeInspectionItems(inspectionItems, overlay),
      });
    } catch (e) {
      console.error(e);
      next(e);
    }
  });

  app.get("/api/failure-cases", requireAuth, async (_req, res, next) => {
    if (pool) {
      try {
        const data = await loadCollectionsFromPool(pool);
        return res.json(data.failureCases);
      } catch (e) {
        console.error("[api/failure-cases] PostgreSQL:", e);
        return next(e);
      }
    }
    try {
      res.json(mergedFailureCasesForApi(dataDir));
    } catch (e) {
      console.error(e);
      next(e);
    }
  });

  app.get("/api/reliability-standards", requireAuth, async (_req, res, next) => {
    if (pool) {
      try {
        const data = await loadCollectionsFromPool(pool);
        return res.json(data.reliabilityStandards);
      } catch (e) {
        console.error("[api/reliability-standards] PostgreSQL:", e);
        return next(e);
      }
    }
    try {
      res.json(mergedReliabilityStandardsForApi(dataDir));
    } catch (e) {
      console.error(e);
      next(e);
    }
  });

  app.get("/api/inspection-items", requireAuth, async (_req, res, next) => {
    if (pool) {
      try {
        const data = await loadCollectionsFromPool(pool);
        const overlay = loadInspectionOverlay(dataDir);
        return res.json(mergeInspectionItems(data.inspectionItems, overlay));
      } catch (e) {
        console.error("[api/inspection-items] PostgreSQL:", e);
        return next(e);
      }
    }
    try {
      const { inspectionItems } = parseAllFromDisk(dataDir);
      const overlay = loadInspectionOverlay(dataDir);
      res.json(mergeInspectionItems(inspectionItems, overlay));
    } catch (e) {
      console.error(e);
      next(e);
    }
  });

  app.post(
    "/api/inspection-items",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
    try {
      const body = req.body;
      if (!body?.name?.trim()) {
        return res.status(400).json({ error: "name required" });
      }
      const id = `ins-${randomUUID()}`;
      const overlay = loadInspectionOverlay(dataDir);
      const row = {
        id,
        checkId: id,
        name: String(body.name).trim(),
        partNumber: body.partNumber?.trim() || id,
        category: body.category?.trim() || undefined,
        grade: body.grade?.trim() || undefined,
        socPrecision: body.socPrecision?.trim() || undefined,
        insulationResistance: body.insulationResistance?.trim() || undefined,
        notes: body.notes?.trim() || undefined,
        status: body.status ?? "ok",
        updatedAt: Date.now(),
      };
      overlay.byId[id] = row;
      saveInspectionOverlay(dataDir, overlay);
      res.status(201).json(row);
    } catch (e) {
      console.error(e);
      next(e);
    }
  },
  );

  app.patch(
    "/api/inspection-items/:id",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
    try {
      const id = req.params.id;
      const overlay = loadInspectionOverlay(dataDir);
      const prev = overlay.byId[id];
      const { inspectionItems } = parseAllFromDisk(dataDir);
      const fromCsv = inspectionItems.find((r) => r.id === id);
      const base = prev || fromCsv;
      if (!base && overlay.deletedCsvIds.includes(id)) {
        return res.status(404).json({ error: "Not found" });
      }
      if (!base) {
        return res.status(404).json({ error: "Not found" });
      }
      const body = req.body;
      const merged = {
        ...base,
        name: body.name != null ? String(body.name).trim() : base.name,
        partNumber: body.partNumber?.trim() ?? base.partNumber,
        category: body.category?.trim() ?? base.category,
        grade: body.grade?.trim() ?? base.grade,
        socPrecision: body.socPrecision?.trim() ?? base.socPrecision,
        insulationResistance:
          body.insulationResistance?.trim() ?? base.insulationResistance,
        notes: body.notes?.trim() ?? base.notes,
        status: body.status ?? base.status,
        updatedAt: Date.now(),
        id,
      };
      overlay.byId[id] = merged;
      saveInspectionOverlay(dataDir, overlay);
      res.json(merged);
    } catch (e) {
      console.error(e);
      next(e);
    }
  },
  );

  app.delete(
    "/api/inspection-items/:id",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
    try {
      const id = req.params.id;
      const overlay = loadInspectionOverlay(dataDir);
      const { inspectionItems } = parseAllFromDisk(dataDir);
      const inCsv = inspectionItems.some((r) => r.id === id);
      if (inCsv) {
        if (!overlay.deletedCsvIds.includes(id)) {
          overlay.deletedCsvIds.push(id);
        }
      }
      delete overlay.byId[id];
      saveInspectionOverlay(dataDir, overlay);
      res.status(204).end();
    } catch (e) {
      console.error(e);
      next(e);
    }
  },
  );

  app.post(
    "/api/inspection-items/batch",
    requireAuth,
    requireAdmin,
    async (req, res, next) => {
    try {
      const rows = req.body?.rows;
      if (!Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: "rows array required" });
      }
      const overlay = loadInspectionOverlay(dataDir);
      let n = 0;
      for (const r of rows) {
        const id = `ins-${randomUUID()}`;
        overlay.byId[id] = {
          id,
          checkId: id,
          name: String(r.name ?? "").trim() || id,
          partNumber: r.partNumber?.trim() || undefined,
          category: r.category?.trim() || undefined,
          grade: r.grade?.trim() || undefined,
          socPrecision: r.socPrecision?.trim() || undefined,
          insulationResistance: r.insulationResistance?.trim() || undefined,
          notes: r.notes?.trim() || undefined,
          status: r.status ?? "ok",
          updatedAt: Date.now(),
        };
        n += 1;
      }
      saveInspectionOverlay(dataDir, overlay);
      res.json({ written: n });
    } catch (e) {
      console.error(e);
      next(e);
    }
  },
  );

  app.get("/api/file-uploads", requireAuth, requireAdmin, (_req, res, next) => {
    try {
      res.json(loadFileUploads(dataDir));
    } catch (e) {
      next(e);
    }
  });

  app.post(
    "/api/file-uploads",
    requireAuth,
    requireAdmin,
    (req, res, next) => {
      upload.array("files", 20)(req, res, (err) => {
        if (err) return next(err);
        next();
      });
    },
    async (req, res, next) => {
      try {
        const files = req.files;
        if (!files?.length) {
          return res.status(400).json({ error: "No files" });
        }
        const list = loadFileUploads(dataDir);
        const scopeRaw = req.body?.scope;
        const scope =
          typeof scopeRaw === "string" && scopeRaw.trim()
            ? scopeRaw.trim()
            : "inspection";
        for (const f of files) {
          list.push({
            id: randomUUID(),
            fileName: f.originalname,
            url: `/api/files/${f.filename}`,
            createdAt: Date.now(),
            scope,
          });
        }
        saveFileUploads(dataDir, list);
        res.json({ ok: true, count: files.length });
      } catch (e) {
        console.error(e);
        next(e);
      }
    },
  );

  // 직접 링크(<img>, <a href>)는 Authorization을 보낼 수 없어 정적 제공만 허용합니다.
  // 파일명은 업로드 시 타임스탬프가 포함됩니다.
  app.use("/api/files", express.static(uploadsDir));
}

export function ensureDataFiles(dataDir) {
  const required = ["ssm.csv", "inspection_items.csv", "reliability_standards.csv"];
  for (const f of required) {
    const p = join(dataDir, f);
    if (!existsSync(p)) {
      console.warn(`[backend] Missing data file: ${p}`);
    }
  }
}
