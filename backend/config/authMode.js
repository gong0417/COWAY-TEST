/**
 * 인증 백엔드 선택
 * - `jwt`: 기존 PostgreSQL `users` + JWT (시놀로지 NAS 등 자체 PG와 함께 쓰기 좋음)
 * - `supabase`: Authorization Bearer에 Supabase `access_token`(JWT) — Supabase Auth 사용
 */
export function getAuthProvider() {
  const v = process.env.AUTH_PROVIDER?.trim().toLowerCase();
  if (v === "supabase") return "supabase";
  return "jwt";
}
