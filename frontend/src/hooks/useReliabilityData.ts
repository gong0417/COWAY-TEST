import { useCallback, useEffect, useState } from "react";
import { apiUrl } from "@/lib/api";
import { loadAllCsv } from "@/lib/loadDbCsv";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

export function useReliabilityData() {
  const [inspectionItems, setInspectionItems] = useState<InspectionItem[]>([]);
  const [failureCases, setFailureCases] = useState<FailureCase[]>([]);
  const [reliabilityStandards, setReliabilityStandards] = useState<
    ReliabilityStandard[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiReady, setApiReady] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const csv = await loadAllCsv();
      setFailureCases(csv.failureCases);
      setReliabilityStandards(csv.reliabilityStandards);

      try {
        const r = await fetch(apiUrl("/api/inspection-items"));
        if (r.ok) {
          const merged = (await r.json()) as InspectionItem[];
          setInspectionItems(merged);
        } else {
          setInspectionItems(csv.inspectionItems);
        }
      } catch {
        setInspectionItems(csv.inspectionItems);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    void fetch(apiUrl("/api/health"))
      .then((r) => setApiReady(r.ok))
      .catch(() => setApiReady(false));
  }, []);

  return {
    inspectionItems,
    failureCases,
    reliabilityStandards,
    loading,
    error,
    apiReady,
    refetch: load,
  };
}
