import { Suspense, lazy } from "react";
import { ZenViewSwitcher } from "./ZenViewSwitcher";
import { CoreDashboardView } from "./CoreDashboardView";
import type { ZenView } from "./types";

const LibraryPage = lazy(() =>
  import("@/components/library/LibraryPage").then((m) => ({ default: m.LibraryPage }))
);
const PlanningPage = lazy(() =>
  import("@/components/planning/PlanningPage").then((m) => ({ default: m.PlanningPage }))
);

interface ClarityBoardProps {
  activeView: ZenView;
  onViewChange: (view: ZenView) => void;
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  onContextAction?: (actionId: string, payload?: string) => void;
}

export function ClarityBoard({
  activeView,
  onViewChange,
  selectedCardId,
  onSelectCard,
  onContextAction,
}: ClarityBoardProps) {
  return (
    <div className="py-4">
      <ZenViewSwitcher active={activeView} onChange={onViewChange} />

      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        }
      >
        {activeView === "core" && (
          <CoreDashboardView
            selectedCardId={selectedCardId}
            onSelectCard={onSelectCard}
            onContextAction={onContextAction}
          />
        )}
        {activeView === "library" && <LibraryPage />}
        {activeView === "planner" && <PlanningPage />}
      </Suspense>
    </div>
  );
}
