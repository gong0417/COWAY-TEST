/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Override API origin; default in app is `http://localhost:3000` when unset. */
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GEMINI_API_KEY: string;
  /** Dev only: skip server auth, use localStorage session. */
  readonly VITE_AUTH_OFFLINE: string;
  /** `true`면 Supabase Auth(이메일·비밀번호) 사용. */
  readonly VITE_USE_SUPABASE_AUTH: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
