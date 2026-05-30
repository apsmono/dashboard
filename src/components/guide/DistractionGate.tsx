import { useState, useCallback, useEffect } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DistractionGateProps {
  open: boolean;
  onClose: () => void;
  onSave?: (text: string) => Promise<void>;
}

export function DistractionGate({ open, onClose, onSave }: DistractionGateProps) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setText("");
      setSaving(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, saving, onClose]);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || saving || !onSave) return;
    setSaving(true);
    try {
      await onSave(trimmed);
      setText("");
      onClose();
    } catch {
      // caller surfaces errors in chat thread
    } finally {
      setSaving(false);
    }
  }, [text, saving, onSave, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-text">Park a thought</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-text disabled:opacity-50"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="What's on your mind?"
          rows={4}
          disabled={saving}
          autoFocus
          className="w-full resize-y rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
        />
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose} disabled={saving}>
            Never mind
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving || !text.trim()}>
            {saving ? (
              <span className="flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </span>
            ) : (
              "Park it"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
