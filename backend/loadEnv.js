import { config } from "dotenv";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
/** Repo root (backend/ → ..) */
const repoRoot = join(__dirname, "..");

config({ path: join(repoRoot, ".env") });
