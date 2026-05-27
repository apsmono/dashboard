import { useState } from "react";
import { X, Link2, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { sendCommand, checkDuplicateUrl } from "@/lib/api";

interface LinkCaptureModalProps {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export function LinkCaptureModal({ open, onClose, onSaved }: LinkCaptureModalProps) {
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState(false);

  if (!open) return null;

  const handleCheckDuplicate = async () => {
    if (!url.trim().startsWith("http")) return;
    const isDup = await checkDuplicateUrl(url.trim());
    setDuplicate(isDup);
  };

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("Please enter a URL.");
      return;
    }
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("URL must start with http:// or https://");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const isDup = await checkDuplicateUrl(trimmed);
      if (isDup) {
        setDuplicate(true);
        setLoading(false);
        return;
      }
      setDuplicate(false);

      const commandText = `article: ${trimmed}`;
      const result = await sendCommand(commandText);
      if (result.status === "ok") {
        setSuccess(result.reply || "Link saved to library.");
        setUrl("");
        setTags("");
        onSaved?.();
      } else {
        setError(result.reply || "Failed to save link.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Link2 size={18} className="text-accent" />
            Save Link to Library
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-muted hover:text-text hover:bg-surface transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-muted">URL</label>
            <Input
              type="url"
              placeholder="https://example.com/article"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setDuplicate(false);
                setError(null);
              }}
              onBlur={handleCheckDuplicate}
              disabled={loading}
            />
            {duplicate && (
              <div className="mt-1 flex items-center gap-1 text-sm text-amber-500">
                <AlertCircle size={14} />
                This URL already exists in the library.
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-muted">Tags (optional)</label>
            <Input
              placeholder="ai, research, tutorial"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-muted">Comma-separated tags</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-banner-error-bg px-3 py-2 text-sm text-danger">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
              <CheckCircle size={14} />
              {success}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading || duplicate}>
              {loading ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save to Library"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
