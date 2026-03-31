import { collection, doc, writeBatch } from "firebase/firestore";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import type { SpreadsheetInspectionRow } from "@/lib/parseInspectionSpreadsheet";

const BATCH_SIZE = 450;

export async function batchCreateInspectionItems(
  rows: SpreadsheetInspectionRow[],
): Promise<{ written: number }> {
  const db = getDb();
  if (!db) throw new Error("Firebase가 설정되지 않았습니다.");

  let written = 0;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    const chunk = rows.slice(i, i + BATCH_SIZE);
    for (const row of chunk) {
      const ref = doc(collection(db, COLLECTIONS.inspectionItems));
      batch.set(ref, {
        name: row.name,
        partNumber: row.partNumber ?? null,
        category: row.category ?? null,
        grade: row.grade ?? null,
        socPrecision: row.socPrecision ?? null,
        insulationResistance: row.insulationResistance ?? null,
        notes: row.notes ?? null,
        status: row.status ?? "ok",
        updatedAt: Date.now(),
      });
    }
    await batch.commit();
    written += chunk.length;
  }
  return { written };
}
