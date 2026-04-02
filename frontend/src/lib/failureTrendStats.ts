import type { FailureCase, InspectionItem } from "@/types/models";

export type TrendPoint = {
  key: string;
  label: string;
  count: number;
  /** 월별 시리즈 호환 */
  monthKey?: string;
};

/** @deprecated use TrendPoint */
export type MonthlyFailurePoint = TrendPoint;

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

function dayKey(d: Date): string {
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;
}

/** 최근 `years`년 연도별 건수 (occurredAt 파싱 가능한 행만 집계) */
export function buildYearlyFailureSeries(
  cases: FailureCase[],
  years = 5,
): TrendPoint[] {
  const now = new Date();
  const startY = now.getFullYear() - (years - 1);
  const keys: string[] = [];
  for (let y = startY; y <= now.getFullYear(); y++) keys.push(String(y));
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);
  for (const c of cases) {
    const d = parseOccurredAt(c.occurredAt);
    if (!d) continue;
    const y = String(d.getFullYear());
    if (counts.has(y)) counts.set(y, (counts.get(y) ?? 0) + 1);
  }
  return keys.map((k) => ({
    key: k,
    label: `${k}년`,
    count: counts.get(k) ?? 0,
  }));
}

/** 최근 `days`일 일별 건수 */
export function buildDailyFailureSeries(
  cases: FailureCase[],
  days = 30,
): TrendPoint[] {
  const now = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    keys.push(dayKey(d));
  }
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, 0);
  for (const c of cases) {
    const d = parseOccurredAt(c.occurredAt);
    if (!d) continue;
    const k = dayKey(d);
    if (counts.has(k)) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return keys.map((k) => {
    const [, m, day] = k.split("-");
    return { key: k, label: `${m}/${day}`, count: counts.get(k) ?? 0 };
  });
}

/** 최근 `months`개월 월별 실패 사례 건수 (데이터 없는 달은 0) */
export function buildMonthlyFailureSeries(
  cases: FailureCase[],
  months = 6,
): TrendPoint[] {
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
    key: monthKeyVal,
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
