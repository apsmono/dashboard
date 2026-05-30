export type ZenView = "core" | "library" | "planner";

export interface ContextualAction {
  id: string;
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary";
}

export interface StreamCardData {
  id: string;
  source: string;
  timeLabel: string;
  bullets: [string, string, string];
  kind?: "email" | "news" | "library" | "generic";
}
