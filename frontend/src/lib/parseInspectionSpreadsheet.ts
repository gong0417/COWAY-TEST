import * as XLSX from "xlsx";
import type { InspectionItem } from "@/types/models";

export type SpreadsheetInspectionRow = Omit<
  InspectionItem,
  "id" | "updatedAt"
> & { name: string };

const HEADER_ALIASES: Record<string, keyof SpreadsheetInspectionRow | "__ignore"> = {
  name: "name",
  부품명: "name",
  partname: "name",
  part_number: "partNumber",
  partnumber: "partNumber",
  품번: "partNumber",
  pn: "partNumber",
  category: "category",
  분류: "category",
  grade: "grade",
  등급: "grade",
  신뢰등급: "grade",
  "신뢰 등급": "grade",
  socprecision: "socPrecision",
  soc: "socPrecision",
  soc_정밀도: "socPrecision",
  "soc 정밀도": "socPrecision",
  "soc정밀도": "socPrecision",
  insulationresistance: "insulationResistance",
  절연: "insulationResistance",
  절연저항: "insulationResistance",
  "절연 저항": "insulationResistance",
  notes: "notes",
  비고: "notes",
  status: "status",
  상태: "status",
};

function normHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[_]/g, " ");
}

function mapHeader(cell: string): keyof SpreadsheetInspectionRow | null {
  const n = normHeader(cell);
  const compact = n.replace(/\s/g, "");
  const direct = HEADER_ALIASES[n] ?? HEADER_ALIASES[compact];
  if (direct && direct !== "__ignore") return direct;
  for (const [k, v] of Object.entries(HEADER_ALIASES)) {
    if (k.replace(/\s/g, "") === compact && v !== "__ignore")
      return v as keyof SpreadsheetInspectionRow;
  }
  return null;
}

function parseStatus(v: unknown): InspectionItem["status"] | undefined {
  if (v == null || v === "") return undefined;
  const s = String(v).trim().toLowerCase();
  if (s === "ok" || s === "정상" || s === "pass") return "ok";
  if (s === "warn" || s === "warning" || s === "경고") return "warn";
  if (s === "fail" || s === "불량" || s === "ng") return "fail";
  return undefined;
}

/**
 * 첫 시트를 JSON으로 읽어 부품 마스터 행으로 변환. 헤더는 한글/영문 별칭 지원.
 * `.csv`는 UTF-8 텍스트로 읽습니다.
 */
export function parseInspectionWorkbook(
  buffer: ArrayBuffer,
  fileName = "",
): SpreadsheetInspectionRow[] {
  const lower = fileName.toLowerCase();
  const wb =
    lower.endsWith(".csv")
      ? XLSX.read(new TextDecoder("utf-8").decode(buffer), { type: "string" })
      : XLSX.read(buffer, { type: "array" });
  const name = wb.SheetNames[0];
  if (!name) return [];
  const sheet = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
    raw: false,
  });
  const out: SpreadsheetInspectionRow[] = [];
  for (const raw of rows) {
    const row: Partial<SpreadsheetInspectionRow> = {};
    for (const [header, val] of Object.entries(raw)) {
      const key = mapHeader(header);
      if (!key) continue;
      if (key === "status") {
        const st = parseStatus(val);
        if (st) row.status = st;
      } else if (key === "name") {
        row.name = String(val ?? "").trim();
      } else {
        const str = String(val ?? "").trim();
        if (str) (row as Record<string, string>)[key] = str;
      }
    }
    if (row.name) out.push(row as SpreadsheetInspectionRow);
  }
  return out;
}
