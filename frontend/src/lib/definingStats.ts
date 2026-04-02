import type { FailureCase } from "@/types/models";

export type DefiningBucket = { label: string; count: number };

/** 동일한 ssm.defining(또는 partName) 문자열 기준 건수 집계, 건수 내림차순 */
export function aggregateDefiningCounts(
  cases: FailureCase[],
  opts?: { maxBuckets?: number },
): DefiningBucket[] {
  const maxBuckets = opts?.maxBuckets ?? 14;
  const map = new Map<string, number>();
  for (const c of cases) {
    const raw = (c.ssmDefining ?? c.partName ?? "").trim();
    const key = raw || "(정의 부품 미기재)";
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return sorted.slice(0, maxBuckets).map(([label, count]) => ({ label, count }));
}
