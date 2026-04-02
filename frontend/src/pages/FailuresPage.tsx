import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useUnifiedFuseSearch } from "@/hooks/useUnifiedFuseSearch";
import { useSearchQuery } from "@/context/SearchContext";
import { FailureCaseDetailBody } from "@/components/FailureCaseDetailBody";
import { failureCaseToPromptText } from "@/lib/failureCasePrompt";
import { downloadFailurePdf, printDetailView } from "@/lib/standardExport";
import { severityPillClass } from "@/lib/severityUi";
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

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    if (selectedId && !filtered.some((c) => c.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const current = useMemo(() => {
    const list = filtered;
    if (!list.length) return null;
    if (selectedId) {
      const found = list.find((c) => c.id === selectedId);
      if (found) return found;
    }
    return list[0];
  }, [filtered, selectedId]);

  return (
    <MainLayout>
      <SearchResultsPanel />
      {error ? (
        <p className="mb-4 text-sm text-error">데이터: {error}</p>
      ) : null}

      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold tracking-tight text-primary">
              과거 실패 사례 분석
            </h1>
            <p className="text-sm text-on-surface-variant">
              검색된 부품의 실패 이력 및 정밀 분석 리포트를 확인합니다.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-surface-container-lowest px-6 py-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-error-container text-error">
                <span className="material-symbols-outlined">report_problem</span>
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
            <div
              data-print-hide="true"
              className="col-span-12 flex flex-col gap-6 lg:col-span-5"
            >
              <div className="flex max-h-[calc(100vh-380px)] flex-col overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 p-4">
                  <span className="text-sm font-bold text-on-surface">
                    사례 목록 <span className="text-surface-tint">{filtered.length}</span>건
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="rounded bg-surface-container-low p-1.5 text-outline transition-colors hover:text-primary"
                      aria-label="필터"
                    >
                      <span className="material-symbols-outlined text-sm">
                        filter_list
                      </span>
                    </button>
                    <button
                      type="button"
                      className="rounded bg-surface-container-low p-1.5 text-outline transition-colors hover:text-primary"
                      aria-label="정렬"
                    >
                      <span className="material-symbols-outlined text-sm">sort</span>
                    </button>
                  </div>
                </div>
                <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      className={[
                        "w-full cursor-pointer border-l-4 p-4 text-left transition-all",
                        current?.id === c.id
                          ? "border-primary bg-primary-fixed/20"
                          : "border-transparent bg-white hover:bg-surface-container-low/80",
                      ].join(" ")}
                    >
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityPillClass(c.severity)}`}
                        >
                          {(c.severity ?? "미분류").toUpperCase()}
                        </span>
                        <span className="rounded bg-primary-fixed px-2 py-0.5 font-mono text-[10px] font-extrabold text-primary">
                          {c.id}
                        </span>
                        {c.productLine ? (
                          <span className="text-[10px] text-outline">{c.productLine}</span>
                        ) : null}
                      </div>
                      <p className="text-sm font-bold text-on-surface">{c.title}</p>
                      <p className="mt-1 line-clamp-2 text-[10px] text-outline">
                        {c.ssmDefining ?? c.partName ?? "—"}
                      </p>
                      {c.occurredAt ? (
                        <p className="mt-1 text-[10px] text-outline">{c.occurredAt}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
                {filtered.length === 0 ? (
                  <p className="p-6 text-center text-sm text-on-surface-variant">
                    표시할 실패 사례가 없습니다.
                  </p>
                ) : null}
              </div>
            </div>

            <article className="col-span-12 min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm lg:col-span-7">
              {current ? (
                <>
                  <header className="border-b border-slate-100 bg-white px-8 py-6">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-[10px] font-bold ${severityPillClass(current.severity)}`}
                      >
                        {(current.severity ?? "미분류").toUpperCase()}
                      </span>
                      <span className="font-mono text-sm text-primary">{current.id}</span>
                    </div>
                    <h2 className="mt-2 text-2xl font-bold tracking-tight text-on-surface">
                      {current.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      {current.ssmDefining ?? current.partName ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          정의 부품: {current.ssmDefining ?? current.partName}
                        </span>
                      ) : null}
                      {current.productLine ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          제품군: {current.productLine}
                        </span>
                      ) : null}
                      {current.occurredAt ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          발생일: {current.occurredAt}
                        </span>
                      ) : null}
                    </div>
                    <div
                      data-print-hide="true"
                      className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-4"
                    >
                      <span className="mr-2 self-center text-xs font-bold uppercase tracking-wide text-outline">
                        문서 작업
                      </span>
                      <button
                        type="button"
                        onClick={() => downloadFailurePdf(current)}
                        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-sm font-bold text-primary hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                        PDF 저장
                      </button>
                      <button
                        type="button"
                        onClick={() => printDetailView()}
                        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-lg">print</span>
                        인쇄
                      </button>
                      <button
                        type="button"
                        onClick={() => setAiOpen(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:opacity-90"
                      >
                        <span className="material-symbols-outlined text-lg text-on-primary">
                          auto_awesome
                        </span>
                        AI 요약 / 상세 팝업
                      </button>
                    </div>
                  </header>
                  <div className="space-y-4 px-8 py-8 text-sm leading-relaxed text-on-surface">
                    <FailureCaseDetailBody c={current} />
                  </div>
                </>
              ) : (
                <p className="p-8 text-on-surface-variant">선택된 사례가 없습니다.</p>
              )}
            </article>
          </div>
        )}
      </div>

      <DetailModal
        open={aiOpen && !!current}
        onClose={() => setAiOpen(false)}
        title={current?.title ?? ""}
        aiSourceText={current ? failureCaseToPromptText(current) : ""}
      >
        {current ? <FailureCaseDetailBody c={current} /> : null}
      </DetailModal>
    </MainLayout>
  );
}
