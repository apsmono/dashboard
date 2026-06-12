import { cn } from "@/lib/utils";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import type { ToastItem } from "@/hooks/useToasts";

export function Toasts({ toasts }: { toasts: ToastItem[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed bottom-20 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-6"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm shadow-lg",
            t.variant === "success" ? "border-border text-text" : "border-danger text-danger"
          )}
        >
          {t.variant === "success" ? (
            <CheckCircle2 size={16} className="text-success" />
          ) : (
            <AlertTriangle size={16} />
          )}
          {t.message}
        </div>
      ))}
    </div>
  );
}
