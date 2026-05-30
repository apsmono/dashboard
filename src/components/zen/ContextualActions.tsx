import { Button } from "@/components/ui/Button";
import type { ContextualAction } from "./types";

interface ContextualActionsProps {
  actions: ContextualAction[];
  title?: string;
}

export function ContextualActions({ actions, title = "Contextual actions" }: ContextualActionsProps) {
  if (actions.length === 0) return null;

  return (
    <div className="rounded-lg border border-border bg-surface/80 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</p>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={action.variant === "primary" ? "primary" : "secondary"}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
