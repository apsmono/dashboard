import { useEffect } from "react";

const TAB_ORDER = ["overview", "library", "graph", "timeline", "analysis", "planning"];

export function useKeyboardShortcuts(
  activeTab: string,
  onChangeTab: (tab: string) => void,
  onFocusSearch?: () => void,
  onCloseModal?: () => void,
  onShowCheatsheet?: () => void,
) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore if typing in an input/textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        // Allow Escape even in inputs
        if (e.key === "Escape" && onCloseModal) {
          onCloseModal();
        }
        return;
      }

      // Number keys 1-6 switch tabs
      if (e.key >= "1" && e.key <= "6") {
        const index = parseInt(e.key, 10) - 1;
        if (index < TAB_ORDER.length) {
          onChangeTab(TAB_ORDER[index]);
        }
        return;
      }

      // / focuses search
      if (e.key === "/") {
        e.preventDefault();
        onFocusSearch?.();
        return;
      }

      // Cmd/Ctrl+K focuses command input (tab 8 = "cmd")
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onChangeTab("cmd");
        return;
      }

      // ? shows keyboard cheatsheet
      if (e.key === "?") {
        e.preventDefault();
        onShowCheatsheet?.();
        return;
      }

      // Escape closes modals
      if (e.key === "Escape" && onCloseModal) {
        onCloseModal();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeTab, onChangeTab, onFocusSearch, onCloseModal, onShowCheatsheet]);
}
