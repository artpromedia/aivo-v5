/**
 * Subscription and Trial Types
 *
 * These types define the subscription system including:
 * - 30-day free trial for first-time users (individuals)
 * - 90-day pilot period for districts
 * - Prevention of trial/pilot reuse
 * - Subscription status tracking
 */

export type SubscriptionStatus =
  | 'NONE' // No subscription or trial started
  | 'TRIAL_ACTIVE' // Currently in trial period (30 days for individuals)
  | 'TRIAL_EXPIRED' // Trial ended without subscription
  | 'TRIAL_CANCELLED' // User cancelled during trial
  | 'PILOT_ACTIVE' // Currently in pilot period (90 days for districts)
  | 'PILOT_EXPIRED' // Pilot ended without subscription
  | 'PILOT_CANCELLED' // District cancelled during pilot
  | 'ACTIVE' // Paid subscription active
  | 'PAST_DUE' // Payment failed, grace period
  | 'CANCELLED' // Subscription cancelled
  | 'EXPIRED'; // Subscription ended

export type SubscriptionTier =
  | 'FREE' // No subscription (limited features)
  | 'BASIC' // Basic tier
  | 'PRO' // Professional tier
  | 'ENTERPRISE'; // Enterprise tier

export interface TrialInfo {
  isInTrial: boolean;
  trialStartedAt: Date | null;
  trialEndsAt: Date | null;
  daysRemaining: number;
  hasUsedTrial: boolean;
}

export interface PilotInfo {
  isInPilot: boolean;
  pilotStartedAt: Date | null;
  pilotEndsAt: Date | null;
  daysRemaining: number;
  hasUsedPilot: boolean;
  districtId: string | null;
  districtName: string | null;
  maxLearners: number | null;
  maxSchools: number | null;
}

export interface SubscriptionInfo {
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  trial: TrialInfo;
  pilot?: PilotInfo;
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

// District pilot interfaces
export interface PilotStartRequest {
  districtId: string;
  initiatedById: string;
  maxLearners?: number;
  maxSchools?: number;
}

export interface PilotStartResponse {
  success: boolean;
  message: string;
  pilotEndsAt?: Date;
  districtId?: string;
  error?: string;
}

export interface PilotCancelRequest {
  districtId: string;
  reason?: string;
}

export interface PilotCancelResponse {
  success: boolean;
  message: string;
}

export interface PilotCheckResponse {
  canStartPilot: boolean;
  reason?: string;
  existingSubscription?: {
    status: SubscriptionStatus;
    tier: SubscriptionTier;
  };
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
 * Trial duration in days (for individual users)
 */
export const TRIAL_DURATION_DAYS = 30;

/**
 * Pilot duration in days (for districts)
 */
export const PILOT_DURATION_DAYS = 90;

/**
 * Default limits for district pilots
 */
export const DEFAULT_PILOT_MAX_LEARNERS = 500;
export const DEFAULT_PILOT_MAX_SCHOOLS = 10;

/**
 * Calculate days remaining in trial or pilot
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
 * Calculate days remaining in pilot (alias for calculateTrialDaysRemaining)
 */
export function calculatePilotDaysRemaining(pilotEndsAt: Date | null): number {
  return calculateTrialDaysRemaining(pilotEndsAt);
}

/**
 * Check if user/district can access platform based on subscription status
 */
export function canAccessPlatform(status: SubscriptionStatus): boolean {
  return status === 'TRIAL_ACTIVE' || status === 'PILOT_ACTIVE' || status === 'ACTIVE';
}

/**
 * Check if user/district needs to pay to continue
 */
export function requiresPayment(status: SubscriptionStatus): boolean {
  return (
    status === 'TRIAL_EXPIRED' ||
    status === 'TRIAL_CANCELLED' ||
    status === 'PILOT_EXPIRED' ||
    status === 'PILOT_CANCELLED' ||
    status === 'PAST_DUE' ||
    status === 'CANCELLED' ||
    status === 'EXPIRED'
  );
}

/**
 * Check if status is a pilot status
 */
export function isPilotStatus(status: SubscriptionStatus): boolean {
  return status === 'PILOT_ACTIVE' || status === 'PILOT_EXPIRED' || status === 'PILOT_CANCELLED';
}

/**
 * Check if status is a trial status
 */
export function isTrialStatus(status: SubscriptionStatus): boolean {
  return status === 'TRIAL_ACTIVE' || status === 'TRIAL_EXPIRED' || status === 'TRIAL_CANCELLED';
}

/**
 * Get user-friendly subscription status message
 */
export function getSubscriptionStatusMessage(
  status: SubscriptionStatus,
  daysRemaining?: number,
): string {
  switch (status) {
    case 'NONE':
      return 'Start your free 30-day trial today!';
    case 'TRIAL_ACTIVE':
      return daysRemaining !== undefined
        ? `${daysRemaining} days remaining in your free trial`
        : 'Your free trial is active';
    case 'TRIAL_EXPIRED':
      return 'Your trial has expired. Subscribe to continue.';
    case 'TRIAL_CANCELLED':
      return 'Your trial was cancelled. Subscribe to access the platform.';
    case 'PILOT_ACTIVE':
      return daysRemaining !== undefined
        ? `${daysRemaining} days remaining in your district pilot`
        : 'Your district pilot is active';
    case 'PILOT_EXPIRED':
      return 'Your district pilot has expired. Subscribe to continue.';
    case 'PILOT_CANCELLED':
      return 'Your district pilot was cancelled. Contact sales to subscribe.';
    case 'ACTIVE':
      return 'Your subscription is active';
    case 'PAST_DUE':
      return 'Payment failed. Please update your payment method.';
    case 'CANCELLED':
      return 'Your subscription has been cancelled.';
    case 'EXPIRED':
      return 'Your subscription has expired. Renew to continue.';
    default:
      return 'Unknown subscription status';
  }
}

/**
 * Get district-specific status message
 */
export function getDistrictPilotStatusMessage(
  status: SubscriptionStatus,
  daysRemaining?: number,
  districtName?: string,
): string {
  const districtPrefix = districtName ? `${districtName}: ` : 'Your district: ';

  switch (status) {
    case 'NONE':
      return `${districtPrefix}Start your 90-day district pilot today!`;
    case 'PILOT_ACTIVE':
      return daysRemaining !== undefined
        ? `${districtPrefix}${daysRemaining} days remaining in pilot`
        : `${districtPrefix}Pilot is active`;
    case 'PILOT_EXPIRED':
      return `${districtPrefix}Pilot has expired. Contact sales to subscribe.`;
    case 'PILOT_CANCELLED':
      return `${districtPrefix}Pilot was cancelled. Contact sales to reactivate.`;
    case 'ACTIVE':
      return `${districtPrefix}Enterprise subscription is active`;
    default:
      return getSubscriptionStatusMessage(status, daysRemaining);
  }
}
