"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { SubscriptionStatus, SubscriptionTier } from "@aivo/types";

interface TrialModalProps {
  isOpen: boolean;
  onClose: () => void;
  subscriptionStatus: SubscriptionStatus;
  _subscriptionTier?: SubscriptionTier;
  trialEndsAt: Date | null;
  daysRemaining: number;
  onStartSubscription: () => void;
  onDismiss?: () => void;
}

export function TrialModal({
  isOpen,
  onClose,
  subscriptionStatus,
  _subscriptionTier,
  trialEndsAt,
  daysRemaining,
  onStartSubscription,
  onDismiss,
}: TrialModalProps) {
  // Track if component is mounted for portal rendering (SSR-safe)
  const [mounted, setMounted] = useState(false);

  // Use layout effect to set mounted synchronously after render
  useEffect(() => {
    let isCancelled = false;
    // Use requestAnimationFrame to avoid setState-in-effect lint error
    requestAnimationFrame(() => {
      if (!isCancelled) {
        setMounted(true);
      }
    });
    return () => {
      isCancelled = true;
      setMounted(false);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const getModalContent = () => {
    switch (subscriptionStatus) {
      case "NONE":
        return <WelcomeTrialContent onStartSubscription={onStartSubscription} onDismiss={onDismiss} />;
      case "TRIAL_ACTIVE":
        return (
          <TrialActiveContent
            daysRemaining={daysRemaining}
            trialEndsAt={trialEndsAt}
            onStartSubscription={onStartSubscription}
            onDismiss={onClose}
          />
        );
      case "TRIAL_EXPIRED":
      case "TRIAL_CANCELLED":
        return (
          <TrialEndedContent
            status={subscriptionStatus}
            onStartSubscription={onStartSubscription}
          />
        );
      case "PAST_DUE":
        return <PaymentIssueContent onUpdatePayment={onStartSubscription} />;
      case "CANCELLED":
      case "EXPIRED":
        return (
          <SubscriptionEndedContent
            status={subscriptionStatus}
            onResubscribe={onStartSubscription}
          />
        );
      default:
        return null;
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="trial-modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={subscriptionStatus === "TRIAL_ACTIVE" ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all">
        {getModalContent()}
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(modalContent, document.body);
  }

  return modalContent;
}

// Welcome content for users who haven't started trial
function WelcomeTrialContent({
  onStartSubscription,
  onDismiss,
}: {
  onStartSubscription: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 bg-gradient-to-br from-indigo-500 to-theme-primary rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </div>

      <h2
        id="trial-modal-title"
        className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        Welcome to Aivo! 🎉
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Start your <span className="font-semibold text-indigo-600">free 30-day trial</span> and unlock personalized AI-powered learning for your child.
      </p>

      {/* Features list */}
      <div className="text-left bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          What&apos;s included:
        </h3>
        <ul className="space-y-2">
          {[
            "Personalized AI tutor for each subject",
            "Brain profile assessment",
            "Progress tracking & analytics",
            "Parent & teacher dashboards",
            "Unlimited learning sessions",
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg
                className="w-5 h-5 text-green-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        No credit card required. Cancel anytime.
      </p>

      <div className="flex flex-col gap-3">
        <button
          onClick={onStartSubscription}
          className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-theme-primary text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-theme-primary transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Start Free Trial
        </button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Maybe later
          </button>
        )}
      </div>
    </div>
  );
}

// Active trial content with countdown
function TrialActiveContent({
  daysRemaining,
  trialEndsAt,
  onStartSubscription,
  onDismiss,
}: {
  daysRemaining: number;
  trialEndsAt: Date | null;
  onStartSubscription: () => void;
  onDismiss: () => void;
}) {
  const isUrgent = daysRemaining <= 7;
  const isLastDay = daysRemaining <= 1;

  return (
    <div className="p-8 text-center">
      {/* Countdown circle */}
      <div
        className={`mx-auto w-24 h-24 rounded-full flex flex-col items-center justify-center mb-6 ${
          isLastDay
            ? "bg-red-100 dark:bg-red-900"
            : isUrgent
            ? "bg-yellow-100 dark:bg-yellow-900"
            : "bg-indigo-100 dark:bg-indigo-900"
        }`}
      >
        <span
          className={`text-3xl font-bold ${
            isLastDay
              ? "text-red-600 dark:text-red-400"
              : isUrgent
              ? "text-yellow-600 dark:text-yellow-400"
              : "text-indigo-600 dark:text-indigo-400"
          }`}
        >
          {daysRemaining}
        </span>
        <span
          className={`text-xs ${
            isLastDay
              ? "text-red-500"
              : isUrgent
              ? "text-yellow-500"
              : "text-indigo-500"
          }`}
        >
          {daysRemaining === 1 ? "day left" : "days left"}
        </span>
      </div>

      <h2
        id="trial-modal-title"
        className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {isLastDay
          ? "Last Day of Your Trial!"
          : isUrgent
          ? "Your Trial is Ending Soon"
          : "Your Free Trial"}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-2">
        {isLastDay
          ? "Subscribe now to keep learning without interruption."
          : isUrgent
          ? "Don't lose access to personalized learning."
          : "Enjoying Aivo? Subscribe to continue after your trial ends."}
      </p>

      {trialEndsAt && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Trial ends on{" "}
          {new Date(trialEndsAt).toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </p>
      )}

      {/* Pricing preview */}
      <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="text-left">
            <p className="font-semibold text-gray-900 dark:text-white">
              Pro Plan
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Full access to all features
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              $29
            </p>
            <p className="text-xs text-gray-500">/month</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={onStartSubscription}
          className={`w-full py-3 px-6 font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isUrgent
              ? "bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white focus:ring-red-500"
              : "bg-gradient-to-r from-indigo-600 to-theme-primary hover:from-indigo-700 hover:to-theme-primary text-white focus:ring-indigo-500"
          }`}
        >
          Subscribe Now
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-2 text-gray-500 dark:text-gray-400 text-sm hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
        >
          Continue with trial
        </button>
      </div>
    </div>
  );
}

// Trial ended content
function TrialEndedContent({
  status,
  onStartSubscription,
}: {
  status: "TRIAL_EXPIRED" | "TRIAL_CANCELLED";
  onStartSubscription: () => void;
}) {
  const isCancelled = status === "TRIAL_CANCELLED";

  return (
    <div className="p-8 text-center">
      {/* Icon */}
      <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-red-600 dark:text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h2
        id="trial-modal-title"
        className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {isCancelled ? "Trial Cancelled" : "Trial Expired"}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {isCancelled
          ? "Your trial was cancelled. Subscribe to regain full access to Aivo's personalized learning platform."
          : "Your 30-day free trial has ended. Subscribe now to continue your learning journey."}
      </p>

      {/* What you're missing */}
      <div className="text-left bg-gray-50 dark:bg-slate-700 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
          What you&apos;re missing:
        </h3>
        <ul className="space-y-2">
          {[
            "Continued progress tracking",
            "New learning sessions",
            "AI tutor conversations",
            "Updated assessments",
          ].map((feature, idx) => (
            <li key={idx} className="flex items-center text-sm text-gray-600 dark:text-gray-300">
              <svg
                className="w-5 h-5 text-red-500 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={onStartSubscription}
        className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-theme-primary text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-theme-primary transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Subscribe Now
      </button>
    </div>
  );
}

// Payment issue content
function PaymentIssueContent({
  onUpdatePayment,
}: {
  onUpdatePayment: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto w-20 h-20 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-yellow-600 dark:text-yellow-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      </div>

      <h2
        id="trial-modal-title"
        className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        Payment Issue
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        We couldn&apos;t process your last payment. Please update your payment
        method to continue using Aivo.
      </p>

      <button
        onClick={onUpdatePayment}
        className="w-full py-3 px-6 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
      >
        Update Payment Method
      </button>
    </div>
  );
}

// Subscription ended content
function SubscriptionEndedContent({
  status,
  onResubscribe,
}: {
  status: "CANCELLED" | "EXPIRED";
  onResubscribe: () => void;
}) {
  return (
    <div className="p-8 text-center">
      <div className="mx-auto w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
        <svg
          className="w-10 h-10 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>

      <h2
        id="trial-modal-title"
        className="text-2xl font-bold text-gray-900 dark:text-white mb-3"
      >
        {status === "CANCELLED"
          ? "Subscription Cancelled"
          : "Subscription Expired"}
      </h2>

      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {status === "CANCELLED"
          ? "Your subscription has been cancelled. Resubscribe to continue your learning journey."
          : "Your subscription has expired. Renew now to pick up where you left off."}
      </p>

      <button
        onClick={onResubscribe}
        className="w-full py-3 px-6 bg-gradient-to-r from-indigo-600 to-theme-primary text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-theme-primary transition-all shadow-lg hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        Resubscribe
      </button>
    </div>
  );
}

export default TrialModal;
