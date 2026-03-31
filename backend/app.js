import cors from "cors";
import express from "express";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getPool } from "./db/pool.js";
import { registerCsvRoutes, ensureDataFiles } from "./routes/csv.js";
import { createTableRouter } from "./routes/tables.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");

/**
 * @param {{ dataDir?: string }} [opts]
 */
export function createApp(opts = {}) {
  const dataDir = opts.dataDir
    ? opts.dataDir
    : process.env.DATA_DIR
      ? process.env.DATA_DIR
      : join(repoRoot, "data");

  const app = express();
  const corsOrigin = process.env.CORS_ORIGIN;
  app.use(
    cors(
      corsOrigin
        ? { origin: corsOrigin.split(",").map((s) => s.trim()) }
        : { origin: true },
    ),
  );
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

  const pool = getPool();
  registerCsvRoutes(app, { dataDir, uploadsDir, upload, pool });
  ensureDataFiles(dataDir);

  app.use("/api", createTableRouter(pool));

  app.use((err, _req, res, _next) => {
    console.error("[backend]", err);
    if (res.headersSent) return;
    const status =
      err.status && Number.isFinite(err.status) ? err.status : 500;
    const message =
      status === 500 ? "Internal Server Error" : err.message || String(err);
    res.status(status).json({ error: message });
  });

  return app;
}
