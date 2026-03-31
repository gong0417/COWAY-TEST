import { useMemo, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { DetailModal } from "@/components/DetailModal";
import { SearchResultsPanel } from "@/components/SearchResultsPanel";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useUnifiedFuseSearch } from "@/hooks/useUnifiedFuseSearch";
import { useSearchQuery } from "@/context/SearchContext";
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

  const [selected, setSelected] = useState<InspectionItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  return (
    <MainLayout>
      <SearchResultsPanel />
      {error ? (
        <p className="mb-4 text-sm text-error">데이터: {error}</p>
      ) : null}
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              부품 점검 및 사내 표준
            </h1>
            <p className="mt-1 text-on-surface-variant">
              부품별 정밀 점검 항목과 최신 사내 품질 표준을 확인하십시오.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-surface-container-lowest px-4 py-2 text-sm font-bold text-secondary shadow-sm transition-all hover:shadow-md"
            >
              <span className="material-symbols-outlined text-sm">filter_list</span>
              필터링
            </button>
            <button
              type="button"
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-on-primary shadow-lg transition-all hover:opacity-90"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              신규 표준 등록
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-on-surface-variant">불러오는 중…</p>
        ) : (
          <div className="grid grid-cols-12 items-start gap-8">
            <div className="col-span-12 flex flex-col gap-6 lg:col-span-8">
              <div className="grid grid-cols-2 gap-6">
                {filteredItems.map((item, idx) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelected(item);
                      setDetailOpen(false);
                    }}
                    className={[
                      "rounded-xl bg-surface-container-lowest p-6 text-left shadow-sm transition-all hover:border-primary/40 hover:shadow-md",
                      selected?.id === item.id
                        ? "border-2 border-primary ring-4 ring-primary/5"
                        : "border border-slate-100",
                      idx === 0 ? "md:col-span-2" : "",
                    ].join(" ")}
                  >
                    <div className="mb-4 flex items-start justify-between">
                      <span className="rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider bg-primary-fixed text-on-primary-fixed-variant">
                        {item.category ?? "부품"}
                      </span>
                      <StatusIcon status={item.status} active={selected?.id === item.id} />
                    </div>
                    <h3 className="text-lg font-bold text-on-surface">{item.name}</h3>
                  <p className="mt-1 font-mono text-xs text-outline">
                    {item.checkId ?? item.id}
                  </p>
                  {item.internalStandard ? (
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-on-surface-variant">
                      사내 표준: {item.internalStandard}
                    </p>
                  ) : (
                    <p className="mt-1 text-sm text-on-surface-variant">
                      {item.partNumber ?? "P/N 미등록"}
                    </p>
                  )}
                  {item.grade ? (
                    <p className="mt-2 text-xs font-bold text-primary">
                      Grade: {item.grade}
                    </p>
                  ) : null}
                  <StatusRow status={item.status} />
                  </button>
                ))}
              </div>
              {filteredItems.length === 0 ? (
                <p className="py-8 text-center text-sm text-on-surface-variant">
                  표시할 부품이 없습니다.
                </p>
              ) : null}
            </div>

            <aside className="col-span-12 rounded-xl border border-slate-100 bg-surface-container-lowest shadow-sm lg:sticky lg:top-28 lg:col-span-4 lg:self-start">
              <div className="border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-bold text-on-surface">상세 정보</h2>
                <p className="text-xs text-on-surface-variant">
                  카드를 선택하면 표시됩니다.
                </p>
              </div>
              <div className="space-y-4 p-5 text-sm">
                {selected ? (
                  <>
                    <Field label="점검 ID" value={selected.checkId ?? selected.id} />
                    <Field label="부품명" value={selected.name} />
                    <Field label="분류" value={selected.category} />
                    <Field label="신뢰 등급 (Grade)" value={selected.grade} />
                    {selected.internalStandard ? (
                      <Field label="사내 표준 (internalStandard)" value={selected.internalStandard} />
                    ) : null}
                    {selected.method ? <Field label="시험·검사 방법" value={selected.method} /> : null}
                    {selected.revisionDate ? (
                      <Field label="개정일" value={selected.revisionDate} />
                    ) : null}
                    <div className="rounded-lg border border-primary/20 bg-primary-fixed/10 p-3">
                      <p className="text-xs font-bold uppercase tracking-wide text-primary">
                        주요 점검 항목 (Major checks)
                      </p>
                      <ul className="mt-2 space-y-2 text-sm text-on-surface">
                        <li>
                          <span className="text-on-surface-variant">SOC 정밀도: </span>
                          {selected.socPrecision?.trim() ? selected.socPrecision : "—"}
                        </li>
                        <li>
                          <span className="text-on-surface-variant">절연 저항: </span>
                          {selected.insulationResistance?.trim()
                            ? selected.insulationResistance
                            : "—"}
                        </li>
                      </ul>
                    </div>
                    <Field label="비고" value={selected.notes} />
                    <button
                      type="button"
                      onClick={() => setDetailOpen(true)}
                      className="mt-2 inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary px-3 py-2 text-xs font-bold text-on-primary hover:opacity-90"
                    >
                      <span className="material-symbols-outlined text-base">
                        open_in_new
                      </span>
                      상세 팝업 / AI 요약
                    </button>
                  </>
                ) : (
                  <p className="text-on-surface-variant">좌측에서 부품을 선택하세요.</p>
                )}
              </div>
            </aside>
          </div>
        )}
      </div>

      <DetailModal
        open={detailOpen && !!selected}
        onClose={() => setDetailOpen(false)}
        title={selected?.name ?? ""}
        aiSourceText={selected ? inspectionToPrompt(selected) : ""}
      >
        {selected ? (
          <div className="space-y-2 text-on-surface">
            <Field label="점검 ID" value={selected.checkId ?? selected.id} />
            <Field label="품번" value={selected.partNumber} />
            <Field label="사내 표준" value={selected.internalStandard} />
            <Field label="시험·검사 방법" value={selected.method} />
            <Field label="개정일" value={selected.revisionDate} />
            <Field label="SOC 정밀도" value={selected.socPrecision} />
            <Field label="절연 저항" value={selected.insulationResistance} />
            <Field label="비고" value={selected.notes} />
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

function StatusIcon({
  status,
  active,
}: {
  status?: string;
  active: boolean;
}) {
  const ok = status !== "fail" && status !== "warn";
  return (
    <span
      className={`material-symbols-outlined ${active ? "text-primary" : "text-on-surface-variant"}`}
      style={ok ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {ok ? "check_circle" : "error"}
    </span>
  );
}

function StatusRow({ status }: { status?: string }) {
  const color =
    status === "fail"
      ? "bg-error"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-emerald-500";
  return (
    <span className="mt-3 flex items-center gap-2 text-xs text-on-surface-variant">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {status ?? "미정"}
    </span>
  );
}
