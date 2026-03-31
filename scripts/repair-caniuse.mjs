/**
 * caniuse-lite가 OneDrive/백신 등으로 불완전하게 풀린 경우
 * browserslist가 require하는 dist/unpacker/feature.js 가 없어지는 문제를 복구합니다.
 */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const nm = join(root, "node_modules");
const broken = join(nm, "caniuse-lite");
const marker = join(broken, "dist", "unpacker", "feature.js");

if (existsSync(broken) && !existsSync(marker)) {
  console.warn("[repair-caniuse] 불완전한 caniuse-lite 폴더를 제거합니다.");
  rmSync(broken, { recursive: true, force: true });
}

console.log("[repair-caniuse] npm install caniuse-lite …");
execSync("npm install caniuse-lite@1.0.30001782 --no-audit --no-fund", {
  cwd: root,
  stdio: "inherit",
  shell: true,
});
