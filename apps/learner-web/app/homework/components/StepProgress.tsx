/**
 * StepProgress - Visual progress indicator for homework wizard
 * 
 * Accessible, keyboard-navigable progress bar with step labels.
 */

"use client";

import type { HomeworkSessionStatus } from "@aivo/api-client/src/homework-contracts";

interface StepProgressProps {
  steps: HomeworkSessionStatus[];
  currentStep: number;
  labels: Record<HomeworkSessionStatus, string>;
}

export function StepProgress({ steps, currentStep, labels }: StepProgressProps) {
  return (
    <nav aria-label="Homework progress">
      <ol className="flex items-center justify-between" role="list">
        {steps.map((step, index) => {
          const isComplete = index < currentStep;
          const isCurrent = index === currentStep;
          const isPending = index > currentStep;

          return (
            <li
              key={step}
              className="flex-1 relative"
              aria-current={isCurrent ? "step" : undefined}
            >
              {/* Connector line */}
              {index > 0 && (
                <div
                  className={`absolute left-0 top-4 -translate-x-1/2 w-full h-0.5 ${
                    isComplete ? "bg-mint" : "bg-slate-200"
                  }`}
                  aria-hidden="true"
                />
              )}

              {/* Step indicator */}
              <div className="relative flex flex-col items-center group">
                <div
                  className={`
                    w-8 h-8 rounded-full flex items-center justify-center
                    transition-all duration-200 z-10
                    ${isComplete
                      ? "bg-mint text-white"
                      : isCurrent
                      ? "bg-primary-600 text-white ring-4 ring-primary-100"
                      : "bg-slate-200 text-slate-500"
                    }
                  `}
                >
                  {isComplete ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${isComplete
                      ? "text-mint-dark"
                      : isCurrent
                      ? "text-primary-700"
                      : "text-slate-400"
                    }
                  `}
                >
                  {labels[step]}
                </span>

                {/* Current step indicator */}
                {isCurrent && (
                  <span className="sr-only">(Current step)</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {/* Screen reader progress summary */}
      <div className="sr-only" aria-live="polite">
        Step {currentStep + 1} of {steps.length}: {labels[steps[currentStep]]}
      </div>
    </nav>
  );
}
