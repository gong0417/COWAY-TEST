/**
 * Mirrors frontend/src/lib/loadDbCsv.ts mapping logic for server-side reads.
 */
import Papa from "papaparse";
import { readFileSync } from "node:fs";

export function parseTable(text) {
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: "greedy",
  });
  return (parsed.data ?? []).filter((row) =>
    Object.values(row).some((v) => v != null && String(v).trim() !== ""),
  );
}

function cell(row, ...keys) {
  for (const k of keys) {
    if (k in row && row[k] != null) {
      const s = String(row[k]).trim();
      if (s) return s;
    }
  }
  return "";
}

function findSsmDocumentTitle(row) {
  for (const [k, v] of Object.entries(row)) {
    if (/document/i.test(k) && /목|제/.test(k)) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }
  return cell(row, "ssm.document제 목1");
}

export function mapSsmRows(rows) {
  const out = [];
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

export function mapInspectionRows(rows) {
  const out = [];
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

export function mapStandardRows(rows) {
  const out = [];
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

export function loadCsvTexts(dataDir) {
  const ssmText = readFileSync(`${dataDir}/ssm.csv`, "utf8");
  const insText = readFileSync(`${dataDir}/inspection_items.csv`, "utf8");
  const relText = readFileSync(`${dataDir}/reliability_standards.csv`, "utf8");
  return { ssmText, insText, relText };
}

export function parseAllFromDisk(dataDir) {
  const { ssmText, insText, relText } = loadCsvTexts(dataDir);
  return {
    failureCases: mapSsmRows(parseTable(ssmText)),
    inspectionItems: mapInspectionRows(parseTable(insText)),
    reliabilityStandards: mapStandardRows(parseTable(relText)),
  };
}
