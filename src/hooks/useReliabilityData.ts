import { collection, onSnapshot, type Unsubscribe } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { loadAllCsv } from "@/lib/loadDbCsv";
import { COLLECTIONS, getDb } from "@/lib/firebase";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

function mapDoc<T extends { id: string }>(id: string, data: Record<string, unknown>): T {
  return { id, ...data } as T;
}

function mergeById<T extends { id: string }>(local: T[], remote: T[]): T[] {
  const map = new Map<string, T>();
  for (const row of local) map.set(row.id, { ...row });
  for (const row of remote) {
    const prev = map.get(row.id);
    map.set(row.id, prev ? { ...prev, ...row } : row);
  }
  return Array.from(map.values());
}

export function useReliabilityData() {
  const [csvInspection, setCsvInspection] = useState<InspectionItem[]>([]);
  const [csvFailure, setCsvFailure] = useState<FailureCase[]>([]);
  const [csvStandards, setCsvStandards] = useState<ReliabilityStandard[]>([]);

  const [fbInspection, setFbInspection] = useState<InspectionItem[]>([]);
  const [fbFailure, setFbFailure] = useState<FailureCase[]>([]);
  const [fbStandards, setFbStandards] = useState<ReliabilityStandard[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadAllCsv()
      .then((d) => {
        if (cancelled) return;
        setCsvInspection(d.inspectionItems);
        setCsvFailure(d.failureCases);
        setCsvStandards(d.reliabilityStandards);
      })
      .catch((e) => {
        if (!cancelled)
          setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setFirebaseReady(false);
      return;
    }
    setFirebaseReady(true);
    const unsubs: Unsubscribe[] = [];

    try {
      unsubs.push(
        onSnapshot(
          collection(db, COLLECTIONS.inspectionItems),
          (snap) => {
            setFbInspection(
              snap.docs.map((d) =>
                mapDoc<InspectionItem>(d.id, d.data() as Record<string, unknown>),
              ),
            );
          },
          (e) => setError(e.message),
        ),
      );
      unsubs.push(
        onSnapshot(
          collection(db, COLLECTIONS.failureCases),
          (snap) => {
            setFbFailure(
              snap.docs.map((d) =>
                mapDoc<FailureCase>(d.id, d.data() as Record<string, unknown>),
              ),
            );
          },
          (e) => setError(e.message),
        ),
      );
      unsubs.push(
        onSnapshot(
          collection(db, COLLECTIONS.reliabilityStandards),
          (snap) => {
            setFbStandards(
              snap.docs.map((d) =>
                mapDoc<ReliabilityStandard>(
                  d.id,
                  d.data() as Record<string, unknown>,
                ),
              ),
            );
          },
          (e) => setError(e.message),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }

    return () => unsubs.forEach((u) => u());
  }, []);

  const inspectionItems = useMemo(
    () => mergeById(csvInspection, fbInspection),
    [csvInspection, fbInspection],
  );
  const failureCases = useMemo(
    () => mergeById(csvFailure, fbFailure),
    [csvFailure, fbFailure],
  );
  const reliabilityStandards = useMemo(
    () => mergeById(csvStandards, fbStandards),
    [csvStandards, fbStandards],
  );

  return {
    inspectionItems,
    failureCases,
    reliabilityStandards,
    loading,
    error,
    firebaseReady,
  };
}
