import "./loadEnv.js";
import { createApp } from "./app.js";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..");
const dataDir = process.env.DATA_DIR
  ? process.env.DATA_DIR
  : join(repoRoot, "data");

const PORT = Number(process.env.PORT) || 3000;
const app = createApp({ dataDir });

app.listen(PORT, () => {
  console.log(`[backend] http://localhost:${PORT}  dataDir=${dataDir}`);
});
