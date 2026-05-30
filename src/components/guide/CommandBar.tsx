import { useState, useCallback } from "react";
import { ArrowUp, Loader2, Pin } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface CommandBarProps {
  onSend: (text: string) => void | Promise<void>;
  onPark: () => void;
  loading?: boolean;
}

export function CommandBar({ onSend, onPark, loading = false }: CommandBarProps) {
  const [text, setText] = useState("");

  const submit = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setText("");
    await onSend(trimmed);
  }, [text, loading, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    },
    [submit]
  );

  return (
    <div className="border-t border-border bg-surface p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPark}
          disabled={loading}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted transition-colors hover:border-accent hover:text-accent disabled:opacity-50"
          title="Park a thought"
          aria-label="Park a thought"
        >
          <Pin size={16} />
        </button>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask or command..."
          disabled={loading}
          className="min-w-0 flex-1 rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent disabled:opacity-50"
        />
        <Button
          type="button"
          size="sm"
          onClick={submit}
          disabled={loading || !text.trim()}
          className="shrink-0"
          aria-label="Send command"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
        </Button>
      </div>
    </div>
  );
}
