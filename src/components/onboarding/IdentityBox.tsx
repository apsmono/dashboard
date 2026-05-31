/**
 * IdentityBox — Step 1 of the onboarding wizard.
 *
 * Accepts free-text description from the user and calls parseIdentity().
 * Handles AI follow-up (D-01): if needs_followup=true on first submission,
 * shows the follow-up question and waits for a second response before parsing.
 */

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { parseIdentity } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import type { ProfileData } from "./types";

interface IdentityBoxProps {
  initialText?: string;
  onProfileParsed: (profile: ProfileData) => void;
  onNext: () => void;
  onTextChange?: (text: string) => void;
}

export function IdentityBox({ initialText = "", onProfileParsed, onNext, onTextChange }: IdentityBoxProps) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);
  const [followupQuestion, setFollowupQuestion] = useState<string | null>(null);
  const [hasFollowup, setHasFollowup] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTextChange(value: string) {
    setText(value);
    onTextChange?.(value);
  }

  async function handleSubmit() {
    if (!text.trim()) return;
    setError(null);
    setLoading(true);

    try {
      const res = await parseIdentity(text.trim());

      // CR-01 frontend guard: reject non-ok or empty profile — stay on Step 1
      if (res.status !== "ok" || !res.profile) {
        setError("I couldn't analyze that right now. Please try again.");
        return;
      }

      const parsed = res.profile as ProfileData;

      if (parsed.needs_followup && !hasFollowup) {
        // Show follow-up question — user will submit again
        setFollowupQuestion(parsed.followup_question || "Could you tell me a bit more about what you do?");
        setHasFollowup(true);
        return;
      }

      // Either no follow-up needed, or this is the second submission
      onProfileParsed(parsed);
      onNext();
    } catch {
      // parseIdentity rejects on non-2xx (e.g. 502 from backend) — surface the error
      setError("I couldn't analyze that right now. Please try again.");
    } finally {
      // CR-02: reset loading on every exit path (success, follow-up, error)
      setLoading(false);
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-text mb-2">Welcome to Signal</h2>
      <p className="text-sm text-muted mb-6">
        Tell me what you do and what overwhelms you. I'll set things up.
      </p>

      {error && (
        <p className="text-sm text-red-500 mb-4">{error}</p>
      )}

      {followupQuestion && (
        <div className="bg-surface border border-border rounded-lg p-4 mb-4 flex gap-3">
          <Sparkles size={16} className="text-accent mt-0.5 shrink-0" aria-hidden="true" />
          <p className="text-sm text-text">{followupQuestion}</p>
        </div>
      )}

      <textarea
        value={text}
        onChange={(e) => handleTextChange(e.target.value)}
        placeholder="I run a small design agency. I'm constantly drowning in client emails, and I use Notion for project tracking and Google Drive for assets..."
        className="w-full min-h-[120px] p-4 text-sm bg-input-bg border border-border rounded-lg resize-none text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-colors"
        aria-label="Describe what you do and what overwhelms you"
        disabled={loading}
      />

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-4"
        onClick={handleSubmit}
        disabled={!text.trim() || loading}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Analyzing...
          </span>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}
