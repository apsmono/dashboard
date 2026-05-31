/**
 * AppConnectStep — Step 2b of the onboarding wizard.
 *
 * Shows 2-3 relevant app cards based on profile.suggested_apps.
 * Each card has a Connect button that triggers an OAuth flow.
 * The step is skippable via "Skip for now" (per D-06).
 */

import { useState } from "react";
import { Mail, Youtube, Rss, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { connectApp } from "@/lib/api";

interface AppConnectStepProps {
  suggestedApps: string[];
  onSkip: () => void;
  onConnected: () => void;
}

const APP_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  gmail: Mail,
  youtube: Youtube,
};

const APP_DESCRIPTIONS: Record<string, string> = {
  gmail: "Your emails, compressed into signals",
  youtube: "Videos you follow, distilled",
  notion: "Notes and docs, at a glance",
  gdrive: "Your files, surfaced when relevant",
  github: "PRs and issues, prioritized for you",
  telegram: "Messages that matter, highlighted",
  discord: "Server activity, condensed",
};

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function AppIcon({
  appName,
  ...props
}: {
  appName: string;
  size?: number;
  className?: string;
}) {
  const Icon = APP_ICONS[appName] ?? Rss;
  return <Icon {...props} />;
}

export function AppConnectStep({ suggestedApps, onSkip, onConnected }: AppConnectStepProps) {
  const apps = suggestedApps.slice(0, 3);

  const [connectedApps, setConnectedApps] = useState<Set<string>>(new Set());
  const [loadingApps, setLoadingApps] = useState<Set<string>>(new Set());
  const [errorApps, setErrorApps] = useState<Set<string>>(new Set());
  const [skipped, setSkipped] = useState(false);

  const canContinue = connectedApps.size > 0 || skipped;

  async function handleConnect(appName: string) {
    if (loadingApps.has(appName) || connectedApps.has(appName)) return;

    setLoadingApps((prev) => new Set(prev).add(appName));
    setErrorApps((prev) => {
      const next = new Set(prev);
      next.delete(appName);
      return next;
    });

    try {
      await connectApp(appName);
      setConnectedApps((prev) => new Set(prev).add(appName));
    } catch {
      setErrorApps((prev) => new Set(prev).add(appName));
    } finally {
      setLoadingApps((prev) => {
        const next = new Set(prev);
        next.delete(appName);
        return next;
      });
    }
  }

  function handleSkip() {
    setSkipped(true);
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-base font-semibold text-text mb-1">Connect your apps</h2>
        <p className="text-sm text-muted">
          I'll highlight the ones that matter most to you.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {apps.map((appName) => {
          const isConnected = connectedApps.has(appName);
          const isLoading = loadingApps.has(appName);
          const hasError = errorApps.has(appName);

          return (
            <div
              key={appName}
              className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
            >
              <AppIcon appName={appName} size={32} className="text-muted shrink-0" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text">{capitalize(appName)}</p>
                <p className="text-xs text-muted">
                  {APP_DESCRIPTIONS[appName] ?? "Your connected workspace"}
                </p>
                {hasError && (
                  <p className="text-xs text-danger mt-1">
                    Connection failed. Try again.
                  </p>
                )}
              </div>

              <div className="shrink-0">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1 text-sm text-success">
                    <CheckCircle size={16} />
                    Connected
                  </span>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={`Connect ${appName}`}
                    disabled={isLoading}
                    onClick={() => handleConnect(appName)}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin mr-1" />
                        Connecting...
                      </>
                    ) : (
                      "Connect"
                    )}
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {!skipped && (
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm text-muted hover:text-accent cursor-pointer mt-1 text-center w-full bg-transparent border-none"
        >
          Skip for now
        </button>
      )}

      {canContinue && (
        <Button
          variant="primary"
          size="lg"
          className="w-full mt-2"
          onClick={onConnected}
        >
          Continue
        </Button>
      )}
    </div>
  );
}
