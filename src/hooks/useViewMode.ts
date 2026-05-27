import { useState, useEffect, useCallback } from "react";

type ViewMode = "desktop" | "mobile";

const STORAGE_KEY = "dash-view-mode";

export function useViewMode() {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem(STORAGE_KEY) as ViewMode) || "desktop";
  });

  useEffect(() => {
    const body = document.body;
    body.classList.remove("view-desktop", "view-mobile");
    body.classList.add(`view-${viewMode}`);
  }, [viewMode]);

  const setViewMode = useCallback((mode: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setViewModeState(mode);
  }, []);

  return { viewMode, setViewMode };
}
