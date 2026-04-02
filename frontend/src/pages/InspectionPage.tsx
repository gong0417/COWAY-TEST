import { useEffect, useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useUnifiedFuseSearch } from "@/hooks/useUnifiedFuseSearch";
import { useSearchQuery } from "@/context/SearchContext";
import {
  downloadInspectionPdf,
  printDetailView,
} from "@/lib/standardExport";
import type { InspectionItem } from "@/types/models";

export function InspectionPage() {
  const { query } = useSearchQuery();
  const { inspectionItems, failureCases, reliabilityStandards, loading, error } =
    useReliabilityDataContext();
  const searchHits = useUnifiedFuseSearch(
    query,
    inspectionItems,
    failureCases,
    reliabilityStandards,
  );
  const filteredItems = useMemo(() => {
    if (!query.trim()) return inspectionItems;
    const ids = new Set(
      searchHits.filter((h) => h.category === "inspection").map((h) => h.id),
    );
    return inspectionItems.filter((i) => ids.has(i.id));
  }, [inspectionItems, query, searchHits]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    if (selectedId && !filteredItems.some((i) => i.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filteredItems, selectedId]);

  const current = useMemo(() => {
    const list = filteredItems;
    if (!list.length) return null;
    if (selectedId) {
      const found = list.find((i) => i.id === selectedId);
      if (found) return found;
    }
    return list[0];
  }, [filteredItems, selectedId]);

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
              부품 점검 및 사내 표준
            </h1>
            <p className="text-sm text-on-surface-variant">
              부품별 정밀 점검 항목과 최신 사내 품질 표준을 확인하십시오.
            </p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-surface-container-lowest px-6 py-4 shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-fixed text-on-primary-fixed">
                <span className="material-symbols-outlined">inventory_2</span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  등록 항목
                </div>
                <div className="text-xl font-bold text-on-surface">
                  {loading ? "…" : inspectionItems.length}
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
                  {loading ? "…" : filteredItems.length}
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
                    점검 목록{" "}
                    <span className="text-surface-tint">{filteredItems.length}</span>
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
                <div className="flex-1 divide-y divide-slate-100 overflow-y-auto">
                  {filteredItems.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => setSelectedId(doc.id)}
                      className={[
                        "w-full cursor-pointer border-l-4 p-4 text-left transition-all",
                        current?.id === doc.id
                          ? "border-primary bg-primary-fixed/20"
                          : "border-transparent bg-white hover:bg-surface-container-low/80",
                      ].join(" ")}
                    >
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <span className="rounded bg-primary-fixed px-2 py-0.5 font-mono text-[10px] font-extrabold text-primary">
                          {doc.checkId ?? doc.id}
                        </span>
                        {doc.category ? (
                          <span className="text-[10px] text-outline">{doc.category}</span>
                        ) : null}
                      </div>
                      {doc.grade ? (
                        <p className="text-xs font-bold text-secondary">Grade: {doc.grade}</p>
                      ) : null}
                      <p className="text-sm font-bold text-on-surface">{doc.name}</p>
                      {doc.internalStandard ? (
                        <p className="mt-1 line-clamp-2 text-[10px] text-outline">
                          {doc.internalStandard}
                        </p>
                      ) : doc.partNumber ? (
                        <p className="mt-1 font-mono text-[10px] text-outline">
                          {doc.partNumber}
                        </p>
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
                      {current.checkId ?? current.id}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold tracking-tight text-on-surface">
                      {current.name}
                    </h2>
                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-on-surface-variant">
                      {current.category ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          분류: {current.category}
                        </span>
                      ) : null}
                      {current.grade ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          Grade: {current.grade}
                        </span>
                      ) : null}
                      {current.partNumber ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          품번: {current.partNumber}
                        </span>
                      ) : null}
                      {current.revisionDate ? (
                        <span className="rounded bg-surface-container-low px-2 py-1">
                          개정: {current.revisionDate}
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
                        onClick={() => downloadInspectionPdf(current)}
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
                        onClick={() => setDetailOpen(true)}
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
                    {current.internalStandard?.trim() ? (
                      <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                          사내 표준
                        </h3>
                        <p className="whitespace-pre-wrap text-justify">{current.internalStandard}</p>
                      </section>
                    ) : null}
                    {current.method?.trim() ? (
                      <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-primary">
                          시험·검사 방법
                        </h3>
                        <p className="whitespace-pre-wrap text-justify">{current.method}</p>
                      </section>
                    ) : null}
                    <aside className="rounded-xl border border-primary/20 bg-primary-fixed/10 p-5">
                      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-primary">
                        <span className="material-symbols-outlined text-lg">fact_check</span>
                        주요 점검 항목
                      </h3>
                      <ul className="space-y-2 text-sm">
                        <li>
                          <span className="text-on-surface-variant">SOC 정밀도: </span>
                          {current.socPrecision?.trim() ? current.socPrecision : "—"}
                        </li>
                        <li>
                          <span className="text-on-surface-variant">절연 저항: </span>
                          {current.insulationResistance?.trim()
                            ? current.insulationResistance
                            : "—"}
                        </li>
                      </ul>
                    </aside>
                    {current.notes?.trim() ? (
                      <section>
                        <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-outline">
                          비고
                        </h3>
                        <p className="whitespace-pre-wrap text-on-surface-variant">{current.notes}</p>
                      </section>
                    ) : null}
                    <StatusLine status={current.status} />
                  </div>
                </>
              ) : (
                <p className="p-8 text-on-surface-variant">선택된 점검 항목이 없습니다.</p>
              )}
            </article>
          </div>
        )}
      </div>

      <DetailModal
        open={detailOpen && !!current}
        onClose={() => setDetailOpen(false)}
        title={current?.name ?? ""}
        aiSourceText={current ? inspectionToPrompt(current) : ""}
      >
        {current ? (
          <div className="space-y-2 text-on-surface">
            <Field label="점검 ID" value={current.checkId ?? current.id} />
            <Field label="품번" value={current.partNumber} />
            <Field label="사내 표준" value={current.internalStandard} />
            <Field label="시험·검사 방법" value={current.method} />
            <Field label="개정일" value={current.revisionDate} />
            <Field label="SOC 정밀도" value={current.socPrecision} />
            <Field label="절연 저항" value={current.insulationResistance} />
            <Field label="비고" value={current.notes} />
          </div>
        ) : null}
      </DetailModal>
    </MainLayout>
  );
}

function inspectionToPrompt(i: InspectionItem): string {
  return [
    i.checkId && `점검 ID: ${i.checkId}`,
    `부품: ${i.name}`,
    i.partNumber && `품번: ${i.partNumber}`,
    i.grade && `등급: ${i.grade}`,
    i.internalStandard && `사내 표준: ${i.internalStandard}`,
    i.method && `방법: ${i.method}`,
    i.revisionDate && `개정일: ${i.revisionDate}`,
    i.socPrecision && `SOC 정밀도: ${i.socPrecision}`,
    i.insulationResistance && `절연 저항: ${i.insulationResistance}`,
    i.notes && `비고: ${i.notes}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wide text-on-surface-variant">
        {label}
      </p>
      <p className="mt-0.5 text-on-surface">
        {value?.trim() ? value : "—"}
      </p>
    </div>
  );
}

function StatusLine({ status }: { status?: string }) {
  const color =
    status === "fail"
      ? "bg-error"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <p className="flex items-center gap-2 text-xs text-on-surface-variant">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      상태: {status ?? "미정"}
    </p>
  );
}
