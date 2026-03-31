import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchQuery } from "@/context/SearchContext";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useFuseSearchEngine } from "@/hooks/useFuseSearchEngine";
import type { SearchCategory } from "@/types/models";

const catLabel: Record<SearchCategory, string> = {
  inspection: "점검",
  failure: "실패사례",
  standard: "시험표준",
};

export function SearchResultsPanel() {
  const { query } = useSearchQuery();
  const { inspectionItems, failureCases, reliabilityStandards, loading, error } =
    useReliabilityDataContext();
  const data = useMemo(
    () => ({ failureCases, reliabilityStandards, inspectionItems }),
    [failureCases, reliabilityStandards, inspectionItems],
  );
  const { results } = useFuseSearchEngine(data, query);
  const navigate = useNavigate();

  const hits = useMemo(() => {
    const q = query.trim();
    if (!q) return [];
    return results.map((r) => {
      const row = "item" in r ? r.item : r;
      return {
        id: row.id,
        category: row.kind as SearchCategory,
        label: row.label,
        subtitle: row.subtitle,
        raw: row.raw,
      };
    });
  }, [results, query]);

  if (!query.trim()) return null;

  if (loading) {
    return (
      <div
        data-print-hide="true"
        className="mb-8 rounded-xl border border-slate-100 bg-surface-container-lowest p-4 shadow-sm"
      >
        <p className="text-sm text-on-surface-variant">데이터를 불러오는 중입니다…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-print-hide="true"
        className="mb-8 rounded-xl border border-error/30 bg-error-container/15 p-4 shadow-sm"
        role="alert"
      >
        <p className="text-sm text-error">검색할 데이터를 불러오지 못했습니다: {error}</p>
      </div>
    );
  }

  return (
    <div
      data-print-hide="true"
      className="mb-8 rounded-xl border border-slate-100 bg-surface-container-lowest p-4 shadow-sm"
    >
      <p className="mb-3 text-xs font-bold uppercase tracking-wider text-outline">
        통합 검색 결과 · {hits.length}건
      </p>
      <ul className="max-h-56 space-y-1 overflow-y-auto">
        {hits.slice(0, 12).map((h) => (
          <li key={`${h.category}-${h.id}`}>
            <button
              type="button"
              onClick={() => {
                if (h.category === "inspection") navigate("/inspection");
                else if (h.category === "failure") navigate("/failures");
                else navigate("/reliability");
              }}
              className="flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-primary-fixed/20"
            >
              <span className="mt-0.5 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-on-primary">
                {catLabel[h.category]}
              </span>
              <span>
                <span className="font-bold text-on-surface">{h.label}</span>
                {h.subtitle ? (
                  <span className="mt-0.5 block text-xs text-on-surface-variant">
                    {h.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
