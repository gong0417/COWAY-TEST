import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { downloadStandardPdf, printStandardView } from "@/lib/standardExport";
import type { ReliabilityStandard } from "@/types/models";

export function ReliabilityPage() {
  const { reliabilityStandards, loading } = useReliabilityDataContext();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [aiOpen, setAiOpen] = useState(false);

  const current = useMemo(() => {
    const list = reliabilityStandards;
    if (!list.length) return null;
    if (selectedId) {
      const found = list.find((s) => s.id === selectedId);
      if (found) return found;
    }
    return list[0];
  }, [reliabilityStandards, selectedId]);

  return (
    <MainLayout>
      <SearchResultsPanel />
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold tracking-tight text-primary">
            부품 신뢰성 시험 표준
          </h1>
          <p className="text-sm text-on-surface-variant">
            부품별 국제 표준(ISO/IEC) 및 내부 신뢰성 검증 프로세스 가이드라인
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface-variant">불러오는 중…</p>
        ) : (
          <div className="grid grid-cols-12 gap-8">
            <div
              data-print-hide="true"
              className="col-span-12 flex flex-col gap-6 lg:col-span-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-5 shadow-sm">
                  <div className="mb-2 text-xs font-bold uppercase text-outline-variant">
                    총 보유 표준
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {reliabilityStandards.length}
                    <span className="ml-1 text-sm font-medium">건</span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-surface-container-lowest p-5 shadow-sm">
                  <div className="mb-2 text-xs font-bold uppercase text-outline-variant">
                    선택 문서
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {current ? 1 : 0}
                    <span className="ml-1 text-sm font-medium">건</span>
                  </div>
                </div>
              </div>
              <div className="flex max-h-[calc(100vh-380px)] flex-col overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-50 p-4">
                  <span className="text-sm font-bold text-on-surface">
                    문서 목록{" "}
                    <span className="text-surface-tint">
                      {reliabilityStandards.length}
                    </span>
                    건
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
                <div className="flex-1 overflow-y-auto">
                  {reliabilityStandards.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={[
                        "w-full cursor-pointer border-l-4 p-4 text-left transition-all",
                        current?.id === doc.id
                          ? "border-primary bg-primary-fixed/20"
                          : "border-transparent hover:bg-surface-container-low/80",
                      ].join(" ")}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span className="rounded bg-primary-fixed px-2 py-0.5 font-mono text-[10px] font-extrabold text-primary">
                          {doc.id}
                        </span>
                        <span className="text-[10px] text-outline">
                          {doc.sampleSize ?? doc.revision ?? ""}
                        </span>
                      </div>
                      {doc.componentName ? (
                        <p className="text-xs text-on-surface-variant">{doc.componentName}</p>
                      ) : null}
                      <p className="text-sm font-bold text-on-surface">{doc.title}</p>
                      {doc.relatedDoc ? (
                        <p className="mt-1 text-[10px] text-outline">{doc.relatedDoc}</p>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <article className="col-span-12 min-w-0 overflow-hidden rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm lg:col-span-7">
              {current ? (
                <>
                  <header className="border-b border-slate-100 bg-white px-8 py-6">
                    <p className="font-mono text-sm text-primary">
                      {current.relatedDoc ?? current.code ?? "CODE N/A"}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-surface">
                      {current.title}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      {current.componentName ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          부품·대상: {current.componentName}
                        </span>
                      ) : current.section ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          절: {current.section}
                        </span>
                      ) : null}
                      {current.sampleSize ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          시료: {current.sampleSize}
                        </span>
                      ) : null}
                      {current.revision ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          개정: {current.revision}
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
                        onClick={() => downloadStandardPdf(current)}
                        className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-2 text-sm font-bold text-primary hover:bg-surface-container-high"
                      >
                        <span className="material-symbols-outlined text-lg">picture_as_pdf</span>
                        PDF 저장
                      </button>
                      <button
                        type="button"
                        onClick={() => printStandardView()}
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
                        AI 요약
                      </button>
                    </div>
                  </header>
                  <div className="space-y-4 px-8 py-8 text-sm leading-relaxed text-on-surface">
                    {current.body ? (
                      current.body.split("\n\n").map((para, i) => (
                        <p key={i} className="text-justify">
                          {para}
                        </p>
                      ))
                    ) : (
                      <p className="text-on-surface-variant">본문이 등록되지 않았습니다.</p>
                    )}
                    {current.safetyNotes?.trim() ? (
                      <aside className="rounded-xl border border-error/25 bg-error-container/15 p-5">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-error">
                          <span className="material-symbols-outlined text-lg">health_and_safety</span>
                          안전·취급 유의사항
                        </h3>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-on-surface">
                          {current.safetyNotes.trim()}
                        </p>
                      </aside>
                    ) : null}
                  </div>
                </>
              ) : (
                <p className="p-8 text-on-surface-variant">선택된 표준이 없습니다.</p>
              )}
            </article>
          </div>
        )}
      </div>

      <DetailModal
        open={aiOpen && !!current}
        onClose={() => setAiOpen(false)}
        title={`AI 요약 · ${current?.code ?? ""}`}
        aiSourceText={current ? standardToPrompt(current) : ""}
      >
        {current ? (
          <p className="text-on-surface-variant">
            아래 버튼으로 &ldquo;{current.title}&rdquo; 본문을 요약합니다.
          </p>
        ) : null}
      </DetailModal>
    </MainLayout>
  );
}

function standardToPrompt(s: ReliabilityStandard): string {
  return [
    s.id && `표준 ID: ${s.id}`,
    s.relatedDoc && `관련 규격/문서: ${s.relatedDoc}`,
    s.code && `코드: ${s.code}`,
    `제목: ${s.title}`,
    s.componentName && `부품·대상: ${s.componentName}`,
    s.testName && `시험명: ${s.testName}`,
    s.testCondition && `시험 조건:\n${s.testCondition}`,
    s.acceptanceCriteria && `합격 기준:\n${s.acceptanceCriteria}`,
    s.sampleSize && `시료 수량: ${s.sampleSize}`,
    s.section && `절: ${s.section}`,
    s.body && `본문:\n${s.body}`,
    s.safetyNotes && `안전 유의:\n${s.safetyNotes}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}
