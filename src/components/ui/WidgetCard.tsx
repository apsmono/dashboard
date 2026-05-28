import type { ReactNode } from "react";

interface WidgetCardProps {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  accent?: boolean;
}

export function WidgetCard({ title, icon, children, className = "", accent = false }: WidgetCardProps) {
  return (
    <div
      className={`rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-lg ${
        accent ? "ring-1 ring-accent/20" : ""
      } ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        {icon && <span className="text-accent">{icon}</span>}
        <h3 className="text-sm font-semibold text-text">{title}</h3>
      </div>
      {children}
    </div>
  );
}
