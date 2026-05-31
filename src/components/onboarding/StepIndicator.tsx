/**
 * StepIndicator — displays a row of dots showing wizard progress.
 */

import type { OnboardingStep } from "./types";

interface StepIndicatorProps {
  current: OnboardingStep;
  total: number;
}

export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center justify-between mb-6"
      aria-label={`Step ${current} of ${total}`}
    >
      <div className="flex items-center gap-2">
        {Array.from({ length: total }, (_, i) => {
          const step = i + 1;
          const isCompleted = step < current;
          const isActive = step === current;
          return (
            <div key={step} className="flex items-center">
              <div
                className={`w-3 h-3 rounded-full transition-colors duration-200 ${
                  isCompleted
                    ? "bg-success"
                    : isActive
                    ? "bg-accent"
                    : "bg-border"
                }`}
                aria-hidden="true"
              />
              {step < total && (
                <div className="w-8 h-px bg-border mx-1" aria-hidden="true" />
              )}
            </div>
          );
        })}
      </div>
      <span className="text-xs text-muted">
        Step {current} of {total}
      </span>
    </div>
  );
}
