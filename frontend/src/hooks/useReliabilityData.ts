import { useCallback, useEffect, useMemo, useState } from "react";
import type { CollectionsResponse } from "@/lib/api";
import { useFetchJson } from "@/hooks/useFetchJson";
import { isAuthOfflineMode } from "@/lib/authMode";
import { loadAllCsvFromStaticOnly } from "@/lib/loadDbCsv";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

/**
 * App-wide dataset from `GET /api/collections` (`fetch` → Express).
 * With `VITE_AUTH_OFFLINE=true`, loads from `public/DB/*.csv` (no JWT / no API).
 */
export function useReliabilityData() {
  const offline = isAuthOfflineMode();

  const {
    data: apiData,
    loading: apiLoading,
    error: apiError,
    refetch: apiRefetch,
  } = useFetchJson<CollectionsResponse>("/api/collections", { skip: offline });

  const [staticData, setStaticData] = useState<CollectionsResponse | null>(
    null,
  );
  const [staticLoading, setStaticLoading] = useState(offline);
  const [staticError, setStaticError] = useState<string | null>(null);

  const loadStatic = useCallback(async () => {
    setStaticLoading(true);
    setStaticError(null);
    try {
      const csv = await loadAllCsvFromStaticOnly();
      setStaticData({
        failureCases: csv.failureCases,
        reliabilityStandards: csv.reliabilityStandards,
        inspectionItems: csv.inspectionItems,
      });
    } catch (e) {
      setStaticError(e instanceof Error ? e.message : String(e));
      setStaticData(null);
    } finally {
      setStaticLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!offline) return;
    void loadStatic();
  }, [offline, loadStatic]);

  const refetch = useCallback(async () => {
    if (offline) return loadStatic();
    return apiRefetch();
  }, [offline, loadStatic, apiRefetch]);

  const data = offline ? staticData : apiData;
  const loading = offline ? staticLoading : apiLoading;
  const error = offline ? staticError : apiError;

  const inspectionItems: InspectionItem[] = useMemo(
    () => data?.inspectionItems ?? [],
    [data],
  );
  const failureCases: FailureCase[] = useMemo(
    () => data?.failureCases ?? [],
    [data],
  );
  const reliabilityStandards: ReliabilityStandard[] = useMemo(
    () => data?.reliabilityStandards ?? [],
    [data],
  );

  const apiReady = Boolean(data && !error);

  return {
    inspectionItems,
    failureCases,
    reliabilityStandards,
    loading,
    error,
    apiReady,
    refetch,
  };
}
