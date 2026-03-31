import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useUnifiedFuseSearch } from "@/hooks/useUnifiedFuseSearch";
import { useSearchQuery } from "@/context/SearchContext";
import { FailureCaseDetailBody } from "@/components/FailureCaseDetailBody";
import { failureCaseToPromptText } from "@/lib/failureCasePrompt";
import { severityPillClass } from "@/lib/severityUi";
import type { FailureCase } from "@/types/models";

export function FailuresPage() {
  const { query } = useSearchQuery();
  const { failureCases, inspectionItems, reliabilityStandards, loading, error } =
    useReliabilityDataContext();
  const searchHits = useUnifiedFuseSearch(
    query,
    inspectionItems,
    failureCases,
    reliabilityStandards,
  );
  const filtered = useMemo(() => {
    if (!query.trim()) return failureCases;
    const ids = new Set(
      searchHits.filter((h) => h.category === "failure").map((h) => h.id),
    );
    return failureCases.filter((c) => ids.has(c.id));
  }, [failureCases, query, searchHits]);

  const [selected, setSelected] = useState<FailureCase | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const display = selected ?? filtered[0] ?? null;

  return (
    <MainLayout>
      <SearchResultsPanel />
      {error ? (
        <p className="mb-4 text-sm text-error">데이터: {error}</p>
      ) : null}

      <div className="mb-10 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-3xl font-bold tracking-tight text-primary">
            과거 실패 사례 분석
          </h1>
          <p className="text-on-surface-variant">
            검색된 부품의 실패 이력 및 정밀 분석 리포트를 확인합니다.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-surface-container-lowest px-6 py-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-error">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-outline">
                등록 사례
              </div>
              <div className="text-xl font-bold text-on-surface">
                {loading ? "…" : failureCases.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-surface-container-lowest px-6 py-4 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container text-secondary">
              <span className="material-symbols-outlined">analytics</span>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-outline">
                표시 중
              </div>
              <div className="text-xl font-bold text-on-surface">
                {loading ? "…" : filtered.length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-on-surface-variant">불러오는 중…</p>
      ) : (
        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 space-y-6 lg:col-span-8">
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl bg-surface-container-low p-2 no-scrollbar">
              <span className="whitespace-nowrap rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary">
                전체 사례
              </span>
              <span className="whitespace-nowrap px-4 py-2 text-sm text-on-surface-variant">
                통합 검색으로 필터
              </span>
            </div>
            <div className="space-y-4">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelected(c)}
                  className={[
                    "w-full cursor-pointer rounded-xl border-none bg-surface-container-lowest p-6 text-left shadow-sm transition-all hover:shadow-md",
                    display?.id === c.id ? "ring-2 ring-primary" : "",
                  ].join(" ")}
                >
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityPillClass(c.severity)}`}
                      >
                        {(c.severity ?? "미분류").toUpperCase()}
                      </span>
                      <span className="font-mono text-xs font-bold text-primary">
                        {c.id}
                      </span>
                      {c.productLine ? (
                        <span className="rounded-full bg-surface-container-high px-2 py-0.5 text-[10px] font-bold text-on-surface-variant">
                          {c.productLine}
                        </span>
                      ) : null}
                    </div>
                    {c.occurredAt ? (
                      <span className="shrink-0 text-xs text-outline">{c.occurredAt}</span>
                    ) : null}
                  </div>
                  <h3 className="mb-2 text-lg font-bold leading-snug text-on-surface">
                    {c.title}
                  </h3>
                  <p className="mb-2 line-clamp-2 text-sm text-on-surface-variant">
                    {c.ssmDefining ?? c.partName ?? "—"}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-on-surface-variant">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">
                        precision_manufacturing
                      </span>
                      {c.partName ?? "정의 부품 미기재"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-sm text-on-surface-variant">
                표시할 실패 사례가 없습니다.
              </p>
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-28 space-y-6">
              <div className="overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-xl">
                <div className="bg-primary p-6 text-on-primary">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">
                      Detailed Analysis
                    </span>
                    <button
                      type="button"
                      className="text-on-primary/60 hover:text-on-primary"
                      onClick={() => display && setAiOpen(true)}
                      disabled={!display}
                      aria-label="AI 요약 열기"
                    >
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </button>
                  </div>
                  <h2 className="text-xl font-bold leading-tight">
                    {display?.title ?? "사례를 선택하세요"}
                  </h2>
                </div>
                <div className="max-h-[calc(100vh-280px)] space-y-6 overflow-y-auto p-6">
                  {display ? (
                    <>
                      <FailureCaseDetailBody c={display} />
                      <button
                        type="button"
                        onClick={() => setAiOpen(true)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-container py-3 font-bold text-on-primary-container transition-all hover:opacity-90"
                      >
                        <span className="material-symbols-outlined">auto_awesome</span>
                        AI 요약 / 상세
                      </button>
                    </>
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      좌측 목록에서 사례를 선택하세요.
                    </p>
                  )}
                </div>
              </div>
              <div className="rounded-xl border-l-4 border-secondary bg-secondary-container/30 p-5">
                <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-secondary">
                  <span className="material-symbols-outlined text-lg">lightbulb</span>
                  연관 표준
                </h4>
                <p className="text-xs leading-relaxed text-on-secondary-container">
                  시험 표준 메뉴에서 ISO/IEC 및 내부 규격을 함께 확인하세요.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <DetailModal
        open={aiOpen && !!display}
        onClose={() => setAiOpen(false)}
        title={display?.title ?? ""}
        aiSourceText={display ? failureCaseToPromptText(display) : ""}
      >
        {display ? <FailureCaseDetailBody c={display} /> : null}
      </DetailModal>
    </MainLayout>
  );
}
