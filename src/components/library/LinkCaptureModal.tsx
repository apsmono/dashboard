import { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Link2,
  Loader2,
  AlertCircle,
  CheckCircle,
  Globe,
  Play,
  GitBranch,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useLinkPreview, useDuplicateCheck, useSaveLink, useYouTubeTranscript } from "@/hooks/useApi";

interface LinkCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

function isValidUrl(text: string): boolean {
  try {
    const u = new URL(text);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function platformIcon(platform: string) {
  if (platform === "youtube") return <Play size={16} className="text-danger" />;
  if (platform === "github") return <GitBranch size={16} className="text-text" />;
  return <Globe size={16} className="text-muted" />;
}

export function LinkCaptureModal({ open, onClose, onSaved }: LinkCaptureModalProps) {
  const [url, setUrl] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("to-read");
  const [step, setStep] = useState<"input" | "preview" | "saving" | "done">("input");
  const [notes, setNotes] = useState("");
  const [transcriptExpanded, setTranscriptExpanded] = useState(false);

  const { state: previewState, fetchPreview, reset: resetPreview } = useLinkPreview();
  const { isDuplicate, checking: checkingDup, check: checkDup, reset: resetDup } = useDuplicateCheck();
  const { save, saving, error: saveError, reset: resetSave } = useSaveLink();
  const { state: transcriptState, fetchTranscript, reset: resetTranscript } = useYouTubeTranscript();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isYouTube = previewState.status === "success" && previewState.data.platform === "youtube";

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      resetPreview();
      resetDup();
      resetTranscript();
      setStep("input");
      setNotes("");
      setTranscriptExpanded(false);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isValidUrl(value)) {
        debounceRef.current = setTimeout(() => {
          checkDup(value);
        }, 400);
      }
    },
    [resetPreview, resetDup, resetTranscript, checkDup]
  );

  const handleFetchPreview = useCallback(async () => {
    if (!isValidUrl(url)) return;
    setStep("preview");
    try {
      await fetchPreview(url);
    } catch {
      // error handled in state
    }
  }, [url, fetchPreview]);

  const handleFetchTranscript = useCallback(async () => {
    if (!isValidUrl(url)) return;
    try {
      await fetchTranscript(url);
    } catch {
      // error handled in state
    }
  }, [url, fetchTranscript]);

  const handleSave = useCallback(async () => {
    if (!isValidUrl(url)) return;
    setStep("saving");
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Build command with transcript and notes metadata
    const commandParts = [`article: ${url}`];
    if (tags.length > 0) commandParts.push(`tags: ${tags.join(", ")}`);
    if (status) commandParts.push(`status: ${status}`);
    if (transcriptState.status === "success") commandParts.push("transcript: true");
    if (notes.trim()) commandParts.push(`notes: ${notes.trim()}`);

    try {
      await save(url, tags, status, commandParts.join("\n"));
      setStep("done");
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 800);
    } catch {
      setStep("preview");
    }
  }, [url, tagsInput, status, notes, transcriptState, save, onSaved, onClose]);

  const previewData = previewState.status === "success" ? previewState.data : null;

  // Reset all state when modal is reopened
  useEffect(() => {
    if (open) {
      setUrl("");
      setTagsInput("");
      setStatus("to-read");
      setStep("input");
      setNotes("");
      setTranscriptExpanded(false);
      resetPreview();
      resetDup();
      resetSave();
      resetTranscript();
    }
  }, [open, resetPreview, resetDup, resetSave, resetTranscript]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Link2 size={18} className="text-accent" />
            Save Link to Library
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted transition-colors hover:bg-surface hover:text-text"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          {/* URL Input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">URL</label>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              disabled={step === "saving" || step === "done"}
            />
            {!isValidUrl(url) && url.length > 0 && (
              <p className="mt-1 text-xs text-danger">Please enter a valid URL.</p>
            )}
            {isDuplicate === true && (
              <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                <AlertCircle size={12} />
                This URL is already in your library.
              </p>
            )}
            {checkingDup && (
              <p className="mt-1 flex items-center gap-1 text-xs text-muted">
                <Loader2 size={12} className="animate-spin" />
                Checking for duplicates…
              </p>
            )}
          </div>

          {/* Fetch Preview Button */}
          {step === "input" && (
            <Button
              onClick={handleFetchPreview}
              disabled={!isValidUrl(url) || previewState.status === "loading"}
              className="w-full"
            >
              {previewState.status === "loading" ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Fetching preview…
                </span>
              ) : (
                "Fetch & Preview"
              )}
            </Button>
          )}

          {/* Preview & Save */}
          {(step === "preview" || step === "saving" || step === "done") && (
            <div className="space-y-4">
              {previewState.status === "loading" && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Fetching preview…
                </div>
              )}

              {previewState.status === "error" && (
                <div className="rounded-lg border border-danger bg-banner-error-bg px-3 py-2 text-sm text-banner-error-text">
                  {previewState.message}
                </div>
              )}

              {previewData && (
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="mb-1 flex items-center gap-2">
                    {platformIcon(previewData.platform)}
                    <span className="text-xs capitalize text-muted">{previewData.platform}</span>
                  </div>
                  <h3 className="mb-1 text-sm font-medium text-text">{previewData.title}</h3>
                  {previewData.description && (
                    <p className="line-clamp-3 text-xs text-muted">{previewData.description}</p>
                  )}
                  {previewData.author && (
                    <p className="mt-1 text-xs text-muted">By {previewData.author}</p>
                  )}
                </div>
              )}

              {/* YouTube Transcript */}
              {isYouTube && (
                <div className="rounded-lg border border-border bg-surface p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-accent" />
                      <span className="text-sm font-medium text-text">Transcript</span>
                      {transcriptState.status === "success" && (
                        <Badge variant="default">
                          EN · Auto
                        </Badge>
                      )}
                    </div>
                    {transcriptState.status === "idle" && (
                      <Button size="sm" variant="ghost" onClick={handleFetchTranscript}>
                        Fetch
                      </Button>
                    )}
                    {transcriptState.status === "loading" && (
                      <Loader2 size={14} className="animate-spin text-muted" />
                    )}
                  </div>

                  {transcriptState.status === "error" && (
                    <p className="mt-2 text-xs text-muted">
                      {transcriptState.message} — you can still save without it.
                    </p>
                  )}

                  {transcriptState.status === "success" && (
                    <div className="mt-2">
                      <div
                        className={`text-xs text-muted font-mono bg-black/20 rounded p-2 overflow-y-auto ${
                          transcriptExpanded ? "max-h-[300px]" : "max-h-[80px]"
                        }`}
                      >
                        {transcriptState.data.transcript}
                      </div>
                      <button
                        onClick={() => setTranscriptExpanded((v) => !v)}
                        className="mt-1 flex items-center gap-1 text-xs text-accent hover:underline"
                      >
                        {transcriptExpanded ? (
                          <>
                            <ChevronUp size={12} /> Show less
                          </>
                        ) : (
                          <>
                            <ChevronDown size={12} /> Show more
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* My Notes */}
              <div>
                <label className="mb-1 block text-xs font-medium text-muted">My Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Jot down key takeaways, quotes, or thoughts…"
                  className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent resize-y"
                  disabled={step === "saving" || step === "done"}
                />
              </div>

              {/* Tags & Status */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Tags (optional)</label>
                  <Input
                    placeholder="ai, research, tutorial"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    disabled={step === "saving" || step === "done"}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
                    disabled={step === "saving" || step === "done"}
                  >
                    <option value="to-read">To Read</option>
                    <option value="reading">Reading</option>
                    <option value="done">Done</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Save Button */}
              {step !== "done" && (
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-success/10 text-success hover:bg-success/20 border-success"
                >
                  {saving ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={14} className="animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    "Save to Library"
                  )}
                </Button>
              )}

              {saveError && (
                <div className="rounded-lg border border-danger bg-banner-error-bg px-3 py-2 text-sm text-banner-error-text">
                  {saveError}
                </div>
              )}

              {step === "done" && (
                <div className="flex items-center justify-center gap-2 rounded-lg border border-success bg-success/10 py-3 text-sm font-medium text-success">
                  <CheckCircle size={16} />
                  Saved successfully!
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
