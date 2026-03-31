import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";

const defaultInspectionOverlay = () => ({
  byId: {},
  deletedCsvIds: [],
});

const defaultUploads = () => [];

export function getStatePaths(dataDir) {
  const stateDir = join(dataDir, "_state");
  return {
    stateDir,
    inspectionOverlay: join(stateDir, "inspection_overlay.json"),
    fileUploads: join(stateDir, "file_uploads.json"),
  };
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback();
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return fallback();
  }
}

export function loadInspectionOverlay(dataDir) {
  const { inspectionOverlay } = getStatePaths(dataDir);
  const raw = readJson(inspectionOverlay, defaultInspectionOverlay);
  return {
    byId: typeof raw.byId === "object" && raw.byId ? raw.byId : {},
    deletedCsvIds: Array.isArray(raw.deletedCsvIds) ? raw.deletedCsvIds : [],
  };
}

export function saveInspectionOverlay(dataDir, overlay) {
  const { stateDir, inspectionOverlay } = getStatePaths(dataDir);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(inspectionOverlay, JSON.stringify(overlay, null, 2), "utf8");
}

export function loadFileUploads(dataDir) {
  const { fileUploads } = getStatePaths(dataDir);
  const list = readJson(fileUploads, defaultUploads);
  return Array.isArray(list) ? list : [];
}

export function saveFileUploads(dataDir, list) {
  const { stateDir, fileUploads } = getStatePaths(dataDir);
  mkdirSync(stateDir, { recursive: true });
  writeFileSync(fileUploads, JSON.stringify(list, null, 2), "utf8");
}

/** Merge CSV inspection rows with overlay (Firestore replacement). */
export function mergeInspectionItems(csvItems, overlay) {
  const csvIds = new Set(csvItems.map((r) => r.id));
  const baseMap = new Map();
  for (const row of csvItems) {
    if (overlay.deletedCsvIds.includes(row.id)) continue;
    baseMap.set(row.id, { ...row });
  }
  for (const [id, doc] of Object.entries(overlay.byId)) {
    const prev = baseMap.get(id);
    baseMap.set(id, prev ? { ...prev, ...doc, id } : { ...doc, id });
  }
  return Array.from(baseMap.values());
}
