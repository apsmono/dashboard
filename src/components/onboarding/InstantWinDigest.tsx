/**
 * InstantWinDigest — Step 3 of the onboarding wizard.
 *
 * Shows the owner's first 3-bullet digest. The preview/live label is driven
 * by the backend `mode` flag returned from GET /api/v1/onboarding/digest:
 *   - mode="live"    → real data was fetched; label "Your first digest" / "Last 24 hours"
 *   - mode="preview" → cold-start capability preview; label "Preview" / "What Signal will do for you"
 * This closes SC-3 / ONB-04 (honest labeling) and WR-02 (unsafe profile cast removed).
 * Per D-12, D-13, D-14, D-15.
 */

import { useEffect, useState } from "react";
import { Sparkles, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { fetchDigest } from "@/lib/api";
import type { ProfileData } from "./types";

interface InstantWinDigestProps {
  profile: ProfileData | null;
  onComplete: () => void;
}

const FALLBACK_BULLETS = [
  "Signal will compress your streams into daily insights.",
  "Connected apps will be monitored for important updates.",
  "Your personalized digest will appear here.",
];

export function InstantWinDigest({ profile: _profile, onComplete }: InstantWinDigestProps) {
  const [bullets, setBullets] = useState<string[]>([]);
  const [mode, setMode] = useState<"live" | "preview">("preview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await fetchDigest();
        if (!cancelled) {
          setBullets((data.bullets ?? []).slice(0, 3));
          setMode(data.mode ?? "preview");
          setLoading(false);
          // Trigger entrance animation after a tick
          requestAnimationFrame(() => setVisible(true));
        }
      } catch {
        if (!cancelled) {
          // On error, keep mode="preview" (fallback content is not live data)
          setError(true);
          setBullets(FALLBACK_BULLETS);
          setLoading(false);
          requestAnimationFrame(() => setVisible(true));
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <Loader2 size={24} className="animate-spin text-accent" />
        <p className="text-sm text-muted">Building your first digest…</p>
      </div>
    );
  }

  const isPreview = mode === "preview";

  // Ensure exactly 3 bullets
  const displayBullets = bullets.length >= 3 ? bullets.slice(0, 3) : [
    ...bullets,
    ...FALLBACK_BULLETS.slice(bullets.length),
  ];

  return (
    <div
      className="flex flex-col gap-4"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "scale(1)" : "scale(0.95)",
        transition: "opacity 0.5s ease-out, transform 0.5s ease-out",
      }}
    >
      {isPreview && (
        <p className="text-xs text-muted font-medium">
          Here's what I'll do for you — connect an app to see your live 24-hour digest.
        </p>
      )}

      {error && (
        <p className="text-xs text-muted">
          I couldn't generate your digest right now. You can check back later.
        </p>
      )}

      <article
        role="article"
        className="bg-card border border-border rounded-lg p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-muted font-medium">
            <Sparkles size={14} className="text-accent" />
            {isPreview ? "Preview" : "Your first digest"}
          </span>
          <span className="text-xs text-muted">
            {isPreview ? "What Signal will do for you" : "Last 24 hours"}
          </span>
        </div>

        <ul className="flex flex-col gap-1">
          {displayBullets.map((bullet, i) => (
            <li key={i} className="text-sm text-text truncate">
              • {bullet}
            </li>
          ))}
        </ul>
      </article>

      <div className="flex items-center gap-2 mt-1">
        <CheckCircle size={20} className="text-success shrink-0" />
        <p className="text-sm text-text">
          You're all set. Signal is now watching your streams.
        </p>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-2"
        onClick={onComplete}
      >
        Get started
      </Button>
    </div>
  );
}
