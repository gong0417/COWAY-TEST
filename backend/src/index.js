import cors from "cors";
import express from "express";
import multer from "multer";
import { mkdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { parseAllFromDisk } from "./csvParse.js";
import {
  loadInspectionOverlay,
  saveInspectionOverlay,
  loadFileUploads,
  saveFileUploads,
  mergeInspectionItems,
} from "./stateStore.js";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "../..");
const dataDir = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : join(repoRoot, "data");

const PORT = Number(process.env.PORT) || 4000;

const ALLOWED_CSV = new Set([
  "ssm.csv",
  "inspection_items.csv",
  "reliability_standards.csv",
]);

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const uploadsDir = join(dataDir, "uploads");
mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-가-힣]+/g, "_");
    cb(null, `${Date.now()}_${safe}`);
  },
});
const upload = multer({ storage });

function ensureDataFiles() {
  const required = ["ssm.csv", "inspection_items.csv", "reliability_standards.csv"];
  for (const f of required) {
    const p = join(dataDir, f);
    if (!existsSync(p)) {
      console.warn(`[backend] Missing data file: ${p}`);
    }
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, dataDir });
});

/** Raw CSV for frontend parser fallback / consistency */
app.get("/api/db/:name", (req, res) => {
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
});

/** Collections shape (ex–Firestore) for tooling */
app.get("/api/collections", (_req, res) => {
  try {
    const { failureCases, reliabilityStandards, inspectionItems } =
      parseAllFromDisk(dataDir);
    const overlay = loadInspectionOverlay(dataDir);
    res.json({
      failureCases,
      reliabilityStandards,
      inspectionItems: mergeInspectionItems(inspectionItems, overlay),
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.get("/api/inspection-items", (_req, res) => {
  try {
    const { inspectionItems } = parseAllFromDisk(dataDir);
    const overlay = loadInspectionOverlay(dataDir);
    res.json(mergeInspectionItems(inspectionItems, overlay));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post("/api/inspection-items", (req, res) => {
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
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.patch("/api/inspection-items/:id", (req, res) => {
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
      insulationResistance: body.insulationResistance?.trim() ?? base.insulationResistance,
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
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.delete("/api/inspection-items/:id", (req, res) => {
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
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post("/api/inspection-items/batch", (req, res) => {
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
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.get("/api/file-uploads", (_req, res) => {
  try {
    res.json(loadFileUploads(dataDir));
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.post("/api/file-uploads", upload.array("files", 20), (req, res) => {
  try {
    const files = req.files;
    if (!files?.length) {
      return res.status(400).json({ error: "No files" });
    }
    const list = loadFileUploads(dataDir);
    for (const f of files) {
      list.push({
        id: randomUUID(),
        fileName: f.originalname,
        url: `/api/files/${f.filename}`,
        createdAt: Date.now(),
      });
    }
    saveFileUploads(dataDir, list);
    res.json({ ok: true, count: files.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
  }
});

app.use("/api/files", express.static(uploadsDir));

ensureDataFiles();

app.listen(PORT, () => {
  console.log(`[backend] http://localhost:${PORT}  dataDir=${dataDir}`);
});
