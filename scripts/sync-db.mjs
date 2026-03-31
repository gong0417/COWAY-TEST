import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const src = join(root, "data");
const dest = join(root, "frontend", "public", "DB");

function copyDirRecursive(from, to) {
  mkdirSync(to, { recursive: true });
  for (const name of readdirSync(from, { withFileTypes: true })) {
    if (name.name.startsWith(".") || name.name === "_state" || name.name === "uploads") {
      continue;
    }
    const fromPath = join(from, name.name);
    const toPath = join(to, name.name);
    if (name.isDirectory()) {
      copyDirRecursive(fromPath, toPath);
    } else if (name.name.endsWith(".csv")) {
      copyFileSync(fromPath, toPath);
    }
  }
}

if (!existsSync(src)) {
  console.warn("[sync-db] data 폴더가 없습니다:", src);
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
copyDirRecursive(src, dest);
console.log("[sync-db] 복사 완료:", src, "→", dest);
