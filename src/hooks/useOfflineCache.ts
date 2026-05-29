import { useState, useEffect, useCallback } from "react";
import { cacheResponse, getCachedResponse } from "@/lib/offline";

interface OfflineCacheResult<T> {
  data: T | null;
  error: string;
  loading: boolean;
  isStale: boolean;
  cachedAt: number | null;
}

export function useOfflineCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  deps: unknown[] = []
): OfflineCacheResult<T> & { refetch: () => Promise<void> } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [isStale, setIsStale] = useState(false);
  const [cachedAt, setCachedAt] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await fetcher();
      setData(result);
      setIsStale(false);
      setCachedAt(Date.now());
      cacheResponse(key, result);
    } catch (e) {
      const stale = getCachedResponse<T>(key);
      if (stale) {
        setData(stale);
        setIsStale(true);
        setError("Offline — showing cached data");
      } else {
        setError(e instanceof Error ? e.message : "Failed to load");
      }
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  useEffect(() => {
    fetchData();
  }, deps);

  return { data, error, loading, isStale, cachedAt, refetch: fetchData };
}
