/**
 * Email Types
 *
 * Type definitions for the email system.
 */

/**
 * Supported email template types
 */
export type EmailTemplateType =
  | 'welcome'
  | 'password-reset'
  | 'trial-expiring'
  | 'trial-expired'
  | 'pilot-expiring'
  | 'pilot-expired'
  | 'subscription-activated'
  | 'payment-failed'
  | 'payment-succeeded'
  | 'subscription-cancelled';

/**
 * Email priority levels
 */
export type EmailPriority = 'high' | 'normal' | 'low';

/**
 * Email recipient
 */
export interface EmailRecipient {
  email: string;
  name?: string;
}

/**
 * Base email options
 */
export interface EmailOptions {
  to: EmailRecipient | EmailRecipient[];
  from?: EmailRecipient;
  replyTo?: EmailRecipient;
  cc?: EmailRecipient[];
  bcc?: EmailRecipient[];
  priority?: EmailPriority;
  tags?: string[];
  customArgs?: Record<string, string>;
}

/**
 * Email send result
 */
export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Email preferences for users
 */
export interface EmailPreferences {
  marketing: boolean;
  productUpdates: boolean;
  trialReminders: boolean;
  paymentNotifications: boolean;
  securityAlerts: boolean;
  weeklyDigest: boolean;
}

/**
 * Default email preferences
 */
export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  marketing: true,
  productUpdates: true,
  trialReminders: true,
  paymentNotifications: true,
  securityAlerts: true,
  weeklyDigest: false,
};

// ============================================================================
// Template Data Types
// ============================================================================

/**
 * Welcome email template data
 */
export interface WelcomeEmailData {
  userName: string;
  loginUrl: string;
  trialDays?: number;
  features?: string[];
}

/**
 * Password reset email template data
 */
export interface PasswordResetEmailData {
  userName: string;
  resetUrl: string;
  expiresInMinutes: number;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Trial expiring email template data
 */
export interface TrialExpiringEmailData {
  userName: string;
  daysRemaining: number;
  trialEndsAt: Date;
  upgradeUrl: string;
  features?: string[];
}

/**
 * Trial expired email template data
 */
export interface TrialExpiredEmailData {
  userName: string;
  trialEndedAt: Date;
  upgradeUrl: string;
  discountCode?: string;
  discountPercent?: number;
}

/**
 * Pilot expiring email template data
 */
export interface PilotExpiringEmailData {
  userName: string;
  districtName: string;
  daysRemaining: number;
  pilotEndsAt: Date;
  contactSalesUrl: string;
  learnersEnrolled?: number;
  schoolsActive?: number;
}

/**
 * Pilot expired email template data
 */
export interface PilotExpiredEmailData {
  userName: string;
  districtName: string;
  pilotEndedAt: Date;
  contactSalesUrl: string;
  successMetrics?: {
    learnersServed: number;
    sessionsCompleted: number;
    averageEngagement: number;
  };
}

/**
 * Subscription activated email template data
 */
export interface SubscriptionActivatedEmailData {
  userName: string;
  tier: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: Date;
  dashboardUrl: string;
  invoiceUrl?: string;
}

/**
 * Payment failed email template data
 */
export interface PaymentFailedEmailData {
  userName: string;
  amount: number;
  currency: string;
  failureReason?: string;
  updatePaymentUrl: string;
  retryDate?: Date;
  gracePeriodDays?: number;
}

/**
 * Payment succeeded email template data
 */
export interface PaymentSucceededEmailData {
  userName: string;
  amount: number;
  currency: string;
  invoiceNumber: string;
  invoiceUrl?: string;
  nextBillingDate: Date;
}

/**
 * Subscription cancelled email template data
 */
export interface SubscriptionCancelledEmailData {
  userName: string;
  tier: string;
  accessEndsAt: Date;
  reason?: string;
  reactivateUrl: string;
  feedbackUrl?: string;
}

/**
 * Union type of all template data
 */
export type EmailTemplateData =
  | { type: 'welcome'; data: WelcomeEmailData }
  | { type: 'password-reset'; data: PasswordResetEmailData }
  | { type: 'trial-expiring'; data: TrialExpiringEmailData }
  | { type: 'trial-expired'; data: TrialExpiredEmailData }
  | { type: 'pilot-expiring'; data: PilotExpiringEmailData }
  | { type: 'pilot-expired'; data: PilotExpiredEmailData }
  | { type: 'subscription-activated'; data: SubscriptionActivatedEmailData }
  | { type: 'payment-failed'; data: PaymentFailedEmailData }
  | { type: 'payment-succeeded'; data: PaymentSucceededEmailData }
  | { type: 'subscription-cancelled'; data: SubscriptionCancelledEmailData };

/**
 * Rendered email content
 */
export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}
