/**
 * OnboardingWizard — 3-step wizard container for Signal onboarding.
 *
 * Steps:
 *   1. IdentityBox — free-text input + AI parse
 *   2. ProfileConfirmation — review parsed profile
 *   3. Placeholder for Plan 03 (App Connect + Digest)
 */

import { StepIndicator } from "./StepIndicator";
import { IdentityBox } from "./IdentityBox";
import { ProfileConfirmation } from "./ProfileConfirmation";
import type { OnboardingStep, ProfileData } from "./types";

interface OnboardingWizardProps {
  step: OnboardingStep;
  profile: ProfileData | null;
  identityText: string;
  onStepChange: (s: OnboardingStep) => void;
  onComplete: () => void;
  onProfileParsed: (p: ProfileData) => void;
  onIdentityTextChange: (t: string) => void;
}

export function OnboardingWizard({
  step,
  profile,
  identityText,
  onStepChange,
  onComplete,
  onProfileParsed,
  onIdentityTextChange,
}: OnboardingWizardProps) {
  return (
    <section
      className="flex items-center justify-center min-h-[60vh]"
      aria-label="Onboarding"
    >
      <div className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-sm max-w-[560px] w-full">
        <StepIndicator current={step} total={3} />

        <div
          className="transition-all duration-300 ease-out"
          style={{
            opacity: 1,
            transform: "translateY(0)",
          }}
        >
          {step === 1 && (
            <IdentityBox
              initialText={identityText}
              onProfileParsed={onProfileParsed}
              onNext={() => onStepChange(2)}
              onTextChange={onIdentityTextChange}
            />
          )}

          {step === 2 && profile && (
            <ProfileConfirmation
              profile={profile}
              onConfirm={() => {
                onStepChange(3);
                onComplete();
              }}
              onEdit={(text) => {
                onIdentityTextChange(text);
                onStepChange(1);
              }}
              identityText={identityText}
            />
          )}

          {step === 2 && !profile && (
            // Fallback: profile not yet set — go back to step 1
            <IdentityBox
              initialText={identityText}
              onProfileParsed={onProfileParsed}
              onNext={() => onStepChange(2)}
              onTextChange={onIdentityTextChange}
            />
          )}

          {step === 3 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted">Step 3: App Connect + Digest</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
