import { useState, useEffect, useCallback } from "react";
import { X, Save, Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { LibraryEntry } from "@/types";

interface EntryEditorProps {
  entry: LibraryEntry;
  onSave: (updates: {
    title: string;
    markdown: string;
    tags: string[];
    status: string;
    notes?: string;
  }) => void;
  onCancel: () => void;
  saving?: boolean;
}

const STATUS_OPTIONS = ["active", "to-read", "reading", "done", "archived", "draft"];

export function EntryEditor({ entry, onSave, onCancel, saving }: EntryEditorProps) {
  const [title, setTitle] = useState(entry.title);
  const [markdown, setMarkdown] = useState(entry.markdown ?? "");
  const [tagInput, setTagInput] = useState(entry.tags.join(", "));
  const [status, setStatus] = useState(entry.status);
  const [notes, setNotes] = useState("");

  // Reset when entry changes
  useEffect(() => {
    setTitle(entry.title);
    setMarkdown(entry.markdown ?? "");
    setTagInput(entry.tags.join(", "));
    setStatus(entry.status);
    setNotes("");
  }, [entry.id]);

  const handleSave = useCallback(() => {
    const tags = tagInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onSave({ title, markdown, tags, status, notes: notes || undefined });
  }, [title, markdown, tagInput, status, notes, onSave]);

  const tagList = tagInput
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
        />
      </div>

      {/* Tags + Status */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Tags</label>
          <div className="relative">
            <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="ai, research, tutorial"
              className="w-full rounded-lg border border-border bg-input-bg pl-9 pr-3 py-2 text-sm text-text outline-none focus:border-accent"
            />
          </div>
          {tagList.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {tagList.map((t) => (
                <Badge key={t} variant="default">
                  {t}
                </Badge>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Markdown */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Content (Markdown)</label>
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm font-mono text-text outline-none focus:border-accent resize-y"
        />
      </div>

      {/* Notes (append-only for now) */}
      <div>
        <label className="mb-1 block text-xs font-medium text-muted">Append Notes (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Add new notes that will be appended under '## My Notes'"
          className="w-full rounded-lg border border-border bg-input-bg px-3 py-2 text-sm text-text outline-none focus:border-accent resize-y"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
          <X size={14} className="mr-1" />
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="bg-success/10 text-success hover:bg-success/20 border-success"
        >
          {saving ? (
            <span className="flex items-center gap-1">
              <Loader2 size={14} className="animate-spin" />
              Saving…
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Save size={14} />
              Save Changes
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
