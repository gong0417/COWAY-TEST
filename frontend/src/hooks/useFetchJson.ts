import { useCallback, useEffect, useState } from "react";
import { fetchApiJson } from "@/lib/api";

type State<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

type UseFetchJsonOptions = {
  /** When true, no network request (e.g. VITE_AUTH_OFFLINE + data loaded elsewhere). */
  skip?: boolean;
};

/**
 * Generic GET JSON + loading/error state (useEffect + useState).
 */
export function useFetchJson<T>(
  path: string,
  options?: UseFetchJsonOptions,
): State<T> {
  const skip = options?.skip === true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(() => !skip);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (skip) {
      setLoading(false);
      return;
    }
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
  }, [path, skip]);

  useEffect(() => {
    if (skip) {
      setData(null);
      setError(null);
      setLoading(false);
      return;
    }
    void refetch();
  }, [refetch, skip]);

  return { data, loading, error, refetch };
}
