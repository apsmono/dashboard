import { useEffect, useRef } from "react";
import { X, Keyboard } from "lucide-react";

interface ShortcutGroup {
  title: string;
  items: { keys: string[]; action: string }[];
}

const SHORTCUTS: ShortcutGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: ["?"], action: "Show this cheatsheet" },
      { keys: ["1"], action: "Go to Overview" },
      { keys: ["2"], action: "Go to Library" },
      { keys: ["3"], action: "Go to Graph" },
      { keys: ["4"], action: "Go to Timeline" },
      { keys: ["5"], action: "Go to Analysis" },
      { keys: ["6"], action: "Go to Planning" },
      { keys: ["Esc"], action: "Close modals / Go back" },
    ],
  },
  {
    title: "Commands",
    items: [
      { keys: ["⌘", "K"], action: "Open Command Palette" },
      { keys: ["/"], action: "Focus search (Library)" },
      { keys: ["Enter"], action: "Submit form / command" },
    ],
  },
  {
    title: "Widgets",
    items: [
      { keys: ["Click"], action: "Check in / complete a task or habit" },
      { keys: ["Hover"], action: "Reveal delete buttons" },
    ],
  },
];

interface KeyboardCheatsheetProps {
  open: boolean;
  onClose: () => void;
}

export function KeyboardCheatsheet({ open, onClose }: KeyboardCheatsheetProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={ref}
        className="w-full max-w-lg rounded-xl border border-border bg-card shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div className="flex items-center gap-2">
            <Keyboard size={16} className="text-accent" />
            <h2 className="text-sm font-semibold text-text">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted hover:text-text transition-colors"
            aria-label="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* Shortcuts grid */}
        <div className="max-h-[60vh] overflow-y-auto p-5 space-y-5">
          {SHORTCUTS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
                {group.title}
              </h3>
              <div className="space-y-1.5">
                {group.items.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2"
                  >
                    <span className="text-sm text-text">{item.action}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, ki) => (
                        <kbd
                          key={ki}
                          className="inline-flex items-center rounded border border-border bg-card px-1.5 py-0.5 text-[11px] font-mono text-muted"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-2.5 text-center">
          <p className="text-[11px] text-muted">
            Press <kbd className="rounded border border-border bg-card px-1 py-0.5 text-[10px] font-mono">Esc</kbd> to close
          </p>
        </div>
      </div>
    </div>
  );
}
