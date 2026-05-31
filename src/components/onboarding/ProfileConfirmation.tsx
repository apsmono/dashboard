/**
 * ProfileConfirmation — Step 2 of the onboarding wizard.
 *
 * Shows the parsed profile bullets (role, pain points, suggested apps)
 * and lets the user confirm or return to edit.
 */

import { Button } from "@/components/ui/Button";
import type { ProfileData } from "./types";

interface ProfileConfirmationProps {
  profile: ProfileData;
  onConfirm: () => void;
  onEdit: (text: string) => void;
  identityText: string;
}

export function ProfileConfirmation({ profile, onConfirm, onEdit, identityText }: ProfileConfirmationProps) {
  return (
    <div>
      <div className="flex items-start justify-between mb-3">
        <h2 className="text-base font-semibold text-text">Here's what I understood</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(identityText)}
          className="text-muted hover:text-text -mt-0.5"
        >
          Edit
        </Button>
      </div>

      <div className="bg-card border border-border rounded-lg p-4">
        <ul className="space-y-2">
          {profile.role && (
            <li className="flex gap-2 text-sm text-text">
              <span className="text-accent font-bold shrink-0">&bull;</span>
              <span>
                <span className="text-muted">Role: </span>
                {profile.role}
              </span>
            </li>
          )}
          {profile.pain_points.length > 0 && (
            <li className="flex gap-2 text-sm text-text">
              <span className="text-accent font-bold shrink-0">&bull;</span>
              <span>
                <span className="text-muted">Pain points: </span>
                {profile.pain_points.join(", ")}
              </span>
            </li>
          )}
          {profile.suggested_apps.length > 0 && (
            <li className="flex gap-2 text-sm text-text">
              <span className="text-accent font-bold shrink-0">&bull;</span>
              <span>
                <span className="text-muted">Suggested apps: </span>
                {profile.suggested_apps.join(", ")}
              </span>
            </li>
          )}
        </ul>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mt-4"
        onClick={onConfirm}
      >
        That looks right — Continue
      </Button>
    </div>
  );
}
