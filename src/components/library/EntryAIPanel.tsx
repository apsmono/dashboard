import { useState, useCallback, useRef, useEffect } from "react";
import { Send, Loader2, Sparkles, User } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EntryAIPanelProps {
  entryTitle: string;
  onAsk: (query: string) => Promise<void>;
  answer: string;
  loading: boolean;
  error: string;
}

const SUGGESTED_PROMPTS = [
  "Summarize this",
  "Key takeaways",
  "Explain like I'm 5",
  "What are the main arguments?",
];

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

export function EntryAIPanel({ entryTitle, onAsk, answer, loading, error }: EntryAIPanelProps) {
  const [query, setQuery] = useState("");
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When answer updates, add it to history
  useEffect(() => {
    if (answer && !loading) {
      setHistory((prev) => {
        // Replace last AI message if it exists, otherwise append
        if (prev.length > 0 && prev[prev.length - 1].role === "ai") {
          return [...prev.slice(0, -1), { role: "ai", text: answer }];
        }
        return [...prev, { role: "ai", text: answer }];
      });
    }
  }, [answer, loading]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, loading]);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      const q = query.trim();
      if (!q || loading) return;
      setHistory((prev) => [...prev, { role: "user", text: q }]);
      setQuery("");
      await onAsk(q);
    },
    [query, loading, onAsk]
  );

  const handleSuggested = useCallback(
    (prompt: string) => {
      setHistory((prev) => [...prev, { role: "user", text: prompt }]);
      setQuery("");
      onAsk(prompt);
    },
    [onAsk]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Chat area */}
      <div
        ref={scrollRef}
        className="max-h-[50vh] min-h-[200px] overflow-y-auto rounded-lg border border-border bg-surface p-3 space-y-3"
      >
        {history.length === 0 && !loading && (
          <div className="py-6 text-center">
            <Sparkles size={24} className="mx-auto mb-2 text-accent opacity-60" />
            <p className="text-sm text-muted">
              Ask anything about <span className="font-medium text-text">{entryTitle}</span>
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {SUGGESTED_PROMPTS.map((p) => (
                <button
                  key={p}
                  onClick={() => handleSuggested(p)}
                  className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted hover:text-text hover:border-accent transition-colors"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {history.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "ai" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10">
                <Sparkles size={12} className="text-accent" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${
                msg.role === "user"
                  ? "bg-accent text-white"
                  : "bg-card text-text border border-border"
              }`}
            >
              {msg.text}
            </div>
            {msg.role === "user" && (
              <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface">
                <User size={12} className="text-muted" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted">
            <Loader2 size={14} className="animate-spin" />
            Thinking…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-danger bg-banner-error-bg px-3 py-2 text-sm text-banner-error-text">
            {error}
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask about this entry…"
          className="flex-1 rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
        <Button type="submit" size="sm" disabled={loading || !query.trim()}>
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
        </Button>
      </form>
    </div>
  );
}
