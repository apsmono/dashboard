import { useState, useEffect, useCallback } from "react";

export interface LibraryUrlState {
  view: "cards" | "compact" | "table";
  sort: string;
  search: string;
  section: string;
  tag: string;
  page: number;
  perPage: number;
}

const STORAGE_KEY = "library-view-preference";
const DEFAULTS: LibraryUrlState = {
  view: "cards",
  sort: "newest",
  search: "",
  section: "",
  tag: "",
  page: 1,
  perPage: 12,
};

function getDefaultView(): "cards" | "compact" | "table" {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "compact" || stored === "table") return stored;
  } catch {}
  return "cards";
}

export function parseHashState(): LibraryUrlState {
  const hash = window.location.hash.replace("#", "");
  const qIndex = hash.indexOf("?");
  const params = qIndex >= 0 ? new URLSearchParams(hash.slice(qIndex + 1)) : new URLSearchParams();
  return {
    view: (params.get("view") as "cards" | "compact" | "table") ?? getDefaultView(),
    sort: params.get("sort") ?? DEFAULTS.sort,
    search: params.get("q") ?? DEFAULTS.search,
    section: params.get("section") ?? DEFAULTS.section,
    tag: params.get("tag") ?? DEFAULTS.tag,
    page: Number(params.get("page")) || DEFAULTS.page,
    perPage: Number(params.get("perPage")) || DEFAULTS.perPage,
  };
}

export function useLibraryUrlState(): [LibraryUrlState, (patch: Partial<LibraryUrlState>) => void] {
  const [state, setState] = useState<LibraryUrlState>(() => parseHashState());

  const writeHash = useCallback((patch: Partial<LibraryUrlState>) => {
    const current = parseHashState();
    const merged = { ...current, ...patch };

    // If filter/sort/search changes, reset page to 1
    const filterKeys: (keyof LibraryUrlState)[] = ["search", "section", "tag", "sort"];
    const isFilterChange = filterKeys.some((k) => patch[k] !== undefined && patch[k] !== current[k]);
    if (isFilterChange) merged.page = 1;

    // Persist view preference
    if (patch.view !== undefined) {
      try { localStorage.setItem(STORAGE_KEY, patch.view); } catch {}
    }

    // Build URLSearchParams, omitting defaults
    const params = new URLSearchParams();
    if (merged.view !== DEFAULTS.view) params.set("view", merged.view);
    if (merged.sort !== DEFAULTS.sort) params.set("sort", merged.sort);
    if (merged.search) params.set("q", merged.search);
    if (merged.section) params.set("section", merged.section);
    if (merged.tag) params.set("tag", merged.tag);
    if (merged.page !== 1) params.set("page", String(merged.page));
    if (merged.perPage !== 12) params.set("perPage", String(merged.perPage));

    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `#/library?${qs}` : "#/library");
    setState(merged);
  }, []);

  // Listen for hash changes (back/forward buttons)
  useEffect(() => {
    const handler = () => setState(parseHashState());
    window.addEventListener("hashchange", handler);
    return () => window.removeEventListener("hashchange", handler);
  }, []);

  return [state, writeHash];
}
