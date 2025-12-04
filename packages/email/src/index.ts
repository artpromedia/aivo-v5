/**
 * AIVO Email Package
 *
 * Provides email functionality using SendGrid.
 */

// Re-export types
export * from './types';

// Re-export templates
export {
  renderEmailTemplate,
  renderWelcomeEmail,
  renderPasswordResetEmail,
  renderTrialExpiringEmail,
  renderTrialExpiredEmail,
  renderPilotExpiringEmail,
  renderPilotExpiredEmail,
  renderSubscriptionActivatedEmail,
  renderPaymentFailedEmail,
  renderPaymentSucceededEmail,
  renderSubscriptionCancelledEmail,
} from './templates';

// Re-export client
export {
  isEmailConfigured,
  sendEmail,
  sendTemplatedEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendTrialExpiringEmail,
  sendTrialExpiredEmail,
  sendPilotExpiringEmail,
  sendPilotExpiredEmail,
  sendSubscriptionActivatedEmail,
  sendPaymentFailedEmail,
  sendPaymentSucceededEmail,
  sendSubscriptionCancelledEmail,
  shouldSendEmail,
} from './client';
