import { useMemo } from "react";
import type { CollectionsResponse } from "@/lib/api";
import { useFetchJson } from "@/hooks/useFetchJson";
import type {
  FailureCase,
  InspectionItem,
  ReliabilityStandard,
} from "@/types/models";

/**
 * App-wide dataset from `GET /api/collections` (`fetch` → Express).
 * Backend fills JSON from PostgreSQL (SELECT) when DB env is set, else from CSV files.
 */
export function useReliabilityData() {
  const { data, loading, error, refetch } =
    useFetchJson<CollectionsResponse>("/api/collections");

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
