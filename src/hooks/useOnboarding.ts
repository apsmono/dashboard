/**
 * useOnboarding — first-run detection and wizard state management.
 *
 * On mount, calls GET /api/v1/profile to detect first-run vs. returning user.
 * Supports D-10 resume: if profile exists with onboarding_step < 3, resumes
 * from the last completed step instead of starting over.
 */

import { useState, useEffect, useCallback } from "react";
import { fetchProfile, saveProfile, saveOnboardingStep } from "@/lib/api";
import type { OnboardingState, OnboardingStep, ProfileData } from "@/components/onboarding/types";

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>("loading");
  const [onboardingStep, setOnboardingStep] = useState<OnboardingStep>(1);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [identityText, setIdentityText] = useState("");

  // D-10 resume: check profile on mount to detect first-run or in-progress onboarding
  useEffect(() => {
    let cancelled = false;

    async function checkProfile() {
      try {
        const res = await fetchProfile();
        if (cancelled) return;

        const step = res.profile.onboarding_step ?? 0;
        if (step < 3) {
          // Resume from last completed step (at least step 1)
          setOnboardingStep((Math.max(step, 1)) as OnboardingStep);
          setProfile(res.profile);
          setOnboardingState("onboarding");
        } else {
          // step >= 3: onboarding complete
          setProfile(res.profile);
          setOnboardingState("complete");
        }
      } catch (err: unknown) {
        if (cancelled) return;
        // 404 = first-run: start onboarding from step 1
        if (err instanceof Error && err.message.includes("404")) {
          setOnboardingStep(1);
          setOnboardingState("onboarding");
        } else {
          // Network error or other failure: don't block, show main dashboard
          setOnboardingState("complete");
        }
      }
    }

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, []);

  // Called when the wizard advances to a new step — persists step to backend (D-10)
  const handleStepChange = useCallback(
    async (newStep: OnboardingStep) => {
      setOnboardingStep(newStep);
      try {
        await saveOnboardingStep(newStep);
      } catch {
        // Non-blocking — local state already updated
      }
    },
    []
  );

  // Called when profile is parsed by the AI — stores in local state
  const handleProfileParsed = useCallback((parsedProfile: ProfileData) => {
    setProfile(parsedProfile);
  }, []);

  // Called on final confirm — saves full profile and marks onboarding complete
  const handleComplete = useCallback(
    async (finalProfile?: ProfileData) => {
      const profileToSave = finalProfile ?? profile;
      if (profileToSave) {
        try {
          await saveProfile({ ...profileToSave, onboarding_step: 3 });
        } catch {
          // Non-blocking
        }
      }
      setOnboardingState("complete");
    },
    [profile]
  );

  return {
    onboardingState,
    onboardingStep,
    profile,
    identityText,
    setIdentityText,
    handleStepChange,
    handleProfileParsed,
    handleComplete,
  };
}
