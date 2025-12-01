"use client";

import { useSubscription } from "./SubscriptionProvider";

interface TrialBannerProps {
  onUpgradeClick?: () => void;
}

export function TrialBanner({ onUpgradeClick }: TrialBannerProps) {
  const { subscription, setShowTrialModal } = useSubscription();

  if (!subscription) return null;

  const handleClick = () => {
    if (onUpgradeClick) {
      onUpgradeClick();
    } else {
      setShowTrialModal(true);
    }
  };

  // Only show for trial users
  if (subscription.status !== "TRIAL_ACTIVE") return null;

  const daysRemaining = subscription.trial.daysRemaining;
  const isUrgent = daysRemaining <= 7;
  const isLastDay = daysRemaining <= 1;

  return (
    <div
      className={`px-4 py-2 text-center text-sm font-medium transition-colors ${
        isLastDay
          ? "bg-red-500 text-white"
          : isUrgent
          ? "bg-yellow-400 text-yellow-900"
          : "bg-indigo-600 text-white"
      }`}
    >
      <span>
        {isLastDay
          ? "⚠️ Last day of your free trial! "
          : isUrgent
          ? `⏰ ${daysRemaining} days left in your trial. `
          : `🎉 ${daysRemaining} days left in your free trial. `}
      </span>
      <button
        onClick={handleClick}
        className={`underline font-semibold hover:no-underline ${
          isLastDay
            ? "text-white"
            : isUrgent
            ? "text-yellow-900"
            : "text-white"
        }`}
      >
        {isLastDay || isUrgent ? "Subscribe now" : "Upgrade"}
      </button>
    </div>
  );
}

export default TrialBanner;
