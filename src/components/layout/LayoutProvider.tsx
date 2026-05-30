import { createContext, useContext, type ReactNode } from "react";
import { useLayout, type LayoutConfig } from "@/hooks/useLayout";

interface LayoutContextValue {
  layout: LayoutConfig;
  togglePanel: (id: string) => void;
  reorderPanels: (orderedIds: string[]) => void;
  resetLayout: () => void;
  isPanelVisible: (id: string) => boolean;
}

const LayoutContext = createContext<LayoutContextValue | null>(null);

export function LayoutProvider({ children }: { children: ReactNode }) {
  const value = useLayout();
  return <LayoutContext.Provider value={value}>{children}</LayoutContext.Provider>;
}

export function useLayoutContext(): LayoutContextValue {
  const ctx = useContext(LayoutContext);
  if (!ctx) {
    throw new Error("useLayoutContext must be used within LayoutProvider");
  }
  return ctx;
}

export { LayoutContext };
