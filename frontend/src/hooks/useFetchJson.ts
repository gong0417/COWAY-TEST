import { useCallback, useEffect, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

/**
 * Generic GET JSON + loading/error state (useEffect + useState).
 */
export function useFetchJson<T>(path: string): State<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchApiJson<T>(path, { method: "GET" });
      setData(result ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [path]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return { data, loading, error, refetch };
}
