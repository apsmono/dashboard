/**
 * Shared types for the Signal onboarding wizard.
 */

export interface ProfileData {
  role: string;
  pain_points: string[];
  suggested_apps: string[];
  context_templates: string[];
  needs_followup: boolean;
  followup_question: string;
  onboarding_step?: number;
  connected_apps?: string[];
}

export type OnboardingStep = 1 | 2 | 3;

export type OnboardingState = "loading" | "onboarding" | "complete";
