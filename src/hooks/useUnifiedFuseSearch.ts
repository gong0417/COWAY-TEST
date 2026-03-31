import Fuse from "fuse.js";
import { useMemo } from "react";
import { flattenForSearch, toChosungString } from "@/lib/koreanSearch";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
  UnifiedSearchHit,
} from "@/types/models";

type FuseRow = UnifiedSearchHit & { chosungBlob: string };

function fuseRowToHit(row: FuseRow): UnifiedSearchHit {
  return {
    id: row.id,
    category: row.category,
    label: row.label,
    subtitle: row.subtitle,
    raw: row.raw,
  };
}

function buildRows(
  inspectionItems: InspectionItem[],
  failureCases: FailureCase[],
  reliabilityStandards: ReliabilityStandard[],
): FuseRow[] {
  const rows: FuseRow[] = [];

  for (const it of inspectionItems) {
    const label = it.name;
    const subtitle = [it.checkId ?? it.partNumber, it.category, it.grade]
      .filter(Boolean)
      .join(" · ");
    const blob = flattenForSearch(
      label,
      subtitle,
      it.notes,
      it.internalStandard,
      it.method,
      it.socPrecision,
      it.insulationResistance,
    );
    rows.push({
      id: it.id,
      category: "inspection",
      label,
      subtitle,
      raw: it,
      chosungBlob: toChosungString(blob),
    });
  }

  for (const f of failureCases) {
    const label = f.title;
    const subtitle = [f.partName, f.productLine, f.severity]
      .filter(Boolean)
      .join(" · ");
    const blob = flattenForSearch(
      label,
      subtitle,
      f.summary,
      f.rootCause,
      f.ssmTrouble,
      f.prevention,
      f.testItem,
    );
    rows.push({
      id: f.id,
      category: "failure",
      label,
      subtitle,
      raw: f,
      chosungBlob: toChosungString(blob),
    });
  }

  for (const s of reliabilityStandards) {
    const label = s.title;
    const subtitle = [s.code, s.componentName, s.testName].filter(Boolean).join(" · ");
    const blob = flattenForSearch(
      label,
      subtitle,
      s.body,
      s.testCondition,
      s.acceptanceCriteria,
      s.relatedDoc,
    );
    rows.push({
      id: s.id,
      category: "standard",
      label,
      subtitle,
      raw: s,
      chosungBlob: toChosungString(blob),
    });
  }

  return rows;
}

export function useUnifiedFuseSearch(
  query: string,
  inspectionItems: InspectionItem[],
  failureCases: FailureCase[],
  reliabilityStandards: ReliabilityStandard[],
) {
  const rows = useMemo(
    () => buildRows(inspectionItems, failureCases, reliabilityStandards),
    [inspectionItems, failureCases, reliabilityStandards],
  );

  const fuse = useMemo(
    () =>
      new Fuse(rows, {
        keys: [
          { name: "label", weight: 0.45 },
          { name: "subtitle", weight: 0.25 },
          { name: "chosungBlob", weight: 0.3 },
        ],
        threshold: 0.32,
        ignoreLocation: true,
        minMatchCharLength: 1,
      }),
    [rows],
  );

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return rows.map(fuseRowToHit);
    return fuse.search(q).map((r) => fuseRowToHit(r.item));
  }, [fuse, query, rows]);

  return results;
}
