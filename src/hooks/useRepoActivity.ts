import { useEffect, useState } from "react";

/**
 * Live "last push" dates for public GitHub repos via REST (no scraping).
 * Unauthenticated: 60 req/h per visitor — fine because results are cached in
 * sessionStorage for an hour and the portfolio lists a handful of repos.
 * Private/missing repos simply yield no date (UI falls back to static info).
 */

const CACHE_KEY = "gh-repo-activity-v1";
const CACHE_TTL_MS = 60 * 60 * 1000;

interface CacheShape {
  at: number;
  /** "owner/repo" → pushed_at ISO string */
  data: Record<string, string>;
}

/** Extract "owner/repo" from a github.com URL, or null. */
export function repoFromUrl(url: string | undefined): string | null {
  if (!url) return null;
  const m = url.match(/github\.com\/([^/]+\/[^/#?]+)/);
  return m ? m[1] : null;
}

function readCache(): CacheShape | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as CacheShape;
    if (Date.now() - cache.at > CACHE_TTL_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

export function useRepoActivity(repos: (string | null)[]): Record<string, string> {
  // Seed synchronously from the session cache; the effect only handles fetching.
  const [pushed, setPushed] = useState<Record<string, string>>(() => readCache()?.data ?? {});
  // Stable dep: the effect re-runs only when the actual repo set changes.
  const key = [...new Set(repos.filter((r): r is string => r !== null))].sort().join(",");

  useEffect(() => {
    if (key === "") return;
    if (readCache()) return; // fresh cache — state was seeded at mount
    const unique = key.split(",");

    let cancelled = false;
    Promise.allSettled(
      unique.map(async (repo) => {
        const res = await fetch(`https://api.github.com/repos/${repo}`);
        if (!res.ok) throw new Error(`${repo}: ${res.status}`);
        const json = (await res.json()) as { pushed_at?: string };
        if (!json.pushed_at) throw new Error(`${repo}: no pushed_at`);
        return [repo, json.pushed_at] as const;
      })
    ).then((results) => {
      if (cancelled) return;
      const data: Record<string, string> = {};
      for (const r of results) {
        if (r.status === "fulfilled") data[r.value[0]] = r.value[1];
      }
      setPushed(data);
      try {
        sessionStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
      } catch {
        // sessionStorage unavailable — live data still shown this visit
      }
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return pushed;
}
