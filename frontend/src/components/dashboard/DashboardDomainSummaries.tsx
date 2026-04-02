import { Link } from "react-router-dom";
import type { InspectionItem, ReliabilityStandard } from "@/types/models";

export function DashboardDomainSummaries({
  inspectionItems,
  reliabilityStandards,
  onSelectInspection,
  onSelectStandard,
}: {
  inspectionItems: InspectionItem[];
  reliabilityStandards: ReliabilityStandard[];
  onSelectInspection: (item: InspectionItem) => void;
  onSelectStandard: (doc: ReliabilityStandard) => void;
}) {
  const insSample = inspectionItems.slice(0, 5);
  const relSample = reliabilityStandards.slice(0, 5);

  return (
    <div className="flex min-h-0 flex-col gap-6">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-container-lowest shadow-md ring-1 ring-slate-100/60">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-primary-fixed/35 via-primary-fixed/15 to-transparent px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-fixed text-on-primary-fixed shadow-sm">
              <span className="material-symbols-outlined text-[22px]">inventory_2</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold tracking-tight text-on-surface">
                부품 점검 및 내부 표준
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                사내 표준·점검 항목 요약
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold tabular-nums text-secondary">
            {inspectionItems.length}건
          </span>
        </div>
        <ul className="max-h-[min(240px,32vh)] min-h-[120px] flex-1 divide-y divide-slate-100 overflow-y-auto px-1 py-1">
          {insSample.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-on-surface-variant">
              등록된 점검 항목이 없습니다.
            </li>
          ) : (
            insSample.map((item) => (
              <li key={item.id} className="px-1">
                <button
                  type="button"
                  onClick={() => onSelectInspection(item)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-container-low"
                >
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface">
                    {item.name}
                  </p>
                  <p className="mt-0.5 truncate font-mono text-[10px] text-outline">
                    {item.checkId ?? item.id}
                    {item.grade ? ` · Grade ${item.grade}` : ""}
                    {item.category ? ` · ${item.category}` : ""}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-slate-100 bg-surface-container-low/50 px-4 py-3">
          <Link
            to="/inspection"
            className="flex items-center justify-center gap-1.5 text-sm font-bold text-primary transition-colors hover:text-primary-container"
          >
            상세 탭 이동
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-100/80 bg-surface-container-lowest shadow-md ring-1 ring-slate-100/60">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-gradient-to-r from-secondary-fixed/40 via-secondary-container/25 to-transparent px-5 py-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-on-secondary-fixed shadow-sm">
              <span className="material-symbols-outlined text-[22px]">science</span>
            </span>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold tracking-tight text-on-surface">
                부품 신뢰성 시험 표준
              </h3>
              <p className="text-[11px] text-on-surface-variant">
                ISO/IEC·내부 시험 기준 요약
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-secondary-container px-3 py-1 text-xs font-bold tabular-nums text-secondary">
            {reliabilityStandards.length}건
          </span>
        </div>
        <ul className="max-h-[min(240px,32vh)] min-h-[120px] flex-1 divide-y divide-slate-100 overflow-y-auto px-1 py-1">
          {relSample.length === 0 ? (
            <li className="px-4 py-6 text-center text-sm text-on-surface-variant">
              등록된 시험 표준이 없습니다.
            </li>
          ) : (
            relSample.map((doc) => (
              <li key={doc.id} className="px-1">
                <button
                  type="button"
                  onClick={() => onSelectStandard(doc)}
                  className="w-full rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-surface-container-low"
                >
                  <p className="line-clamp-2 text-sm font-semibold leading-snug text-on-surface">
                    {doc.title}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-outline">
                    {doc.relatedDoc ?? doc.code ?? doc.id}
                    {doc.componentName ? ` · ${doc.componentName}` : ""}
                  </p>
                </button>
              </li>
            ))
          )}
        </ul>
        <div className="border-t border-slate-100 bg-surface-container-low/50 px-4 py-3">
          <Link
            to="/reliability"
            className="flex items-center justify-center gap-1.5 text-sm font-bold text-secondary transition-colors hover:opacity-90"
          >
            상세 탭 이동
            <span className="material-symbols-outlined text-base">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
