/**
 * `VITE_USE_SUPABASE_AUTH=true` 이면 로그인/가입을 Supabase Auth로 처리하고,
 * API 호출에는 Supabase `session.access_token`을 Bearer로 넣습니다.
 * 백엔드는 `AUTH_PROVIDER=supabase` + `SUPABASE_JWT_SECRET`으로 동일 토큰을 검증합니다.
 */
export function isSupabaseAuthFrontend(): boolean {
  const v = import.meta.env.VITE_USE_SUPABASE_AUTH;
  if (v == null || v === "") return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "1";
}
