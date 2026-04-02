/** API 응답 본문·상태코드를 사용자용 한글 메시지로 변환 */
export function friendlyApiMessage(status: number, bodyText: string): string {
  if (status === 503) {
    try {
      const j = JSON.parse(bodyText) as { error?: string };
      if (j?.error?.includes("PostgreSQL")) {
        return "PostgreSQL가 연결되지 않았습니다. 서버에 DATABASE_URL(또는 PG 접속 정보)을 설정하면 이 탭에서 DB를 직접 관리할 수 있습니다.";
      }
    } catch {
      /* ignore */
    }
    return "백엔드 데이터베이스에 연결할 수 없습니다. 관리자에게 DB 설정을 확인해 달라고 요청하세요.";
  }
  if (status === 404) return "요청한 리소스를 찾을 수 없습니다.";
  if (status === 409) return "이미 동일한 키가 등록되어 있습니다.";
  try {
    const j = JSON.parse(bodyText) as { error?: string };
    if (j?.error === "PostgreSQL is not configured") {
      return "PostgreSQL가 연결되지 않았습니다. DATABASE_URL 설정 후 서버를 다시 시작하세요.";
    }
    if (j?.error) return j.error;
  } catch {
    /* plain text */
  }
  const t = bodyText.trim();
  if (t.length > 200) return `${t.slice(0, 200)}…`;
  return t || `요청 실패 (HTTP ${status})`;
}
