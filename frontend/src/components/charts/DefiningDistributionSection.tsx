import { useMemo, useState } from "react";
import type { FailureCase } from "@/types/models";
import { aggregateDefiningCounts } from "@/lib/definingStats";

const BAR_COLORS = [
  "from-sky-500 to-blue-600",
  "from-violet-500 to-purple-600",
  "from-teal-500 to-cyan-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
  "from-emerald-500 to-green-600",
  "from-indigo-500 to-blue-700",
  "from-fuchsia-500 to-purple-700",
];

export function DefiningDistributionSection({
  failureCases,
}: {
  failureCases: FailureCase[];
}) {
  const [expanded, setExpanded] = useState(true);
  const buckets = useMemo(
    () => aggregateDefiningCounts(failureCases, { maxBuckets: 14 }),
    [failureCases],
  );
  const max = Math.max(...buckets.map((b) => b.count), 1);
  const totalTagged = buckets.reduce((s, b) => s + b.count, 0);
  const distinct = buckets.length;
  const chartCoveragePct =
    failureCases.length > 0
      ? Math.min(100, Math.round((totalTagged / failureCases.length) * 100))
      : 0;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 bg-gradient-to-r from-primary-fixed/25 via-surface-container-low to-secondary-fixed/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-on-surface">
            과거 실패 사례 대상 아이템 분포
          </h3>
          <p className="mt-1 text-sm text-on-surface-variant">
            ssm.defining 기준 동일 대상 아이템 문자열 묶음 · 상위 {buckets.length}개 그룹
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-slate-100/80 bg-white/90 px-3 py-2 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
              고유 아이템 수
            </p>
            <p className="text-xl font-bold tabular-nums text-primary">{distinct}</p>
          </div>
          <div className="rounded-lg border border-slate-100/80 bg-white/90 px-3 py-2 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
              차트 합계
            </p>
            <p className="text-xl font-bold tabular-nums text-on-surface">{totalTagged}</p>
          </div>
          <div className="rounded-lg border border-slate-100/80 bg-white/90 px-3 py-2 text-center shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">
              도표 포함 비율
            </p>
            <p className="text-xl font-bold tabular-nums text-secondary">{chartCoveragePct}%</p>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition-colors hover:bg-surface-container-low"
        aria-expanded={expanded}
      >
        <p className="text-sm text-on-surface-variant">
          대상 아이템(ssm.defining) 문자열이 같은 사례를 묶어 빈도를 표시합니다. 그룹이 많으면
          상위 항목만 보여 도표 포함 비율이 100% 미만일 수 있습니다.
        </p>
        <span className="material-symbols-outlined shrink-0 text-on-surface-variant">
          {expanded ? "expand_less" : "expand_more"}
        </span>
      </button>

      {expanded ? (
        <div className="space-y-4 p-5 pt-2">
          {buckets.length === 0 ? (
            <p className="py-6 text-center text-sm text-on-surface-variant">
              표시할 실패 사례가 없습니다.
            </p>
          ) : (
            <div className="space-y-3">
              {buckets.map((b, i) => {
                const w = (b.count / max) * 100;
                const grad = BAR_COLORS[i % BAR_COLORS.length];
                return (
                  <div key={b.label} className="group">
                    <div className="mb-1 flex items-end justify-between gap-2 text-sm">
                      <span
                        className="min-w-0 flex-1 truncate font-medium text-on-surface"
                        title={b.label}
                      >
                        {b.label}
                      </span>
                      <span className="shrink-0 tabular-nums text-on-surface-variant">
                        <span className="font-bold text-primary">{b.count}</span>
                        <span className="text-outline"> 건</span>
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-surface-container-high">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${grad} shadow-sm transition-all duration-500 ease-out group-hover:opacity-90`}
                        style={{ width: `${w}%`, minWidth: b.count > 0 ? "4px" : 0 }}
                        role="presentation"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="rounded-lg border border-dashed border-outline-variant/30 bg-surface-container-low/60 px-4 py-3 text-xs text-on-surface-variant">
            전체 사례 {failureCases.length}건 중 차트에 포함된 항목 합계는 {totalTagged}건입니다.
            (상위 {buckets.length}개 그룹만 표시)
          </div>
        </div>
      ) : null}
    </section>
  );
}
