import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/** This file lives in /frontend — always use that folder as Vite root, even if the CLI is run from the repo root. */
const frontendRoot = fileURLToPath(new URL(".", import.meta.url));
/** Parent of /frontend = monorepo root. Load `.env` from there (`VITE_*` only exposed to client). */
const repoRoot = dirname(frontendRoot);

export default defineConfig({
  root: frontendRoot,
  envDir: repoRoot,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
  /** `vite preview`에서도 /api가 백엔드로 가도록 (로컬 점검용) */
  preview: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:3000",
        changeOrigin: true,
      },
    },
  },
});
