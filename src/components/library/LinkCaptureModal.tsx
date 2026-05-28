import { useState, useCallback, useRef, useEffect } from "react";
import { X, Link2, Loader2, AlertCircle, CheckCircle, Globe, Play, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLinkPreview, useDuplicateCheck, useSaveLink } from "@/hooks/useApi";

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

  const { state: previewState, fetchPreview, reset: resetPreview } = useLinkPreview();
  const { isDuplicate, checking: checkingDup, check: checkDup, reset: resetDup } = useDuplicateCheck();
  const { save, saving, error: saveError, reset: resetSave } = useSaveLink();

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUrlChange = useCallback(
    (value: string) => {
      setUrl(value);
      resetPreview();
      resetDup();
      setStep("input");

      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (isValidUrl(value)) {
        debounceRef.current = setTimeout(() => {
          checkDup(value);
        }, 400);
      }
    },
    [resetPreview, resetDup, checkDup]
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

  const handleSave = useCallback(async () => {
    if (!isValidUrl(url)) return;
    setStep("saving");
    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      await save(url, tags, status);
      setStep("done");
      setTimeout(() => {
        onSaved?.();
        onClose();
      }, 800);
    } catch {
      setStep("preview");
    }
  }, [url, tagsInput, status, save, onSaved, onClose]);

  const previewData = previewState.status === "success" ? previewState.data : null;

  // Reset all state when modal is reopened
  useEffect(() => {
    if (open) {
      setUrl("");
      setTagsInput("");
      setStatus("to-read");
      setStep("input");
      resetPreview();
      resetDup();
      resetSave();
    }
  }, [open, resetPreview, resetDup, resetSave]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
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
