import { useMemo } from "react";
import type { ContextualAction, ZenView } from "@/components/zen/types";

interface UseZenContextualActionsOptions {
  activeView: ZenView;
  selectedCardId: string | null;
  onFocusLibrarySearch: () => void;
  onDraftReply: () => void;
  onAddTask: () => void;
}

export function useZenContextualActions({
  activeView,
  selectedCardId,
  onFocusLibrarySearch,
  onDraftReply,
  onAddTask,
}: UseZenContextualActionsOptions): ContextualAction[] {
  return useMemo(() => {
    if (selectedCardId?.includes("email") || selectedCardId === "demo-email") {
      return [
        { id: "draft-reply", label: "Draft a reply", onClick: onDraftReply, variant: "primary" },
        { id: "defer", label: "Defer to tomorrow", onClick: () => {}, variant: "secondary" },
        { id: "dismiss", label: "Dismiss", onClick: () => {}, variant: "secondary" },
      ];
    }

    if (activeView === "library") {
      return [
        { id: "search", label: "Search library", onClick: onFocusLibrarySearch, variant: "primary" },
        { id: "semantic", label: "Semantic search", onClick: () => onFocusLibrarySearch(), variant: "secondary" },
      ];
    }

    if (activeView === "planner") {
      return [
        { id: "add-task", label: "Add task", onClick: onAddTask, variant: "primary" },
        { id: "weekly-review", label: "Weekly review", onClick: () => {}, variant: "secondary" },
      ];
    }

    return [
      { id: "capture", label: "Capture to library", onClick: onFocusLibrarySearch, variant: "secondary" },
      { id: "add-task", label: "Add focus task", onClick: onAddTask, variant: "secondary" },
    ];
  }, [activeView, selectedCardId, onFocusLibrarySearch, onDraftReply, onAddTask]);
}
