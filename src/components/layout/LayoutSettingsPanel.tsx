import { useState, useCallback } from "react";
import { GripVertical, RotateCcw, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useLayoutContext } from "./LayoutProvider";

interface LayoutSettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function LayoutSettingsPanel({ open, onClose }: LayoutSettingsPanelProps) {
  const { layout, togglePanel, reorderPanels, resetLayout } = useLayoutContext();
  const [dragId, setDragId] = useState<string | null>(null);

  const sortedPanels = [...layout.panels].sort((a, b) => a.order - b.order);

  const handleDragStart = useCallback((id: string) => {
    setDragId(id);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault();
      if (!dragId || dragId === targetId) return;
      const ids = sortedPanels.map((p) => p.id);
      const from = ids.indexOf(dragId);
      const to = ids.indexOf(targetId);
      if (from < 0 || to < 0) return;
      const next = [...ids];
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      reorderPanels(next);
    },
    [dragId, sortedPanels, reorderPanels]
  );

  const handleDragEnd = useCallback(() => {
    setDragId(null);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-text">
            <Settings size={18} className="text-accent" />
            Layout settings
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-text"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mb-3 text-sm text-muted">Toggle panels and drag to reorder.</p>

        <ul className="space-y-2">
          {sortedPanels.map((panel) => (
            <li
              key={panel.id}
              draggable
              onDragStart={() => handleDragStart(panel.id)}
              onDragOver={(e) => handleDragOver(e, panel.id)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2 ${
                dragId === panel.id ? "opacity-60" : ""
              }`}
            >
              <GripVertical size={16} className="cursor-grab text-muted" />
              <label className="flex flex-1 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={panel.visible}
                  onChange={() => togglePanel(panel.id)}
                  className="rounded border-border accent-accent"
                />
                {panel.title}
              </label>
            </li>
          ))}
        </ul>

        <div className="mt-4 flex justify-between gap-2">
          <Button type="button" variant="ghost" onClick={resetLayout} className="gap-1">
            <RotateCcw size={14} />
            Reset to default
          </Button>
          <Button type="button" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
