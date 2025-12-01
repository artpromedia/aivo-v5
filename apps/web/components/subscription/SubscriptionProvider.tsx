"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import type {
  SubscriptionStatus,
  SubscriptionTier,
  SubscriptionInfo,
} from "@aivo/types";
import {
  calculateTrialDaysRemaining,
  canAccessPlatform,
  requiresPayment,
} from "@aivo/types";
import { TrialModalWrapper } from "./TrialModalWrapper";

interface SubscriptionContextValue {
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
  startTrial: () => Promise<boolean>;
  cancelTrial: (reason?: string) => Promise<boolean>;
  refreshSubscription: () => Promise<void>;
  showTrialModal: boolean;
  setShowTrialModal: (show: boolean) => void;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

interface SubscriptionProviderProps {
  children: ReactNode;
}

export function SubscriptionProvider({ children }: SubscriptionProviderProps) {
  const { data: session, status: sessionStatus } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTrialModal, setShowTrialModal] = useState(false);

  // Fetch subscription status from API
  const fetchSubscription = useCallback(async () => {
    if (!session?.user?.id) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/status");
      
      if (!response.ok) {
        throw new Error("Failed to fetch subscription status");
      }

      const data = await response.json();
      
      // Parse dates
      const subscriptionInfo: SubscriptionInfo = {
        status: data.status as SubscriptionStatus,
        tier: data.tier as SubscriptionTier,
        trial: {
          isInTrial: data.status === "TRIAL_ACTIVE",
          trialStartedAt: data.trialStartedAt ? new Date(data.trialStartedAt) : null,
          trialEndsAt: data.trialEndsAt ? new Date(data.trialEndsAt) : null,
          daysRemaining: data.trialEndsAt 
            ? calculateTrialDaysRemaining(new Date(data.trialEndsAt))
            : 0,
          hasUsedTrial: data.hasUsedTrial ?? false,
        },
        subscriptionStartedAt: data.subscriptionStartedAt
          ? new Date(data.subscriptionStartedAt)
          : null,
        subscriptionEndsAt: data.subscriptionEndsAt
          ? new Date(data.subscriptionEndsAt)
          : null,
        canAccessPlatform: canAccessPlatform(data.status as SubscriptionStatus),
        requiresPayment: requiresPayment(data.status as SubscriptionStatus),
        stripeCustomerId: data.stripeCustomerId,
      };

      setSubscription(subscriptionInfo);

      // Auto-show trial modal for users who need it
      if (
        subscriptionInfo.status === "NONE" ||
        subscriptionInfo.status === "TRIAL_EXPIRED" ||
        subscriptionInfo.status === "TRIAL_CANCELLED" ||
        (subscriptionInfo.status === "TRIAL_ACTIVE" &&
          subscriptionInfo.trial.daysRemaining <= 7)
      ) {
        setShowTrialModal(true);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id]);

  // Fetch subscription on mount and when session changes
  useEffect(() => {
    if (sessionStatus === "authenticated") {
      fetchSubscription();
    } else if (sessionStatus === "unauthenticated") {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [sessionStatus, fetchSubscription]);

  // Start trial
  const startTrial = useCallback(async (): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/trial/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to start trial");
        return false;
      }

      // Refresh subscription status
      await fetchSubscription();
      setShowTrialModal(false);
      return true;
    } catch (err) {
      console.error("Error starting trial:", err);
      setError(err instanceof Error ? err.message : "Failed to start trial");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, fetchSubscription]);

  // Cancel trial
  const cancelTrial = useCallback(async (reason?: string): Promise<boolean> => {
    if (!session?.user?.id) return false;

    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/subscription/trial/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to cancel trial");
        return false;
      }

      // Refresh subscription status
      await fetchSubscription();
      return true;
    } catch (err) {
      console.error("Error cancelling trial:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel trial");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [session?.user?.id, fetchSubscription]);

  const value: SubscriptionContextValue = {
    subscription,
    isLoading,
    error,
    startTrial,
    cancelTrial,
    refreshSubscription: fetchSubscription,
    showTrialModal,
    setShowTrialModal,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <TrialModalWrapper />
    </SubscriptionContext.Provider>
  );
}

export function useSubscription(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error(
      "useSubscription must be used within a SubscriptionProvider"
    );
  }

  return context;
}

/**
 * Hook to check if the user can access a specific feature
 */
export function useCanAccessFeature(): {
  canAccess: boolean;
  isTrialUser: boolean;
  daysRemaining: number;
} {
  const { subscription, isLoading } = useSubscription();

  if (isLoading || !subscription) {
    return {
      canAccess: false,
      isTrialUser: false,
      daysRemaining: 0,
    };
  }

  return {
    canAccess: subscription.canAccessPlatform,
    isTrialUser: subscription.trial.isInTrial,
    daysRemaining: subscription.trial.daysRemaining,
  };
}

export default SubscriptionProvider;
