/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Optional absolute API origin for production (e.g. https://nas.example.com). Empty = same-origin /api (Vite proxy in dev). */
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
