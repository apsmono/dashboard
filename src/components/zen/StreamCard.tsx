import { Mail, Newspaper, BookOpen, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ContextualAction, StreamCardData } from "./types";

interface StreamCardProps {
  card: StreamCardData;
  selected?: boolean;
  onSelect?: () => void;
  onAction?: (actionId: string) => void;
}

const kindIcon = {
  email: Mail,
  news: Newspaper,
  library: BookOpen,
  generic: Layers,
};

export function StreamCard({ card, selected, onSelect, onAction }: StreamCardProps) {
  const Icon = kindIcon[card.kind ?? "generic"];

  const actions: ContextualAction[] =
    card.kind === "email"
      ? [
          { id: "draft", label: "Draft reply", onClick: () => onAction?.("draft"), variant: "primary" },
          { id: "save", label: "Save", onClick: () => onAction?.("save"), variant: "secondary" },
          { id: "dismiss", label: "Dismiss", onClick: () => onAction?.("dismiss"), variant: "secondary" },
        ]
      : [
          { id: "open", label: "Open", onClick: () => onAction?.("open"), variant: "primary" },
          { id: "save", label: "Save", onClick: () => onAction?.("save"), variant: "secondary" },
        ];

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.();
        }
      }}
      className={`flex max-h-[140px] flex-col rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-md ${
        selected ? "border-accent ring-1 ring-accent/30" : "border-border"
      }`}
    >
      <div className="mb-2 flex items-center justify-between text-xs text-muted">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Icon size={14} className="text-accent" />
          {card.source}
        </span>
        <span>{card.timeLabel}</span>
      </div>
      <ul className="mb-2 flex-1 space-y-0.5 overflow-hidden text-sm text-text">
        {card.bullets.map((bullet, i) => (
          <li key={i} className="truncate">
            • {bullet}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-1.5" onClick={(e) => e.stopPropagation()}>
        {actions.map((action) => (
          <Button
            key={action.id}
            type="button"
            size="sm"
            variant={action.variant === "primary" ? "primary" : "secondary"}
            className="h-7 px-2 text-xs"
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </article>
  );
}
