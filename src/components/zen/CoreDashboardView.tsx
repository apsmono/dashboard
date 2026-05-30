import { useCallback } from "react";
import { CriticalFocusBlock } from "./CriticalFocusBlock";
import { ContextNest } from "./ContextNest";

interface CoreDashboardViewProps {
  selectedCardId: string | null;
  onSelectCard: (id: string | null) => void;
  onContextAction?: (actionId: string, payload?: string) => void;
}

export function CoreDashboardView({
  selectedCardId,
  onSelectCard,
  onContextAction,
}: CoreDashboardViewProps) {
  const handleCardAction = useCallback(
    (cardId: string, actionId: string) => {
      onContextAction?.(actionId, cardId);
    },
    [onContextAction]
  );

  return (
    <div className="space-y-8">
      <CriticalFocusBlock
        onContextAction={(actionId, taskId) => onContextAction?.(actionId, taskId)}
      />
      <ContextNest
        selectedCardId={selectedCardId}
        onSelectCard={onSelectCard}
        onCardAction={handleCardAction}
      />
    </div>
  );
}
