import type { FailureCase, InspectionItem } from "@/types/models";

export type MonthlyFailurePoint = { monthKey: string; label: string; count: number };

function parseOccurredAt(s?: string): Date | null {
  if (!s?.trim()) return null;
  const t = Date.parse(s.replace(/\./g, "-"));
  if (!Number.isNaN(t)) return new Date(t);
  const m = s.match(/(\d{4})[.\-/](\d{1,2})/);
  if (m) return new Date(Number(m[1]), Number(m[2]) - 1, 1);
  return null;
}

function monthKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  return `${y}-${mo}`;
}

function monthLabel(key: string): string {
  const [y, m] = key.split("-");
  return `${y}.${m}`;
}

/** 최근 `months`개월 월별 실패 사례 건수 (데이터 없는 달은 0) */
export function buildMonthlyFailureSeries(
  cases: FailureCase[],
  months = 6,
): MonthlyFailurePoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    keys.push(monthKey(d));
  }
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);
  for (const c of cases) {
    const d = parseOccurredAt(c.occurredAt);
    if (!d) continue;
    const k = monthKey(d);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return keys.map((monthKeyVal) => ({
    monthKey: monthKeyVal,
    label: monthLabel(monthKeyVal),
    count: counts.get(monthKeyVal) ?? 0,
  }));
}

/**
 * 대시보드용 단일 지표: 등록 부품 대비 실패 사례 비율(%).
 * 역사적 결함률이 아니라 현재 DB 스냅샷 기준 노출 지표입니다.
 */
export function defectExposurePercent(
  inspectionItems: InspectionItem[],
  failureCases: FailureCase[],
): number {
  const n = inspectionItems.length;
  if (n === 0) return 0;
  return Math.min(100, Math.round((failureCases.length / n) * 1000) / 10);
}
