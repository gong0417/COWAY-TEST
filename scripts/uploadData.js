/**
 * 로컬 DB/*.csv 3종을 Firestore에 배치 업로드 (Node + firebase-admin)
 *
 * 준비:
 *   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/serviceAccount.json
 *     또는 FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
 *   - (선택) FIREBASE_PROJECT_ID=your-project-id
 *
 * 실행: npm run upload-data
 */
import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import admin from "firebase-admin";
import dotenv from "dotenv";
import Papa from "papaparse";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
dotenv.config({ path: join(root, ".env") });

const DB_DIR = join(root, "DB");
const FILES = {
  failure_cases: "ssm.csv",
  inspection_items: "inspection_items.csv",
  reliability_standards: "reliability_standards.csv",
};

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

function parseTable(text) {
  const parsed = Papa.parse(text, { header: true, skipEmptyLines: "greedy" });
  if (parsed.errors?.length) {
    console.warn("[CSV]", parsed.errors.slice(0, 3));
  }
  return (parsed.data ?? []).filter((row) =>
    Object.values(row).some((v) => v != null && String(v).trim() !== ""),
  );
}

function mapSsmToDocs(rows) {
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

    const data = {
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
    };
    out.push({ id, data: stripUndefined(data) });
  }
  return out;
}

function mapInspectionToDocs(rows) {
  const out = [];
  for (const row of rows) {
    const checkId = cell(row, "checkId", "check_id");
    if (!checkId) continue;
    const inspectionItem = cell(row, "inspectionItem", "inspection_item");
    const category = cell(row, "category");
    const internalStandard = cell(row, "internalStandard", "internal_standard");
    const method = cell(row, "method");
    const revisionDate = cell(row, "revisionDate", "revision_date");
    const notes = [
      internalStandard && `사내 표준: ${internalStandard}`,
      method && `방법: ${method}`,
    ]
      .filter(Boolean)
      .join("\n");
    const data = {
      name: inspectionItem || checkId,
      checkId,
      partNumber: checkId,
      category: category || undefined,
      internalStandard: internalStandard || undefined,
      method: method || undefined,
      revisionDate: revisionDate || undefined,
      notes: notes || undefined,
      status: "ok",
    };
    out.push({ id: checkId, data: stripUndefined(data) });
  }
  return out;
}

function mapStandardToDocs(rows) {
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
    const title = testName
      ? `${testName}${componentName ? ` (${componentName})` : ""}`
      : componentName || standardId;
    const data = {
      code: relatedDoc || standardId,
      title,
      section: componentName || undefined,
      body: bodyParts.length ? bodyParts.join("\n\n") : undefined,
      componentName: componentName || undefined,
      testName: testName || undefined,
      testCondition: testCondition || undefined,
      acceptanceCriteria: acceptanceCriteria || undefined,
      sampleSize: sampleSize || undefined,
      relatedDoc: relatedDoc || undefined,
    };
    out.push({ id: standardId, data: stripUndefined(data) });
  }
  return out;
}

function stripUndefined(obj) {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined && v !== ""),
  );
}

function initAdmin() {
  if (admin.apps.length) return admin.app();
  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  let projectId = process.env.FIREBASE_PROJECT_ID;

  if (jsonRaw) {
    const sa = JSON.parse(jsonRaw);
    projectId = projectId || sa.project_id;
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId,
    });
  } else if (credPath && existsSync(credPath)) {
    const sa = JSON.parse(readFileSync(credPath, "utf8"));
    projectId = projectId || sa.project_id;
    admin.initializeApp({
      credential: admin.credential.cert(sa),
      projectId,
    });
  } else {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS(서비스 계정 JSON 경로) 또는 FIREBASE_SERVICE_ACCOUNT_JSON을 설정하세요.",
    );
  }
  return admin.app();
}

async function commitInBatches(db, collectionName, docs) {
  const chunkSize = 400;
  for (let i = 0; i < docs.length; i += chunkSize) {
    const batch = db.batch();
    const chunk = docs.slice(i, i + chunkSize);
    for (const { id, data } of chunk) {
      const ref = db.collection(collectionName).doc(id);
      batch.set(ref, data, { merge: true });
    }
    await batch.commit();
    console.log(`  ${collectionName}: ${Math.min(i + chunkSize, docs.length)}/${docs.length}`);
  }
}

async function main() {
  initAdmin();
  const db = admin.firestore();

  for (const [collectionName, fileName] of Object.entries(FILES)) {
    const path = join(DB_DIR, fileName);
    if (!existsSync(path)) {
      console.error(`파일 없음: ${path}`);
      process.exitCode = 1;
      return;
    }
    const text = readFileSync(path, "utf8");
    const rows = parseTable(text);
    let docs;
    if (collectionName === "failure_cases") docs = mapSsmToDocs(rows);
    else if (collectionName === "inspection_items") docs = mapInspectionToDocs(rows);
    else docs = mapStandardToDocs(rows);

    console.log(`업로드 ${collectionName} (${docs.length}건) ← ${fileName}`);
    await commitInBatches(db, collectionName, docs);
  }

  console.log("완료.");
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
