"use client";

import React, { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type {
  OnboardingState,
  OnboardingStep,
  OnboardingStepId,
  OnboardingProgress,
  OnboardingStatus,
  GetOnboardingStatusResponse,
  CompleteStepResponse,
  SkipStepResponse,
} from "@aivo/types";

// =============================================================================
// TYPES
// =============================================================================

interface OnboardingContextValue {
  // State
  state: OnboardingState | null;
  progress: OnboardingProgress | null;
  isLoading: boolean;
  error: string | null;
  isComplete: boolean;
  currentStep: OnboardingStep | null;

  // Actions
  completeStep: (stepId: OnboardingStepId, timeSpentMs?: number, metadata?: Record<string, unknown>) => Promise<void>;
  skipStep: (stepId: OnboardingStepId, reason?: string) => Promise<boolean>;
  goToStep: (stepId: OnboardingStepId) => void;
  refresh: () => Promise<void>;
}

interface OnboardingProviderProps {
  children: ReactNode;
  /** If true, automatically redirects to onboarding page when not complete */
  redirectOnIncomplete?: boolean;
  /** Path to redirect to for onboarding */
  onboardingPath?: string;
}

// =============================================================================
// CONTEXT
// =============================================================================

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

export function OnboardingProvider({
  children,
  redirectOnIncomplete = false,
  onboardingPath = "/onboarding",
}: OnboardingProviderProps) {
  const [state, setState] = useState<OnboardingState | null>(null);
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualStepId, setManualStepId] = useState<OnboardingStepId | null>(null);

  // Fetch onboarding status
  const fetchStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/onboarding/status");
      
      if (!response.ok) {
        if (response.status === 401) {
          // Not logged in - that's okay for some pages
          setIsLoading(false);
          return;
        }
        throw new Error("Failed to fetch onboarding status");
      }

      const data: GetOnboardingStatusResponse = await response.json();
      setState(data.state);
      setProgress(data.progress);

      // Handle redirect if needed
      if (redirectOnIncomplete && !data.isComplete && typeof window !== "undefined") {
        const currentPath = window.location.pathname;
        if (!currentPath.startsWith(onboardingPath)) {
          window.location.href = onboardingPath;
        }
      }
    } catch (err) {
      console.error("Error fetching onboarding status:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [redirectOnIncomplete, onboardingPath]);

  // Complete a step
  const completeStep = useCallback(async (
    stepId: OnboardingStepId,
    timeSpentMs?: number,
    metadata?: Record<string, unknown>
  ) => {
    try {
      setError(null);

      const response = await fetch("/api/onboarding/complete-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, timeSpentMs, metadata }),
      });

      if (!response.ok) {
        throw new Error("Failed to complete step");
      }

      const data: CompleteStepResponse = await response.json();
      setState(data.state);
      setProgress(data.progress);
      setManualStepId(null); // Clear manual step navigation
    } catch (err) {
      console.error("Error completing step:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      throw err;
    }
  }, []);

  // Skip a step
  const skipStep = useCallback(async (
    stepId: OnboardingStepId,
    reason?: string
  ): Promise<boolean> => {
    try {
      setError(null);

      const response = await fetch("/api/onboarding/skip-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stepId, reason }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error === "Cannot skip required step") {
          return false;
        }
        throw new Error("Failed to skip step");
      }

      const data: SkipStepResponse = await response.json();
      setState(data.state);
      setManualStepId(null);
      return data.skipped;
    } catch (err) {
      console.error("Error skipping step:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
      return false;
    }
  }, []);

  // Navigate to a specific step (for going back)
  const goToStep = useCallback((stepId: OnboardingStepId) => {
    setManualStepId(stepId);
  }, []);

  // Refresh status
  const refresh = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Initial fetch
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Compute current step
  const currentStep = manualStepId
    ? state?.steps.find(s => s.id === manualStepId) || null
    : state?.steps.find(s => !s.isCompleted && !s.isSkipped) || null;

  const isComplete = state?.status === "COMPLETE";

  const value: OnboardingContextValue = {
    state,
    progress,
    isLoading,
    error,
    isComplete,
    currentStep,
    completeStep,
    skipStep,
    goToStep,
    refresh,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useOnboarding(): OnboardingContextValue {
  const context = useContext(OnboardingContext);
  
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }

  return context;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to check if onboarding is complete
 * Useful for protecting routes
 */
export function useOnboardingGuard(redirectPath = "/onboarding"): {
  isLoading: boolean;
  isComplete: boolean;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const response = await fetch("/api/onboarding/status");
        if (response.ok) {
          const data: GetOnboardingStatusResponse = await response.json();
          setIsComplete(data.isComplete);
          
          if (!data.isComplete && typeof window !== "undefined") {
            window.location.href = redirectPath;
          }
        }
      } catch (err) {
        console.error("Error checking onboarding:", err);
      } finally {
        setIsLoading(false);
      }
    }
    check();
  }, [redirectPath]);

  return { isLoading, isComplete };
}

/**
 * Hook to get just the onboarding progress without full state
 */
export function useOnboardingProgress(): {
  progress: number;
  isLoading: boolean;
} {
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
        const response = await window.fetch("/api/onboarding/status");
        if (response.ok) {
          const data: GetOnboardingStatusResponse = await response.json();
          setProgress(data.progress.progress);
        }
      } catch (err) {
        console.error("Error fetching progress:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetch();
  }, []);

  return { progress, isLoading };
}
