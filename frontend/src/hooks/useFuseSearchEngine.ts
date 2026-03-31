import Fuse from "fuse.js";
import { useMemo } from "react";
import { flattenForSearch, toChosungString } from "@/lib/koreanSearch";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

export type FuseSearchKind = "inspection" | "failure" | "standard";

export type FuseSearchRow = {
  kind: FuseSearchKind;
  id: string;
  label: string;
  subtitle: string;
  raw: InspectionItem | FailureCase | ReliabilityStandard;
  chosungBlob: string;
};

export type MergedFirestoreShape = {
  failureCases?: FailureCase[];
  reliabilityStandards?: ReliabilityStandard[];
  inspectionItems?: InspectionItem[];
} | null;

function buildRows(data: MergedFirestoreShape): FuseSearchRow[] {
  if (!data) return [];
  const rows: FuseSearchRow[] = [];

  for (const it of data.inspectionItems ?? []) {
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
      kind: "inspection",
      id: it.id,
      label,
      subtitle,
      raw: it,
      chosungBlob: toChosungString(blob),
    });
  }

  for (const f of data.failureCases ?? []) {
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
      kind: "failure",
      id: f.id,
      label,
      subtitle,
      raw: f,
      chosungBlob: toChosungString(blob),
    });
  }

  for (const s of data.reliabilityStandards ?? []) {
    const label = s.title;
    const subtitle = [s.code, s.componentName, s.testName]
      .filter(Boolean)
      .join(" · ");
    const blob = flattenForSearch(
      label,
      subtitle,
      s.body,
      s.testCondition,
      s.acceptanceCriteria,
      s.relatedDoc,
    );
    rows.push({
      kind: "standard",
      id: s.id,
      label,
      subtitle,
      raw: s,
      chosungBlob: toChosungString(blob),
    });
  }

  return rows;
}

/**
 * 세 컬렉션 데이터를 합쳐 Fuse 인덱스를 만들고, query에 대해 실시간 검색
 */
export function useFuseSearchEngine(
  data: MergedFirestoreShape,
  query: string,
) {
  const { fuse, rows } = useMemo(() => {
    if (!data) {
      return { fuse: null as Fuse<FuseSearchRow> | null, rows: [] as FuseSearchRow[] };
    }
    const r = buildRows(data);
    const fuseInstance = new Fuse(r, {
      keys: [
        { name: "label", weight: 0.45 },
        { name: "subtitle", weight: 0.25 },
        { name: "chosungBlob", weight: 0.3 },
      ],
      threshold: 0.32,
      ignoreLocation: true,
      minMatchCharLength: 1,
    });
    return { fuse: fuseInstance, rows: r };
  }, [data]);

  const results = useMemo(() => {
    const q = (query ?? "").trim();
    if (!fuse || rows.length === 0) return [];
    if (!q) return rows.slice(0, 16).map((item) => ({ item }));
    return fuse.search(q).slice(0, 24);
  }, [fuse, rows, query]);

  return { results, indexReady: rows.length > 0, totalIndexed: rows.length };
}
