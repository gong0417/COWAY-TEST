import { cpSync, existsSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "DB");
const dest = join(root, "public", "DB");

if (!existsSync(src)) {
  console.warn("[sync-db] DB 폴더가 없습니다:", src);
  process.exit(0);
}

mkdirSync(dirname(dest), { recursive: true });
cpSync(src, dest, { recursive: true });
console.log("[sync-db] 복사 완료:", src, "→", dest);
