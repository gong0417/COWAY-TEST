import Papa from "papaparse";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

export interface LoadedCsv {
  inspectionItems: InspectionItem[];
  failureCases: FailureCase[];
  reliabilityStandards: ReliabilityStandard[];
}

function parseTable(text: string): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  if (parsed.errors.length > 0) {
    console.warn("[CSV]", parsed.errors.slice(0, 3));
  }
  return (parsed.data ?? []).filter((row) =>
    Object.values(row).some((v) => v != null && String(v).trim() !== ""),
  );
}

function cell(row: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (k in row && row[k] != null) {
      const s = String(row[k]).trim();
      if (s) return s;
    }
  }
  return "";
}

/** 헤더 인코딩 차이 대비: 문서 제목 열 탐색 */
function findSsmDocumentTitle(row: Record<string, string>): string {
  for (const [k, v] of Object.entries(row)) {
    if (/document/i.test(k) && /목|제/.test(k)) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }
  return cell(row, "ssm.document제 목1");
}

/** DB/ssm.csv — 과거 실패 사례 (SSM) */
export function mapSsmRows(rows: Record<string, string>[]): FailureCase[] {
  const out: FailureCase[] = [];
  for (const row of rows) {
    const id = cell(row, "SSM ID", "ssm id");
    if (!id) continue;
    const trouble = cell(row, "ssm.trouble", "ssm trouble");
    const defining = cell(row, "ssm.defining", "ssm defining");
    const stress = cell(row, "ssm.stress", "ssm stress");
    const strength = cell(row, "ssm.strength", "ssm strength");
    const controlling = cell(row, "ssm.controling", "ssm.controling", "ssm controlling");
    const prevention = cell(row, "재발 방지 대책");
    const testItem = cell(row, "시험 항목");
    const testCriteria = cell(row, "시험 기준");
    const productLine = cell(row, "제품군");
    const docTitle = findSsmDocumentTitle(row);
    const fileUrl = cell(row, "파일명1");

    const rootParts = [stress, strength, controlling].filter(Boolean);
    const rootCause = rootParts.length ? rootParts.join(" → ") : undefined;

    out.push({
      id,
      title: trouble || defining || id,
      partName: defining || undefined,
      severity: "SSM",
      summary: trouble || undefined,
      rootCause,
      ssmDefining: defining || undefined,
      ssmTrouble: trouble || undefined,
      ssmStress: stress || undefined,
      ssmStrength: strength || undefined,
      ssmControlling: controlling || undefined,
      prevention: prevention || undefined,
      testItem: testItem || undefined,
      testCriteria: testCriteria || undefined,
      productLine: productLine || undefined,
      documentTitle: docTitle || undefined,
      documentUrl: fileUrl || undefined,
    });
  }
  return out;
}

/** DB/inspection_items.csv — 점검 항목·사내 표준 */
export function mapInspectionRows(rows: Record<string, string>[]): InspectionItem[] {
  const out: InspectionItem[] = [];
  for (const row of rows) {
    const checkId = cell(row, "checkId", "check_id");
    if (!checkId) continue;
    const inspectionItem = cell(row, "inspectionItem", "inspection_item");
    const category = cell(row, "category");
    const internalStandard = cell(row, "internalStandard", "internal_standard");
    const method = cell(row, "method");
    const revisionDate = cell(row, "revisionDate", "revision_date");
    out.push({
      id: checkId,
      checkId,
      name: inspectionItem || checkId,
      partNumber: checkId,
      category: category || undefined,
      internalStandard: internalStandard || undefined,
      method: method || undefined,
      revisionDate: revisionDate || undefined,
      notes: [internalStandard && `사내 표준: ${internalStandard}`, method && `방법: ${method}`]
        .filter(Boolean)
        .join("\n"),
      status: "ok",
    });
  }
  return out;
}

/** DB/reliability_standards.csv — 신뢰성 시험 표준 */
export function mapStandardRows(rows: Record<string, string>[]): ReliabilityStandard[] {
  const out: ReliabilityStandard[] = [];
  for (const row of rows) {
    const standardId = cell(row, "standardId", "standard_id");
    if (!standardId) continue;
    const componentName = cell(row, "componentName", "component_name");
    const testName = cell(row, "testName", "test_name");
    const testCondition = cell(row, "testCondition", "test_condition");
    const acceptanceCriteria = cell(row, "acceptanceCriteria", "acceptance_criteria");
    const sampleSize = cell(row, "sampleSize", "sample_size");
    const relatedDoc = cell(row, "relatedDoc", "related_doc");

    const bodyParts = [
      testCondition && `시험 조건\n${testCondition}`,
      acceptanceCriteria && `합격 기준\n${acceptanceCriteria}`,
      sampleSize && `시료 수량\n${sampleSize}`,
    ].filter(Boolean);

    out.push({
      id: standardId,
      code: relatedDoc || standardId,
      title: testName
        ? `${testName}${componentName ? ` (${componentName})` : ""}`
        : componentName || standardId,
      section: componentName || undefined,
      body: bodyParts.join("\n\n") || undefined,
      componentName: componentName || undefined,
      testName: testName || undefined,
      testCondition: testCondition || undefined,
      acceptanceCriteria: acceptanceCriteria || undefined,
      sampleSize: sampleSize || undefined,
      relatedDoc: relatedDoc || undefined,
    });
  }
  return out;
}

export async function loadAllCsv(): Promise<LoadedCsv> {
  const base = import.meta.env.BASE_URL ?? "/";
  const prefix = base.endsWith("/") ? base : `${base}/`;

  const fetchText = async (name: string) => {
    const url = `${prefix}DB/${name}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`CSV 로드 실패: ${url} (${res.status})`);
    return res.text();
  };

  const [ssmText, insText, relText] = await Promise.all([
    fetchText("ssm.csv"),
    fetchText("inspection_items.csv"),
    fetchText("reliability_standards.csv"),
  ]);

  const ssmRows = parseTable(ssmText);
  const insRows = parseTable(insText);
  const relRows = parseTable(relText);

  return {
    failureCases: mapSsmRows(ssmRows),
    inspectionItems: mapInspectionRows(insRows),
    reliabilityStandards: mapStandardRows(relRows),
  };
}
