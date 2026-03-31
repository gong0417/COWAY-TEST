/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override API origin; default in app is `http://localhost:3000` when unset. */
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
