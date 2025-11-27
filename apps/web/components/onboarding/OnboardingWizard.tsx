"use client";

import React from "react";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import type { OnboardingStepId, OnboardingStep } from "@aivo/types";

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface OnboardingProgressBarProps {
  className?: string;
  showStepCount?: boolean;
  showPercentage?: boolean;
}

export function OnboardingProgressBar({
  className = "",
  showStepCount = true,
  showPercentage = false,
}: OnboardingProgressBarProps) {
  const { progress, isLoading } = useOnboarding();

  if (isLoading || !progress) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-2 bg-gray-200 rounded-full" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1 text-sm">
        {showStepCount && (
          <span className="text-gray-600">
            Step {progress.currentStep} of {progress.totalSteps}
          </span>
        )}
        {showPercentage && (
          <span className="text-gray-600">{progress.progress}%</span>
        )}
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      </div>
      {progress.estimatedTimeRemaining > 0 && (
        <p className="mt-1 text-xs text-gray-500">
          ~{progress.estimatedTimeRemaining} min remaining
        </p>
      )}
    </div>
  );
}

// =============================================================================
// STEP INDICATOR
// =============================================================================

interface OnboardingStepIndicatorProps {
  className?: string;
  orientation?: "horizontal" | "vertical";
}

export function OnboardingStepIndicator({
  className = "",
  orientation = "horizontal",
}: OnboardingStepIndicatorProps) {
  const { state, currentStep, goToStep } = useOnboarding();

  if (!state) return null;

  const isVertical = orientation === "vertical";
  const containerClass = isVertical
    ? "flex flex-col space-y-4"
    : "flex items-center space-x-2";

  return (
    <div className={`${containerClass} ${className}`}>
      {state.steps.map((step, index) => {
        const isCurrent = currentStep?.id === step.id;
        const isCompleted = step.isCompleted;
        const isSkipped = step.isSkipped;
        const canNavigate = isCompleted || isSkipped;

        return (
          <React.Fragment key={step.id}>
            {/* Connector line (before each step except first) */}
            {index > 0 && !isVertical && (
              <div
                className={`flex-1 h-0.5 ${
                  isCompleted || isSkipped ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}

            {/* Step circle/indicator */}
            <button
              onClick={() => canNavigate && goToStep(step.id)}
              disabled={!canNavigate}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                transition-all duration-200
                ${isCurrent
                  ? "bg-blue-600 text-white ring-4 ring-blue-100"
                  : isCompleted
                    ? "bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
                    : isSkipped
                      ? "bg-gray-400 text-white cursor-pointer hover:bg-gray-500"
                      : "bg-gray-200 text-gray-600"
                }
              `}
              title={step.title}
            >
              {isCompleted ? (
                <CheckIcon className="w-4 h-4" />
              ) : isSkipped ? (
                <SkipIcon className="w-4 h-4" />
              ) : (
                index + 1
              )}
            </button>

            {/* Step label (vertical only) */}
            {isVertical && (
              <div className="ml-3">
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-blue-600" : "text-gray-700"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// =============================================================================
// STEP CONTAINER
// =============================================================================

interface OnboardingStepContainerProps {
  stepId: OnboardingStepId;
  children: React.ReactNode;
  className?: string;
}

export function OnboardingStepContainer({
  stepId,
  children,
  className = "",
}: OnboardingStepContainerProps) {
  const { currentStep } = useOnboarding();

  if (currentStep?.id !== stepId) {
    return null;
  }

  return <div className={className}>{children}</div>;
}

// =============================================================================
// NAVIGATION BUTTONS
// =============================================================================

interface OnboardingNavigationProps {
  className?: string;
  onComplete?: () => void;
  showSkip?: boolean;
  nextLabel?: string;
  skipLabel?: string;
  completeLabel?: string;
}

export function OnboardingNavigation({
  className = "",
  onComplete,
  showSkip = true,
  nextLabel = "Continue",
  skipLabel = "Skip",
  completeLabel = "Get Started",
}: OnboardingNavigationProps) {
  const { currentStep, progress, completeStep, skipStep, isComplete, state } = useOnboarding();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  if (!currentStep || !progress) return null;

  const isLastStep = progress.currentStep === progress.totalSteps;
  const canSkip = showSkip && !currentStep.isRequired;

  const handleNext = async () => {
    setIsSubmitting(true);
    try {
      await completeStep(currentStep.id);
      if (isLastStep && onComplete) {
        onComplete();
      }
    } catch (err) {
      console.error("Error completing step:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await skipStep(currentStep.id);
    } catch (err) {
      console.error("Error skipping step:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div>
        {canSkip && (
          <button
            onClick={handleSkip}
            disabled={isSubmitting}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
          >
            {skipLabel}
          </button>
        )}
      </div>
      <button
        onClick={handleNext}
        disabled={isSubmitting}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <span className="flex items-center">
            <LoadingSpinner className="w-4 h-4 mr-2" />
            Processing...
          </span>
        ) : isLastStep ? (
          completeLabel
        ) : (
          nextLabel
        )}
      </button>
    </div>
  );
}

// =============================================================================
// MAIN WIZARD COMPONENT
// =============================================================================

interface OnboardingWizardProps {
  children: React.ReactNode;
  className?: string;
  onComplete?: () => void;
  showProgress?: boolean;
  showStepIndicator?: boolean;
}

export function OnboardingWizard({
  children,
  className = "",
  onComplete,
  showProgress = true,
  showStepIndicator = true,
}: OnboardingWizardProps) {
  const { isLoading, error, isComplete, state } = useOnboarding();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8 text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <p>Error loading onboarding: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-100 rounded-lg hover:bg-red-200"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <CheckIcon className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">All Set!</h2>
        <p className="mt-2 text-gray-600">You&apos;ve completed the onboarding.</p>
        {onComplete && (
          <button
            onClick={onComplete}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue to App
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`max-w-2xl mx-auto ${className}`}>
      {showProgress && (
        <OnboardingProgressBar className="mb-6" />
      )}
      
      {showStepIndicator && (
        <OnboardingStepIndicator className="mb-8" />
      )}

      <div className="bg-white rounded-xl shadow-sm border p-6">
        {children}
      </div>

      <OnboardingNavigation className="mt-6" onComplete={onComplete} />
    </div>
  );
}

// =============================================================================
// ICONS
// =============================================================================

function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function SkipIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
    </svg>
  );
}

function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  CheckIcon as OnboardingCheckIcon,
  SkipIcon as OnboardingSkipIcon,
  LoadingSpinner as OnboardingLoadingSpinner,
};
