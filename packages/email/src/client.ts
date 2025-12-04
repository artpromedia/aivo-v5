/**
 * SendGrid Email Client
 *
 * Wrapper around SendGrid API for sending emails.
 */

import sgMail from '@sendgrid/mail';
import type { EmailOptions, EmailSendResult, EmailTemplateType, EmailPreferences } from './types';
import { renderEmailTemplate } from './templates';

// ============================================================================
// Configuration
// ============================================================================

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const DEFAULT_FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@aivo.ai';
const DEFAULT_FROM_NAME = process.env.EMAIL_FROM_NAME || 'AIVO';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// Initialize SendGrid
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  console.warn('[email] SENDGRID_API_KEY not set. Email functionality will be disabled.');
}

// ============================================================================
// Email Sending
// ============================================================================

/**
 * Check if email sending is configured
 */
export function isEmailConfigured(): boolean {
  return !!SENDGRID_API_KEY;
}

/**
 * Send a raw email with HTML and text content
 */
export async function sendEmail(
  options: EmailOptions & {
    subject: string;
    html: string;
    text: string;
  },
): Promise<EmailSendResult> {
  if (!SENDGRID_API_KEY) {
    console.log('[email] Email not configured, skipping send:', options.subject);
    return { success: false, error: 'Email not configured' };
  }

  try {
    const to = Array.isArray(options.to)
      ? options.to.map((r) => ({ email: r.email, name: r.name }))
      : { email: options.to.email, name: options.to.name };

    const msg: sgMail.MailDataRequired = {
      to,
      from: {
        email: options.from?.email || DEFAULT_FROM_EMAIL,
        name: options.from?.name || DEFAULT_FROM_NAME,
      },
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    // Add optional fields
    if (options.replyTo) {
      msg.replyTo = { email: options.replyTo.email, name: options.replyTo.name };
    }

    if (options.cc?.length) {
      msg.cc = options.cc.map((r) => ({ email: r.email, name: r.name }));
    }

    if (options.bcc?.length) {
      msg.bcc = options.bcc.map((r) => ({ email: r.email, name: r.name }));
    }

    if (options.tags?.length) {
      msg.categories = options.tags;
    }

    if (options.customArgs) {
      msg.customArgs = options.customArgs;
    }

    const [response] = await sgMail.send(msg);

    return {
      success: true,
      messageId: response.headers['x-message-id'] as string,
    };
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[email] Failed to send email:', error);
    return { success: false, error };
  }
}

/**
 * Send a templated email
 */
export async function sendTemplatedEmail(
  type: EmailTemplateType,
  data: Record<string, unknown>,
  options: EmailOptions,
): Promise<EmailSendResult> {
  try {
    const rendered = renderEmailTemplate(type, data);

    // Replace placeholder URLs in the rendered HTML
    const processedHtml = rendered.html
      .replace(/\{\{unsubscribeUrl\}\}/g, `${APP_URL}/unsubscribe`)
      .replace(/\{\{preferencesUrl\}\}/g, `${APP_URL}/settings/email-preferences`)
      .replace(/\{\{privacyUrl\}\}/g, `${APP_URL}/privacy`);

    return sendEmail({
      ...options,
      subject: rendered.subject,
      html: processedHtml,
      text: rendered.text,
      tags: [type, ...(options.tags || [])],
    });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Unknown error';
    console.error('[email] Failed to send templated email:', error);
    return { success: false, error };
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send welcome email to a new user
 */
export async function sendWelcomeEmail(
  to: { email: string; name: string },
  data: {
    trialDays?: number;
    features?: string[];
  } = {},
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'welcome',
    {
      userName: to.name || 'there',
      loginUrl: `${APP_URL}/login`,
      trialDays: data.trialDays ?? 30,
      features: data.features,
    },
    { to },
  );
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: { email: string; name: string },
  data: {
    resetToken: string;
    expiresInMinutes?: number;
    ipAddress?: string;
    userAgent?: string;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'password-reset',
    {
      userName: to.name || 'there',
      resetUrl: `${APP_URL}/reset-password?token=${data.resetToken}`,
      expiresInMinutes: data.expiresInMinutes ?? 60,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
    { to, priority: 'high' },
  );
}

/**
 * Send trial expiring reminder
 */
export async function sendTrialExpiringEmail(
  to: { email: string; name: string },
  data: {
    daysRemaining: number;
    trialEndsAt: Date;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'trial-expiring',
    {
      userName: to.name || 'there',
      daysRemaining: data.daysRemaining,
      trialEndsAt: data.trialEndsAt,
      upgradeUrl: `${APP_URL}/subscribe`,
    },
    { to },
  );
}

/**
 * Send trial expired notification
 */
export async function sendTrialExpiredEmail(
  to: { email: string; name: string },
  data: {
    trialEndedAt: Date;
    discountCode?: string;
    discountPercent?: number;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'trial-expired',
    {
      userName: to.name || 'there',
      trialEndedAt: data.trialEndedAt,
      upgradeUrl: `${APP_URL}/subscribe`,
      discountCode: data.discountCode,
      discountPercent: data.discountPercent,
    },
    { to },
  );
}

/**
 * Send pilot expiring reminder
 */
export async function sendPilotExpiringEmail(
  to: { email: string; name: string },
  data: {
    districtName: string;
    daysRemaining: number;
    pilotEndsAt: Date;
    learnersEnrolled?: number;
    schoolsActive?: number;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'pilot-expiring',
    {
      userName: to.name || 'there',
      districtName: data.districtName,
      daysRemaining: data.daysRemaining,
      pilotEndsAt: data.pilotEndsAt,
      contactSalesUrl: `${APP_URL}/contact-sales`,
      learnersEnrolled: data.learnersEnrolled,
      schoolsActive: data.schoolsActive,
    },
    { to },
  );
}

/**
 * Send pilot expired notification
 */
export async function sendPilotExpiredEmail(
  to: { email: string; name: string },
  data: {
    districtName: string;
    pilotEndedAt: Date;
    successMetrics?: {
      learnersServed: number;
      sessionsCompleted: number;
      averageEngagement: number;
    };
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'pilot-expired',
    {
      userName: to.name || 'there',
      districtName: data.districtName,
      pilotEndedAt: data.pilotEndedAt,
      contactSalesUrl: `${APP_URL}/contact-sales`,
      successMetrics: data.successMetrics,
    },
    { to },
  );
}

/**
 * Send subscription activated notification
 */
export async function sendSubscriptionActivatedEmail(
  to: { email: string; name: string },
  data: {
    tier: string;
    amount: number;
    currency: string;
    billingCycle: 'monthly' | 'yearly';
    nextBillingDate: Date;
    invoiceUrl?: string;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'subscription-activated',
    {
      userName: to.name || 'there',
      tier: data.tier,
      amount: data.amount,
      currency: data.currency,
      billingCycle: data.billingCycle,
      nextBillingDate: data.nextBillingDate,
      dashboardUrl: `${APP_URL}/dashboard`,
      invoiceUrl: data.invoiceUrl,
    },
    { to },
  );
}

/**
 * Send payment failed notification
 */
export async function sendPaymentFailedEmail(
  to: { email: string; name: string },
  data: {
    amount: number;
    currency: string;
    failureReason?: string;
    retryDate?: Date;
    gracePeriodDays?: number;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'payment-failed',
    {
      userName: to.name || 'there',
      amount: data.amount,
      currency: data.currency,
      failureReason: data.failureReason,
      updatePaymentUrl: `${APP_URL}/settings/billing`,
      retryDate: data.retryDate,
      gracePeriodDays: data.gracePeriodDays,
    },
    { to, priority: 'high' },
  );
}

/**
 * Send payment succeeded notification
 */
export async function sendPaymentSucceededEmail(
  to: { email: string; name: string },
  data: {
    amount: number;
    currency: string;
    invoiceNumber: string;
    invoiceUrl?: string;
    nextBillingDate: Date;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'payment-succeeded',
    {
      userName: to.name || 'there',
      amount: data.amount,
      currency: data.currency,
      invoiceNumber: data.invoiceNumber,
      invoiceUrl: data.invoiceUrl,
      nextBillingDate: data.nextBillingDate,
    },
    { to },
  );
}

/**
 * Send subscription cancelled notification
 */
export async function sendSubscriptionCancelledEmail(
  to: { email: string; name: string },
  data: {
    tier: string;
    accessEndsAt: Date;
    reason?: string;
  },
): Promise<EmailSendResult> {
  return sendTemplatedEmail(
    'subscription-cancelled',
    {
      userName: to.name || 'there',
      tier: data.tier,
      accessEndsAt: data.accessEndsAt,
      reason: data.reason,
      reactivateUrl: `${APP_URL}/subscribe`,
      feedbackUrl: `${APP_URL}/feedback`,
    },
    { to },
  );
}

// ============================================================================
// Email Preferences
// ============================================================================

/**
 * Check if a user should receive an email based on their preferences
 */
export function shouldSendEmail(type: EmailTemplateType, preferences: EmailPreferences): boolean {
  // Security emails are always sent
  if (type === 'password-reset') {
    return true;
  }

  // Payment notifications
  if (
    [
      'payment-failed',
      'payment-succeeded',
      'subscription-activated',
      'subscription-cancelled',
    ].includes(type)
  ) {
    return preferences.paymentNotifications;
  }

  // Trial/pilot reminders
  if (['trial-expiring', 'trial-expired', 'pilot-expiring', 'pilot-expired'].includes(type)) {
    return preferences.trialReminders;
  }

  // Welcome email is always sent
  if (type === 'welcome') {
    return true;
  }

  return true;
}
