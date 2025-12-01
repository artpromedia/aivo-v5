"use client";

import { useRouter } from "next/navigation";
import { TrialModal } from "./TrialModal";
import { useSubscription } from "./SubscriptionProvider";

/**
 * TrialModalWrapper - Renders the trial modal globally based on subscription status.
 * Should be placed in the root layout or a high-level provider.
 */
export function TrialModalWrapper() {
  const router = useRouter();
  const { 
    subscription, 
    showTrialModal, 
    setShowTrialModal,
    startTrial,
    isLoading,
  } = useSubscription();

  if (!subscription || isLoading) return null;

  const handleStartSubscription = () => {
    // If user has no subscription, start trial first
    if (subscription.status === "NONE") {
      startTrial().then((success) => {
        if (success) {
          setShowTrialModal(false);
        }
      });
    } else {
      // Redirect to subscription/pricing page
      router.push("/subscription");
    }
  };

  const handleDismiss = () => {
    setShowTrialModal(false);
  };

  // Don't show modal for active subscriptions
  if (subscription.status === "ACTIVE") return null;

  return (
    <TrialModal
      isOpen={showTrialModal}
      onClose={handleDismiss}
      subscriptionStatus={subscription.status}
      trialEndsAt={subscription.trial.trialEndsAt}
      daysRemaining={subscription.trial.daysRemaining}
      onStartSubscription={handleStartSubscription}
      onDismiss={
        subscription.status === "TRIAL_ACTIVE" ||
        subscription.status === "NONE"
          ? handleDismiss
          : undefined
      }
    />
  );
}

export default TrialModalWrapper;
