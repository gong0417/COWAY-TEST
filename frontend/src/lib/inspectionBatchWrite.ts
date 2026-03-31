import { apiUrl } from "@/lib/api";
import type { SpreadsheetInspectionRow } from "@/lib/parseInspectionSpreadsheet";

export async function batchCreateInspectionItems(
  rows: SpreadsheetInspectionRow[],
): Promise<{ written: number }> {
  const res = await fetch(apiUrl("/api/inspection-items/batch"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rows }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `일괄 저장 실패 (${res.status})`);
  }
  return res.json() as Promise<{ written: number }>;
}
