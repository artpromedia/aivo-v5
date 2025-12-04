/**
 * Email Templates
 *
 * HTML and text templates for all email types.
 * Uses a simple template system with variable interpolation.
 */

import type {
  WelcomeEmailData,
  PasswordResetEmailData,
  TrialExpiringEmailData,
  TrialExpiredEmailData,
  PilotExpiringEmailData,
  PilotExpiredEmailData,
  SubscriptionActivatedEmailData,
  PaymentFailedEmailData,
  PaymentSucceededEmailData,
  SubscriptionCancelledEmailData,
  RenderedEmail,
} from './types';

// ============================================================================
// Base Template
// ============================================================================

const BASE_STYLES = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f5f5f5; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .card { background: #ffffff; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header { text-align: center; margin-bottom: 24px; }
  .logo { font-size: 28px; font-weight: bold; color: #6366f1; }
  .content { margin-bottom: 24px; }
  h1 { color: #1f2937; font-size: 24px; margin: 0 0 16px; }
  h2 { color: #374151; font-size: 20px; margin: 0 0 12px; }
  p { margin: 0 0 16px; color: #4b5563; }
  .button { display: inline-block; padding: 12px 24px; background-color: #6366f1; color: #ffffff !important; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 16px 0; }
  .button:hover { background-color: #4f46e5; }
  .button-secondary { background-color: #f3f4f6; color: #374151 !important; }
  .alert { padding: 16px; border-radius: 6px; margin: 16px 0; }
  .alert-warning { background-color: #fef3c7; border: 1px solid #fbbf24; color: #92400e; }
  .alert-error { background-color: #fee2e2; border: 1px solid #f87171; color: #991b1b; }
  .alert-success { background-color: #d1fae5; border: 1px solid #34d399; color: #065f46; }
  .footer { text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; }
  .footer a { color: #6366f1; text-decoration: none; }
  .features { list-style: none; padding: 0; margin: 16px 0; }
  .features li { padding: 8px 0; padding-left: 24px; position: relative; }
  .features li:before { content: '✓'; position: absolute; left: 0; color: #10b981; font-weight: bold; }
  .stats { display: flex; justify-content: space-around; margin: 24px 0; text-align: center; }
  .stat { padding: 16px; }
  .stat-value { font-size: 24px; font-weight: bold; color: #6366f1; }
  .stat-label { font-size: 12px; color: #6b7280; text-transform: uppercase; }
  .divider { height: 1px; background-color: #e5e7eb; margin: 24px 0; }
`;

function wrapHtml(content: string, previewText?: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AIVO</title>
  ${previewText ? `<meta name="x-apple-data-detectors" content="none"><!--[if !mso]><!--><meta http-equiv="X-UA-Compatible" content="IE=edge"><!--<![endif]--><span style="display:none !important;visibility:hidden;mso-hide:all;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${previewText}</span>` : ''}
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="header">
        <div class="logo">🎓 AIVO</div>
      </div>
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} AIVO. All rights reserved.</p>
      <p>
        <a href="{{unsubscribeUrl}}">Unsubscribe</a> · 
        <a href="{{preferencesUrl}}">Email Preferences</a> · 
        <a href="{{privacyUrl}}">Privacy Policy</a>
      </p>
    </div>
  </div>
</body>
</html>`;
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

// ============================================================================
// Welcome Email
// ============================================================================

export function renderWelcomeEmail(data: WelcomeEmailData): RenderedEmail {
  const features = data.features || [
    'Personalized AI tutoring for your child',
    'Adaptive learning paths based on their unique needs',
    'Real-time progress tracking and insights',
    'Safe, supportive learning environment',
  ];

  const html = wrapHtml(
    `
    <div class="content">
      <h1>Welcome to AIVO, ${data.userName}! 🎉</h1>
      <p>We're thrilled to have you join our community of parents and caregivers who are helping their children thrive with personalized AI tutoring.</p>
      
      ${
        data.trialDays
          ? `
      <div class="alert alert-success">
        <strong>Your ${data.trialDays}-day free trial has started!</strong>
        <p style="margin-bottom: 0;">Explore all features with no commitment.</p>
      </div>
      `
          : ''
      }
      
      <h2>Here's what you can do:</h2>
      <ul class="features">
        ${features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
      
      <p style="text-align: center;">
        <a href="${data.loginUrl}" class="button">Get Started</a>
      </p>
      
      <p>If you have any questions, just reply to this email. We're here to help!</p>
    </div>
  `,
    `Welcome to AIVO! Your ${data.trialDays || 30}-day free trial has started.`,
  );

  const text = `
Welcome to AIVO, ${data.userName}!

We're thrilled to have you join our community of parents and caregivers who are helping their children thrive with personalized AI tutoring.

${data.trialDays ? `Your ${data.trialDays}-day free trial has started! Explore all features with no commitment.` : ''}

Here's what you can do:
${features.map((f) => `• ${f}`).join('\n')}

Get started: ${data.loginUrl}

If you have any questions, just reply to this email. We're here to help!

- The AIVO Team
  `.trim();

  return {
    subject: `Welcome to AIVO, ${data.userName}! 🎓`,
    html,
    text,
  };
}

// ============================================================================
// Password Reset Email
// ============================================================================

export function renderPasswordResetEmail(data: PasswordResetEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Reset Your Password</h1>
      <p>Hi ${data.userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      
      <p style="text-align: center;">
        <a href="${data.resetUrl}" class="button">Reset Password</a>
      </p>
      
      <p><strong>This link will expire in ${data.expiresInMinutes} minutes.</strong></p>
      
      <div class="divider"></div>
      
      <p style="font-size: 14px; color: #6b7280;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
      
      ${
        data.ipAddress
          ? `
      <p style="font-size: 12px; color: #9ca3af;">
        Request details:<br>
        IP Address: ${data.ipAddress}<br>
        ${data.userAgent ? `Browser: ${data.userAgent}` : ''}
      </p>
      `
          : ''
      }
    </div>
  `,
    'Reset your AIVO password',
  );

  const text = `
Reset Your Password

Hi ${data.userName},

We received a request to reset your password. Use the link below to create a new password:

${data.resetUrl}

This link will expire in ${data.expiresInMinutes} minutes.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

- The AIVO Team
  `.trim();

  return {
    subject: 'Reset your AIVO password',
    html,
    text,
  };
}

// ============================================================================
// Trial Expiring Email
// ============================================================================

export function renderTrialExpiringEmail(data: TrialExpiringEmailData): RenderedEmail {
  const features = data.features || [
    'Unlimited AI tutoring sessions',
    'Advanced learning analytics',
    'Priority support',
    'Multiple learner profiles',
  ];

  const html = wrapHtml(
    `
    <div class="content">
      <h1>Your Trial Ends in ${data.daysRemaining} Day${data.daysRemaining === 1 ? '' : 's'}</h1>
      <p>Hi ${data.userName},</p>
      <p>We hope you've been enjoying AIVO! Your free trial will end on <strong>${formatDate(data.trialEndsAt)}</strong>.</p>
      
      <div class="alert alert-warning">
        <strong>Don't lose access!</strong>
        <p style="margin-bottom: 0;">Upgrade now to continue your child's personalized learning journey.</p>
      </div>
      
      <h2>Keep these features:</h2>
      <ul class="features">
        ${features.map((f) => `<li>${f}</li>`).join('')}
      </ul>
      
      <p style="text-align: center;">
        <a href="${data.upgradeUrl}" class="button">Upgrade Now</a>
      </p>
      
      <p>Have questions? Reply to this email and we'll help you choose the right plan.</p>
    </div>
  `,
    `Your AIVO trial ends in ${data.daysRemaining} days. Upgrade to continue.`,
  );

  const text = `
Your Trial Ends in ${data.daysRemaining} Day${data.daysRemaining === 1 ? '' : 's'}

Hi ${data.userName},

We hope you've been enjoying AIVO! Your free trial will end on ${formatDate(data.trialEndsAt)}.

Don't lose access! Upgrade now to continue your child's personalized learning journey.

Keep these features:
${features.map((f) => `• ${f}`).join('\n')}

Upgrade now: ${data.upgradeUrl}

Have questions? Reply to this email and we'll help you choose the right plan.

- The AIVO Team
  `.trim();

  return {
    subject: `⏰ Your AIVO trial ends in ${data.daysRemaining} days`,
    html,
    text,
  };
}

// ============================================================================
// Trial Expired Email
// ============================================================================

export function renderTrialExpiredEmail(data: TrialExpiredEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Your Trial Has Ended</h1>
      <p>Hi ${data.userName},</p>
      <p>Your AIVO free trial ended on ${formatDate(data.trialEndedAt)}. We hope you and your child enjoyed the experience!</p>
      
      ${
        data.discountCode
          ? `
      <div class="alert alert-success">
        <strong>Special Offer: ${data.discountPercent || 20}% Off!</strong>
        <p style="margin-bottom: 0;">Use code <strong>${data.discountCode}</strong> at checkout to save on your first month.</p>
      </div>
      `
          : ''
      }
      
      <p>Subscribe now to continue your child's personalized learning journey with AIVO.</p>
      
      <p style="text-align: center;">
        <a href="${data.upgradeUrl}" class="button">Subscribe Now</a>
      </p>
      
      <p>Need more time to decide? Reply to this email and let us know how we can help.</p>
    </div>
  `,
    'Your AIVO trial has ended. Subscribe to continue.',
  );

  const text = `
Your Trial Has Ended

Hi ${data.userName},

Your AIVO free trial ended on ${formatDate(data.trialEndedAt)}. We hope you and your child enjoyed the experience!

${data.discountCode ? `Special Offer: ${data.discountPercent || 20}% Off! Use code ${data.discountCode} at checkout to save on your first month.` : ''}

Subscribe now to continue your child's personalized learning journey with AIVO.

Subscribe: ${data.upgradeUrl}

Need more time to decide? Reply to this email and let us know how we can help.

- The AIVO Team
  `.trim();

  return {
    subject: 'Your AIVO trial has ended',
    html,
    text,
  };
}

// ============================================================================
// Pilot Expiring Email
// ============================================================================

export function renderPilotExpiringEmail(data: PilotExpiringEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>${data.districtName} Pilot Ends in ${data.daysRemaining} Days</h1>
      <p>Hi ${data.userName},</p>
      <p>Your district's AIVO pilot program will end on <strong>${formatDate(data.pilotEndsAt)}</strong>.</p>
      
      ${
        data.learnersEnrolled || data.schoolsActive
          ? `
      <div class="stats">
        ${
          data.learnersEnrolled
            ? `
        <div class="stat">
          <div class="stat-value">${data.learnersEnrolled.toLocaleString()}</div>
          <div class="stat-label">Learners Enrolled</div>
        </div>
        `
            : ''
        }
        ${
          data.schoolsActive
            ? `
        <div class="stat">
          <div class="stat-value">${data.schoolsActive}</div>
          <div class="stat-label">Schools Active</div>
        </div>
        `
            : ''
        }
      </div>
      `
          : ''
      }
      
      <div class="alert alert-warning">
        <strong>Contact us to continue!</strong>
        <p style="margin-bottom: 0;">Let's discuss how AIVO can continue supporting your district's learners.</p>
      </div>
      
      <p style="text-align: center;">
        <a href="${data.contactSalesUrl}" class="button">Contact Sales</a>
      </p>
    </div>
  `,
    `Your district pilot ends in ${data.daysRemaining} days.`,
  );

  const text = `
${data.districtName} Pilot Ends in ${data.daysRemaining} Days

Hi ${data.userName},

Your district's AIVO pilot program will end on ${formatDate(data.pilotEndsAt)}.

${data.learnersEnrolled ? `Learners Enrolled: ${data.learnersEnrolled.toLocaleString()}` : ''}
${data.schoolsActive ? `Schools Active: ${data.schoolsActive}` : ''}

Contact us to continue! Let's discuss how AIVO can continue supporting your district's learners.

Contact Sales: ${data.contactSalesUrl}

- The AIVO Team
  `.trim();

  return {
    subject: `📊 ${data.districtName} AIVO pilot ends in ${data.daysRemaining} days`,
    html,
    text,
  };
}

// ============================================================================
// Pilot Expired Email
// ============================================================================

export function renderPilotExpiredEmail(data: PilotExpiredEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Your Pilot Program Has Ended</h1>
      <p>Hi ${data.userName},</p>
      <p>${data.districtName}'s AIVO pilot program ended on ${formatDate(data.pilotEndedAt)}.</p>
      
      ${
        data.successMetrics
          ? `
      <h2>Your Pilot Results:</h2>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">${data.successMetrics.learnersServed.toLocaleString()}</div>
          <div class="stat-label">Learners Served</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.successMetrics.sessionsCompleted.toLocaleString()}</div>
          <div class="stat-label">Sessions Completed</div>
        </div>
        <div class="stat">
          <div class="stat-value">${data.successMetrics.averageEngagement}%</div>
          <div class="stat-label">Avg. Engagement</div>
        </div>
      </div>
      `
          : ''
      }
      
      <p>We'd love to continue supporting your district's learners. Let's discuss enterprise options that fit your needs.</p>
      
      <p style="text-align: center;">
        <a href="${data.contactSalesUrl}" class="button">Contact Sales</a>
      </p>
    </div>
  `,
    `Your district pilot has ended. Let's discuss next steps.`,
  );

  const text = `
Your Pilot Program Has Ended

Hi ${data.userName},

${data.districtName}'s AIVO pilot program ended on ${formatDate(data.pilotEndedAt)}.

${
  data.successMetrics
    ? `
Your Pilot Results:
• Learners Served: ${data.successMetrics.learnersServed.toLocaleString()}
• Sessions Completed: ${data.successMetrics.sessionsCompleted.toLocaleString()}
• Average Engagement: ${data.successMetrics.averageEngagement}%
`
    : ''
}

We'd love to continue supporting your district's learners. Let's discuss enterprise options that fit your needs.

Contact Sales: ${data.contactSalesUrl}

- The AIVO Team
  `.trim();

  return {
    subject: `${data.districtName} AIVO pilot has ended`,
    html,
    text,
  };
}

// ============================================================================
// Subscription Activated Email
// ============================================================================

export function renderSubscriptionActivatedEmail(
  data: SubscriptionActivatedEmailData,
): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Welcome to AIVO ${data.tier}! 🎉</h1>
      <p>Hi ${data.userName},</p>
      <p>Thank you for subscribing! Your ${data.tier} subscription is now active.</p>
      
      <div class="alert alert-success">
        <strong>Subscription Details</strong>
        <p style="margin-bottom: 0;">
          Plan: AIVO ${data.tier}<br>
          Amount: ${formatCurrency(data.amount, data.currency)} / ${data.billingCycle}<br>
          Next billing date: ${formatDate(data.nextBillingDate)}
        </p>
      </div>
      
      ${
        data.invoiceUrl
          ? `
      <p><a href="${data.invoiceUrl}">View your invoice →</a></p>
      `
          : ''
      }
      
      <p style="text-align: center;">
        <a href="${data.dashboardUrl}" class="button">Go to Dashboard</a>
      </p>
      
      <p>Thank you for choosing AIVO to support your child's learning journey!</p>
    </div>
  `,
    `Your AIVO ${data.tier} subscription is now active!`,
  );

  const text = `
Welcome to AIVO ${data.tier}!

Hi ${data.userName},

Thank you for subscribing! Your ${data.tier} subscription is now active.

Subscription Details:
• Plan: AIVO ${data.tier}
• Amount: ${formatCurrency(data.amount, data.currency)} / ${data.billingCycle}
• Next billing date: ${formatDate(data.nextBillingDate)}

${data.invoiceUrl ? `View your invoice: ${data.invoiceUrl}` : ''}

Go to Dashboard: ${data.dashboardUrl}

Thank you for choosing AIVO to support your child's learning journey!

- The AIVO Team
  `.trim();

  return {
    subject: `🎉 Welcome to AIVO ${data.tier}!`,
    html,
    text,
  };
}

// ============================================================================
// Payment Failed Email
// ============================================================================

export function renderPaymentFailedEmail(data: PaymentFailedEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Payment Failed</h1>
      <p>Hi ${data.userName},</p>
      <p>We were unable to process your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong>.</p>
      
      <div class="alert alert-error">
        <strong>Action Required</strong>
        <p style="margin-bottom: 0;">
          ${data.failureReason || 'Your payment method was declined.'}
          ${data.gracePeriodDays ? `<br>You have ${data.gracePeriodDays} days to update your payment method before your subscription is paused.` : ''}
        </p>
      </div>
      
      <p style="text-align: center;">
        <a href="${data.updatePaymentUrl}" class="button">Update Payment Method</a>
      </p>
      
      ${
        data.retryDate
          ? `
      <p>We'll automatically retry the payment on ${formatDate(data.retryDate)}.</p>
      `
          : ''
      }
      
      <p>Need help? Reply to this email and we'll assist you.</p>
    </div>
  `,
    'Action required: Your AIVO payment failed',
  );

  const text = `
Payment Failed

Hi ${data.userName},

We were unable to process your payment of ${formatCurrency(data.amount, data.currency)}.

${data.failureReason || 'Your payment method was declined.'}
${data.gracePeriodDays ? `You have ${data.gracePeriodDays} days to update your payment method before your subscription is paused.` : ''}

Update Payment Method: ${data.updatePaymentUrl}

${data.retryDate ? `We'll automatically retry the payment on ${formatDate(data.retryDate)}.` : ''}

Need help? Reply to this email and we'll assist you.

- The AIVO Team
  `.trim();

  return {
    subject: '⚠️ Action required: Your AIVO payment failed',
    html,
    text,
  };
}

// ============================================================================
// Payment Succeeded Email
// ============================================================================

export function renderPaymentSucceededEmail(data: PaymentSucceededEmailData): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Payment Received ✓</h1>
      <p>Hi ${data.userName},</p>
      <p>Thank you! We've received your payment of <strong>${formatCurrency(data.amount, data.currency)}</strong>.</p>
      
      <div class="alert alert-success">
        <strong>Payment Details</strong>
        <p style="margin-bottom: 0;">
          Invoice #: ${data.invoiceNumber}<br>
          Amount: ${formatCurrency(data.amount, data.currency)}<br>
          Next billing date: ${formatDate(data.nextBillingDate)}
        </p>
      </div>
      
      ${
        data.invoiceUrl
          ? `
      <p style="text-align: center;">
        <a href="${data.invoiceUrl}" class="button button-secondary">Download Invoice</a>
      </p>
      `
          : ''
      }
      
      <p>Thank you for your continued support!</p>
    </div>
  `,
    `Payment received: ${formatCurrency(data.amount, data.currency)}`,
  );

  const text = `
Payment Received

Hi ${data.userName},

Thank you! We've received your payment of ${formatCurrency(data.amount, data.currency)}.

Payment Details:
• Invoice #: ${data.invoiceNumber}
• Amount: ${formatCurrency(data.amount, data.currency)}
• Next billing date: ${formatDate(data.nextBillingDate)}

${data.invoiceUrl ? `Download Invoice: ${data.invoiceUrl}` : ''}

Thank you for your continued support!

- The AIVO Team
  `.trim();

  return {
    subject: `✓ Payment received: ${formatCurrency(data.amount, data.currency)}`,
    html,
    text,
  };
}

// ============================================================================
// Subscription Cancelled Email
// ============================================================================

export function renderSubscriptionCancelledEmail(
  data: SubscriptionCancelledEmailData,
): RenderedEmail {
  const html = wrapHtml(
    `
    <div class="content">
      <h1>Subscription Cancelled</h1>
      <p>Hi ${data.userName},</p>
      <p>We're sorry to see you go! Your AIVO ${data.tier} subscription has been cancelled.</p>
      
      <div class="alert alert-warning">
        <strong>Access Until ${formatDate(data.accessEndsAt)}</strong>
        <p style="margin-bottom: 0;">You'll continue to have full access until your current billing period ends.</p>
      </div>
      
      <p>Changed your mind? You can reactivate your subscription anytime before ${formatDate(data.accessEndsAt)}.</p>
      
      <p style="text-align: center;">
        <a href="${data.reactivateUrl}" class="button">Reactivate Subscription</a>
      </p>
      
      ${
        data.feedbackUrl
          ? `
      <p>We'd love to hear your feedback: <a href="${data.feedbackUrl}">Tell us why you're leaving →</a></p>
      `
          : ''
      }
    </div>
  `,
    'Your AIVO subscription has been cancelled',
  );

  const text = `
Subscription Cancelled

Hi ${data.userName},

We're sorry to see you go! Your AIVO ${data.tier} subscription has been cancelled.

You'll continue to have full access until ${formatDate(data.accessEndsAt)}.

Changed your mind? You can reactivate your subscription anytime before ${formatDate(data.accessEndsAt)}.

Reactivate Subscription: ${data.reactivateUrl}

${data.feedbackUrl ? `We'd love to hear your feedback: ${data.feedbackUrl}` : ''}

- The AIVO Team
  `.trim();

  return {
    subject: 'Your AIVO subscription has been cancelled',
    html,
    text,
  };
}

// ============================================================================
// Template Renderer
// ============================================================================

/**
 * Render an email template based on type and data
 */
export function renderEmailTemplate(type: string, data: Record<string, unknown>): RenderedEmail {
  switch (type) {
    case 'welcome':
      return renderWelcomeEmail(data as unknown as WelcomeEmailData);
    case 'password-reset':
      return renderPasswordResetEmail(data as unknown as PasswordResetEmailData);
    case 'trial-expiring':
      return renderTrialExpiringEmail(data as unknown as TrialExpiringEmailData);
    case 'trial-expired':
      return renderTrialExpiredEmail(data as unknown as TrialExpiredEmailData);
    case 'pilot-expiring':
      return renderPilotExpiringEmail(data as unknown as PilotExpiringEmailData);
    case 'pilot-expired':
      return renderPilotExpiredEmail(data as unknown as PilotExpiredEmailData);
    case 'subscription-activated':
      return renderSubscriptionActivatedEmail(data as unknown as SubscriptionActivatedEmailData);
    case 'payment-failed':
      return renderPaymentFailedEmail(data as unknown as PaymentFailedEmailData);
    case 'payment-succeeded':
      return renderPaymentSucceededEmail(data as unknown as PaymentSucceededEmailData);
    case 'subscription-cancelled':
      return renderSubscriptionCancelledEmail(data as unknown as SubscriptionCancelledEmailData);
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}
