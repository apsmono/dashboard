import { useState, useCallback } from "react";
import { StatusBanner } from "./StatusBanner";
import { CommandBar } from "./CommandBar";
import { DistractionGate } from "./DistractionGate";
import { ContextualActions } from "@/components/zen/ContextualActions";
import { useGuideStatus, useParkDistraction } from "@/hooks/useApi";
import { sendGuideCommand } from "@/lib/api";
import type { ContextualAction } from "@/components/zen/types";

export interface GuideMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIGuidePanelProps {
  activeView?: string;
  visible?: boolean;
  contextualActions?: ContextualAction[];
  messages?: GuideMessage[];
  setMessages?: React.Dispatch<React.SetStateAction<GuideMessage[]>>;
  loading?: boolean;
  setLoading?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function AIGuidePanel({
  activeView: _activeView,
  visible = true,
  contextualActions = [],
  messages: externalMessages,
  setMessages: setExternalMessages,
  loading: externalLoading,
  setLoading: setExternalLoading,
}: AIGuidePanelProps) {
  const [internalMessages, setInternalMessages] = useState<GuideMessage[]>([]);
  const [internalLoading, setInternalLoading] = useState(false);
  const [distractionOpen, setDistractionOpen] = useState(false);

  const messages = externalMessages ?? internalMessages;
  const setMessages = setExternalMessages ?? setInternalMessages;
  const loading = externalLoading ?? internalLoading;
  const setLoading = setExternalLoading ?? setInternalLoading;

  const { metrics } = useGuideStatus();
  const { save: parkThought } = useParkDistraction();

  const handleSend = useCallback(
    async (text: string) => {
      setMessages((prev) => [...prev, { role: "user", content: text }]);
      setLoading(true);
      try {
        const res = await sendGuideCommand(text);
        const reply =
          res.reply ??
          (res.status === "ok" ? "Done." : "Something went wrong — try again.");
        setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to send command";
        setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
      } finally {
        setLoading(false);
      }
    },
    [setMessages, setLoading]
  );

  const handlePark = useCallback(
    async (text: string) => {
      try {
        await parkThought(text);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Parked — I'll keep that thought safe for later." },
        ]);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to park thought";
        setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
        throw e;
      }
    },
    [parkThought, setMessages]
  );

  if (!visible) return null;

  return (
    <div className="flex h-full flex-col rounded-xl border-0 bg-surface lg:rounded-none lg:border-0">
      <div className="border-b border-border px-3 py-2">
        <h2 className="text-sm font-semibold text-text">Signal Guide</h2>
      </div>
      <StatusBanner metrics={metrics} />
      {contextualActions.length > 0 && (
        <div className="border-b border-border p-3">
          <ContextualActions actions={contextualActions} />
        </div>
      )}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.length === 0 && !loading && (
          <p className="py-8 text-center text-sm text-muted">
            Ask anything — search your library, capture a thought, or check status.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div
              className={`inline-block max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "bg-accent text-white" : "border border-border bg-muted/30 text-text"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-muted">Thinking...</div>}
      </div>
      <CommandBar
        onSend={handleSend}
        onPark={() => setDistractionOpen(true)}
        loading={loading}
      />
      <DistractionGate
        open={distractionOpen}
        onClose={() => setDistractionOpen(false)}
        onSave={handlePark}
      />
    </div>
  );
}
