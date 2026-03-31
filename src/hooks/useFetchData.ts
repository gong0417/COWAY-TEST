import { useCallback, useEffect, useState } from "react";
import { firestoreDb } from "@/firebase/config";
import { fetchAllCollectionsParallel } from "@/lib/fetchFirestoreCollections";

export type FetchedFirestoreData = {
  failureCases: Record<string, unknown>[];
  reliabilityStandards: Record<string, unknown>[];
  inspectionItems: Record<string, unknown>[];
};

/**
 * failure_cases, reliability_standards, inspection_items 를 병렬로 한 번에 로드
 */
export function useFetchData() {
  const [data, setData] = useState<FetchedFirestoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!firestoreDb) {
      setError("Firebase가 설정되지 않았습니다 (.env의 VITE_FIREBASE_* 확인).");
      setData({
        failureCases: [],
        reliabilityStandards: [],
        inspectionItems: [],
      });
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await fetchAllCollectionsParallel(firestoreDb);
      setData(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, refetch: load };
}
