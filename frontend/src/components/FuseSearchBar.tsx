import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchQuery } from "@/context/SearchContext";
import { useReliabilityDataContext } from "@/context/ReliabilityDataContext";
import { useFuseSearchEngine } from "@/hooks/useFuseSearchEngine";
import type { FuseSearchKind } from "@/hooks/useFuseSearchEngine";

const kindLabel: Record<FuseSearchKind, string> = {
  inspection: "점검",
  failure: "실패사례",
  standard: "시험표준",
};

/** stitch `code.html` TopNavBar 검색창 톤: surface-container-low, primary-container 포커스 링 */
export function FuseSearchBar() {
  const { query, setQuery } = useSearchQuery();
  const { failureCases, reliabilityStandards, inspectionItems } =
    useReliabilityDataContext();
  const data = useMemo(
    () => ({ failureCases, reliabilityStandards, inspectionItems }),
    [failureCases, reliabilityStandards, inspectionItems],
  );
  const { results } = useFuseSearchEngine(data, query);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const displayResults = useMemo(() => {
    if (!query.trim()) return [];
    return results.map((r) => ("item" in r ? r.item : r));
  }, [results, query]);

  function go(kind: FuseSearchKind) {
    setOpen(false);
    if (kind === "inspection") navigate("/inspection");
    else if (kind === "failure") navigate("/failures");
    else navigate("/reliability");
  }

  return (
    <div className="relative w-full max-w-md">
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
        search
      </span>
      <input
        type="search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 180);
        }}
        placeholder="부품 정보 또는 표준 문서 검색…"
        className="w-full rounded-lg border-none bg-surface-container-low py-2 pl-10 pr-4 text-sm text-on-surface transition-all placeholder:text-outline focus:ring-2 focus:ring-primary-container"
        aria-label="통합 검색"
        aria-expanded={open}
        aria-controls="fuse-search-suggestions"
      />
      {open && query.trim() && displayResults.length > 0 ? (
        <div
          id="fuse-search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full z-50 mt-1 max-h-72 overflow-y-auto rounded-lg border border-slate-100 bg-surface-container-lowest py-1 shadow-lg"
        >
          {displayResults.slice(0, 10).map((row) => (
            <button
              key={`${row.kind}-${row.id}`}
              type="button"
              role="option"
              className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-primary-fixed/20"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setQuery(row.label);
                go(row.kind);
              }}
            >
              <span className="mt-0.5 shrink-0 rounded bg-primary px-2 py-0.5 text-[10px] font-bold uppercase text-on-primary">
                {kindLabel[row.kind]}
              </span>
              <span className="min-w-0">
                <span className="font-bold text-on-surface">{row.label}</span>
                {row.subtitle ? (
                  <span className="mt-0.5 block truncate text-xs text-on-surface-variant">
                    {row.subtitle}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
