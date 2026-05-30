import { useState, useCallback, useEffect } from "react";

export interface PanelConfig {
  id: string;
  title: string;
  visible: boolean;
  order: number;
}

export interface LayoutConfig {
  panels: PanelConfig[];
  sidebarVisible: boolean;
  sidebarWidth: number;
}

const STORAGE_KEY = "signal_layout";

const DEFAULT_LAYOUT: LayoutConfig = {
  panels: [
    { id: "guide", title: "AI Guide", visible: true, order: 0 },
    { id: "library", title: "Library", visible: true, order: 1 },
  ],
  sidebarVisible: true,
  sidebarWidth: 320,
};

function loadLayout(): LayoutConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LayoutConfig;
      if (parsed.panels?.length) return parsed;
    }
  } catch {
    // ignore parse errors
  }
  return DEFAULT_LAYOUT;
}

function saveLayout(layout: LayoutConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch {
    // ignore quota errors
  }
}

export function useLayout() {
  const [layout, setLayout] = useState<LayoutConfig>(loadLayout);

  useEffect(() => {
    saveLayout(layout);
  }, [layout]);

  const togglePanel = useCallback((id: string) => {
    setLayout((prev) => ({
      ...prev,
      panels: prev.panels.map((p) => (p.id === id ? { ...p, visible: !p.visible } : p)),
    }));
  }, []);

  const reorderPanels = useCallback((orderedIds: string[]) => {
    setLayout((prev) => ({
      ...prev,
      panels: prev.panels
        .map((p) => {
          const order = orderedIds.indexOf(p.id);
          return order >= 0 ? { ...p, order } : p;
        })
        .sort((a, b) => a.order - b.order),
    }));
  }, []);

  const resetLayout = useCallback(() => {
    setLayout(DEFAULT_LAYOUT);
  }, []);

  const isPanelVisible = useCallback(
    (id: string) => layout.panels.find((p) => p.id === id)?.visible ?? true,
    [layout.panels]
  );

  return { layout, togglePanel, reorderPanels, resetLayout, isPanelVisible };
}
