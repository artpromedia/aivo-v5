/**
 * Subscription and Trial Types
 * 
 * These types define the subscription system including:
 * - 30-day free trial for first-time users
 * - Prevention of trial reuse with same email
 * - Subscription status tracking
 */

export type SubscriptionStatus =
  | "NONE"           // No subscription or trial started
  | "TRIAL_ACTIVE"   // Currently in trial period
  | "TRIAL_EXPIRED"  // Trial ended without subscription
  | "TRIAL_CANCELLED" // User cancelled during trial
  | "ACTIVE"         // Paid subscription active
  | "PAST_DUE"       // Payment failed, grace period
  | "CANCELLED"      // Subscription cancelled
  | "EXPIRED";       // Subscription ended

export type SubscriptionTier =
  | "FREE"       // No subscription (limited features)
  | "BASIC"      // Basic tier
  | "PRO"        // Professional tier
  | "ENTERPRISE"; // Enterprise tier

export interface TrialInfo {
  isInTrial: boolean;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  daysRemaining: number;
  hasUsedTrial: boolean;
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  trial: TrialInfo;
  subscriptionStartedAt: Date | null;
  subscriptionEndsAt: Date | null;
  canAccessPlatform: boolean;
  requiresPayment: boolean;
  stripeCustomerId?: string;
}

export interface TrialStartRequest {
  userId: string;
  email: string;
}

export interface TrialStartResponse {
  success: boolean;
  message: string;
  trialEndsAt?: Date;
  error?: string;
}

export interface TrialCancelRequest {
  userId: string;
  reason?: string;
}

export interface TrialCancelResponse {
  success: boolean;
  message: string;
}

export interface SubscriptionCheckResponse {
  canStartTrial: boolean;
  reason?: string;
  existingSubscription?: {
    status: SubscriptionStatus;
    tier: SubscriptionTier;
  };
}

/**
 * Trial duration in days
 */
export const TRIAL_DURATION_DAYS = 30;

/**
 * Calculate days remaining in trial
 */
export function calculateTrialDaysRemaining(trialEndsAt: Date | null): number {
  if (!trialEndsAt) return 0;
  
  const now = new Date();
  const endDate = new Date(trialEndsAt);
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Check if user can access platform based on subscription status
 */
export function canAccessPlatform(status: SubscriptionStatus): boolean {
  return status === "TRIAL_ACTIVE" || status === "ACTIVE";
}

/**
 * Check if user needs to pay to continue
 */
export function requiresPayment(status: SubscriptionStatus): boolean {
  return (
    status === "TRIAL_EXPIRED" ||
    status === "TRIAL_CANCELLED" ||
    status === "PAST_DUE" ||
    status === "CANCELLED" ||
    status === "EXPIRED"
  );
}

/**
 * Get user-friendly subscription status message
 */
export function getSubscriptionStatusMessage(status: SubscriptionStatus, daysRemaining?: number): string {
  switch (status) {
    case "NONE":
      return "Start your free 30-day trial today!";
    case "TRIAL_ACTIVE":
      return daysRemaining !== undefined
        ? `${daysRemaining} days remaining in your free trial`
        : "Your free trial is active";
    case "TRIAL_EXPIRED":
      return "Your trial has expired. Subscribe to continue.";
    case "TRIAL_CANCELLED":
      return "Your trial was cancelled. Subscribe to access the platform.";
    case "ACTIVE":
      return "Your subscription is active";
    case "PAST_DUE":
      return "Payment failed. Please update your payment method.";
    case "CANCELLED":
      return "Your subscription has been cancelled.";
    case "EXPIRED":
      return "Your subscription has expired. Renew to continue.";
    default:
      return "Unknown subscription status";
  }
}
