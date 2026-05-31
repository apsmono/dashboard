/**
 * OnboardingWizard — 3-step wizard container for Signal onboarding.
 *
 * Step flow:
 *   1. IdentityBox          — free-text input + AI parse
 *   2. ProfileConfirmation  — review parsed profile
 *   2b. AppConnectStep      — connect relevant apps (sub-step within Step 2)
 *   3. InstantWinDigest     — first 3-bullet digest + "Get started"
 *
 * The step indicator shows 3 dots (logical steps). Steps 2 and 2b both
 * show dot 2 as the active/current step.
 */

import { useState } from "react";
import { StepIndicator } from "./StepIndicator";
import { IdentityBox } from "./IdentityBox";
import { ProfileConfirmation } from "./ProfileConfirmation";
import { AppConnectStep } from "./AppConnectStep";
import { InstantWinDigest } from "./InstantWinDigest";
import type { OnboardingStep, ProfileData } from "./types";

// Internal sub-step: 2 = ProfileConfirmation, "2b" = AppConnectStep
type WizardSubStep = OnboardingStep | "2b";

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
  // Track the sub-step between ProfileConfirmation (2) and AppConnectStep (2b)
  const [subStep, setSubStep] = useState<WizardSubStep>(step);

  // Sync external step changes into subStep (e.g. when hook resets to step 1)
  const effectiveStep: WizardSubStep =
    step === 1 ? 1 : step === 3 ? 3 : subStep;

  // Map internal sub-step to the indicator's logical step (1 | 2 | 3)
  const indicatorStep: OnboardingStep =
    effectiveStep === 1 ? 1 : effectiveStep === 3 ? 3 : 2;

  function handleConfirmProfile() {
    // ProfileConfirmation confirmed — advance to app connect sub-step
    setSubStep("2b");
    onStepChange(2); // stay at external step 2 until digest
  }

  function handleAppConnected() {
    // AppConnect done (connected or skipped) — advance to digest
    setSubStep(3);
    onStepChange(3);
  }

  function handleSkipApps() {
    setSubStep(3);
    onStepChange(3);
  }

  return (
    <section
      className="flex items-center justify-center min-h-[60vh]"
      aria-label="Onboarding"
    >
      <div className="bg-card border border-border rounded-xl p-6 lg:p-8 shadow-sm max-w-[560px] w-full">
        <StepIndicator current={indicatorStep} total={3} />

        <div
          className="transition-all duration-300 ease-out"
          style={{
            opacity: 1,
            transform: "translateY(0)",
          }}
        >
          {effectiveStep === 1 && (
            <IdentityBox
              initialText={identityText}
              onProfileParsed={onProfileParsed}
              onNext={() => {
                setSubStep(2);
                onStepChange(2);
              }}
              onTextChange={onIdentityTextChange}
            />
          )}

          {effectiveStep === 2 && profile && (
            <ProfileConfirmation
              profile={profile}
              onConfirm={handleConfirmProfile}
              onEdit={(text) => {
                onIdentityTextChange(text);
                setSubStep(1);
                onStepChange(1);
              }}
              identityText={identityText}
            />
          )}

          {effectiveStep === 2 && !profile && (
            // Fallback: profile not yet set — go back to step 1
            <IdentityBox
              initialText={identityText}
              onProfileParsed={onProfileParsed}
              onNext={() => {
                setSubStep(2);
                onStepChange(2);
              }}
              onTextChange={onIdentityTextChange}
            />
          )}

          {effectiveStep === "2b" && profile && (
            <AppConnectStep
              suggestedApps={profile.suggested_apps}
              onSkip={handleSkipApps}
              onConnected={handleAppConnected}
            />
          )}

          {effectiveStep === "2b" && !profile && (
            // Fallback: no profile — skip directly to digest
            <AppConnectStep
              suggestedApps={[]}
              onSkip={handleSkipApps}
              onConnected={handleAppConnected}
            />
          )}

          {effectiveStep === 3 && (
            <InstantWinDigest profile={profile} onComplete={onComplete} />
          )}
        </div>
      </div>
    </section>
  );
}
