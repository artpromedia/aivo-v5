/**
 * Stripe Service
 *
 * Handles Stripe integration for subscription management.
 * Provides checkout session creation, customer portal, and webhook processing.
 */

import Stripe from 'stripe';
import {
  getSubscriptionByTenantId,
  getSubscriptionByStripeCustomerId,
  getSubscriptionByStripeSubscriptionId,
  upsertSubscription,
  updateSubscriptionByStripeSubscriptionId,
  createPayment,
  getPaymentByStripeInvoiceId,
  updatePaymentByStripeInvoiceId,
  prisma,
} from '@aivo/persistence';
import type { SubscriptionStatus, SubscriptionTier } from '@aivo/types';
import { sendTemplatedEmail, isEmailConfigured } from '@aivo/email';

// ============================================================================
// Configuration
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

if (!STRIPE_SECRET_KEY) {
  console.warn(
    '[stripe-service] STRIPE_SECRET_KEY not set. Stripe functionality will be disabled.',
  );
}

// Initialize Stripe client
const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-06-20',
      typescript: true,
    })
  : null;

// ============================================================================
// Price ID Mapping
// ============================================================================

/**
 * Map tier to Stripe price ID
 * These should be configured in environment variables for each tier
 */
const PRICE_IDS: Record<SubscriptionTier, string | undefined> = {
  FREE: undefined, // No Stripe price for free tier
  BASIC: process.env.STRIPE_PRICE_BASIC,
  PRO: process.env.STRIPE_PRICE_PRO,
  ENTERPRISE: process.env.STRIPE_PRICE_ENTERPRISE,
};

/**
 * Map Stripe price ID to tier
 */
function getTierFromPriceId(priceId: string): SubscriptionTier {
  for (const [tier, id] of Object.entries(PRICE_IDS)) {
    if (id === priceId) return tier as SubscriptionTier;
  }
  return 'BASIC'; // Default to BASIC if unknown
}

// ============================================================================
// Stripe Status Mapping
// ============================================================================

/**
 * Map Stripe subscription status to our SubscriptionStatus
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): SubscriptionStatus {
  switch (stripeStatus) {
    case 'active':
      return 'ACTIVE';
    case 'past_due':
      return 'PAST_DUE';
    case 'canceled':
      return 'CANCELLED';
    case 'unpaid':
      return 'EXPIRED';
    case 'trialing':
      return 'TRIAL_ACTIVE';
    case 'incomplete':
    case 'incomplete_expired':
      return 'NONE';
    default:
      return 'NONE';
  }
}

/**
 * Get feature list for a subscription tier (for email templates)
 */
function getFeatureList(tier: SubscriptionTier | string): string[] {
  switch (tier) {
    case 'ENTERPRISE':
      return [
        'Unlimited learner profiles',
        'Advanced AI tutoring with custom models',
        'Priority support with dedicated success manager',
        'Custom integrations and API access',
        'Advanced analytics and reporting',
        'Single sign-on (SSO) support',
      ];
    case 'PRO':
      return [
        'Up to 50 learner profiles',
        'Advanced AI tutoring',
        'Priority email support',
        'Detailed progress reports',
        'Custom curriculum builder',
      ];
    case 'BASIC':
    default:
      return [
        'Up to 5 learner profiles',
        'AI-powered tutoring',
        'Email support',
        'Progress tracking',
        'Core curriculum access',
      ];
  }
}

// ============================================================================
// Checkout Session
// ============================================================================

export interface CreateCheckoutSessionInput {
  tenantId: string;
  tier: SubscriptionTier;
  email: string;
  successUrl?: string;
  cancelUrl?: string;
}

export interface CreateCheckoutSessionResult {
  success: boolean;
  sessionId?: string;
  url?: string;
  error?: string;
}

/**
 * Create a Stripe checkout session for subscription
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput,
): Promise<CreateCheckoutSessionResult> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  const priceId = PRICE_IDS[input.tier];
  if (!priceId) {
    return { success: false, error: `No price configured for tier: ${input.tier}` };
  }

  try {
    // Get or create subscription record to get Stripe customer ID
    const subscription = await getSubscriptionByTenantId(input.tenantId);
    const stripeCustomerId = subscription?.stripeCustomerId;

    // If no customer exists, we'll let Stripe create one
    // and link it via webhook

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer: stripeCustomerId ?? undefined,
      customer_email: !stripeCustomerId ? input.email : undefined,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        input.successUrl || `${APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: input.cancelUrl || `${APP_URL}/subscription/cancel`,
      metadata: {
        tenantId: input.tenantId,
        tier: input.tier,
      },
      subscription_data: {
        metadata: {
          tenantId: input.tenantId,
          tier: input.tier,
        },
      },
    });

    return {
      success: true,
      sessionId: session.id,
      url: session.url ?? undefined,
    };
  } catch (err) {
    console.error('[stripe-service] Failed to create checkout session:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create checkout session',
    };
  }
}

// ============================================================================
// Customer Portal
// ============================================================================

export interface CreatePortalSessionInput {
  tenantId: string;
  returnUrl?: string;
}

export interface CreatePortalSessionResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  input: CreatePortalSessionInput,
): Promise<CreatePortalSessionResult> {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  try {
    const subscription = await getSubscriptionByTenantId(input.tenantId);

    if (!subscription?.stripeCustomerId) {
      return { success: false, error: 'No Stripe customer found for this tenant' };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: input.returnUrl || `${APP_URL}/settings/subscription`,
    });

    return {
      success: true,
      url: session.url,
    };
  } catch (err) {
    console.error('[stripe-service] Failed to create portal session:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create portal session',
    };
  }
}

// ============================================================================
// Webhook Handling
// ============================================================================

export interface WebhookResult {
  success: boolean;
  eventType?: string;
  error?: string;
}

/**
 * Verify and parse Stripe webhook payload
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
): { success: boolean; event?: Stripe.Event; error?: string } {
  if (!stripe) {
    return { success: false, error: 'Stripe not configured' };
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    return { success: false, error: 'Webhook secret not configured' };
  }

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET);
    return { success: true, event };
  } catch (err) {
    console.error('[stripe-service] Webhook signature verification failed:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Invalid signature',
    };
  }
}

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const tenantId = session.metadata?.tenantId;
  const tier = session.metadata?.tier as SubscriptionTier | undefined;
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  if (!tenantId) {
    console.warn('[stripe-service] No tenantId in checkout session metadata');
    return;
  }

  // Update subscription with Stripe IDs
  await upsertSubscription(tenantId, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    status: 'ACTIVE',
    tier: tier || 'BASIC',
  });

  console.log(`[stripe-service] Checkout completed for tenant ${tenantId}`);

  // Send subscription activated email
  if (isEmailConfigured()) {
    try {
      // Find a user in this tenant to email
      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        include: {
          users: {
            where: { emailOptOut: false },
            take: 1,
          },
        },
      });

      if (tenant?.users[0]?.email) {
        const user = tenant.users[0];
        await sendTemplatedEmail({
          to: user.email,
          template: 'subscription-activated',
          data: {
            userName: user.firstName || 'there',
            planName: tier || 'Basic',
            features: getFeatureList(tier || 'BASIC'),
            dashboardUrl: `${APP_URL}/dashboard`,
          },
        });
        console.log(`[stripe-service] Subscription activated email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.error('[stripe-service] Failed to send subscription activated email:', emailErr);
    }
  }
}

/**
 * Handle invoice.paid event
 */
async function handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  const subscriptionId = invoice.subscription as string | null;

  if (!subscriptionId) {
    console.log('[stripe-service] Invoice paid but no subscription ID');
    return;
  }

  // Get subscription by Stripe customer ID
  const subscription = await getSubscriptionByStripeCustomerId(customerId);
  if (!subscription) {
    console.warn(`[stripe-service] No subscription found for customer ${customerId}`);
    return;
  }

  // Create or update payment record
  const existingPayment = await getPaymentByStripeInvoiceId(invoice.id);

  if (existingPayment) {
    await updatePaymentByStripeInvoiceId(invoice.id, {
      status: 'succeeded',
      invoicePdfUrl: invoice.invoice_pdf ?? undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
    });
  } else {
    await createPayment({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      stripePaymentIntentId: invoice.payment_intent as string | undefined,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      invoiceNumber: invoice.number ?? undefined,
      invoicePdfUrl: invoice.invoice_pdf ?? undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      description: invoice.description ?? undefined,
    });
  }

  console.log(`[stripe-service] Invoice paid for subscription ${subscription.id}`);
}

/**
 * Handle invoice.payment_failed event
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;

  const subscription = await getSubscriptionByStripeCustomerId(customerId);
  if (!subscription) {
    console.warn(`[stripe-service] No subscription found for customer ${customerId}`);
    return;
  }

  // Update subscription status to PAST_DUE
  await upsertSubscription(subscription.tenantId, {
    status: 'PAST_DUE',
  });

  // Create payment record with failure
  const existingPayment = await getPaymentByStripeInvoiceId(invoice.id);
  const failureMessage = invoice.last_finalization_error?.message;

  if (existingPayment) {
    await updatePaymentByStripeInvoiceId(invoice.id, {
      status: 'failed',
      failureReason: failureMessage,
    });
  } else {
    await createPayment({
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      invoiceNumber: invoice.number ?? undefined,
      description: invoice.description ?? undefined,
      failureReason: failureMessage,
    });
  }

  console.log(`[stripe-service] Invoice payment failed for subscription ${subscription.id}`);

  // Send payment failed email
  if (isEmailConfigured()) {
    try {
      // Find a user in this tenant to email
      const tenant = await prisma.tenant.findUnique({
        where: { id: subscription.tenantId },
        include: {
          users: {
            where: { emailOptOut: false },
            take: 1,
          },
        },
      });

      if (tenant?.users[0]?.email) {
        const user = tenant.users[0];
        await sendTemplatedEmail({
          to: user.email,
          template: 'payment-failed',
          data: {
            userName: user.firstName || 'there',
            amount: (invoice.amount_due / 100).toFixed(2),
            failureReason: failureMessage || 'Payment could not be processed',
            updatePaymentUrl: `${APP_URL}/settings/subscription?update-payment=true`,
            retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
          },
        });
        console.log(`[stripe-service] Payment failed email sent to ${user.email}`);
      }
    } catch (emailErr) {
      console.error('[stripe-service] Failed to send payment failed email:', emailErr);
    }
  }
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscription.id);

  if (!subscription) {
    console.warn(
      `[stripe-service] No subscription found for Stripe subscription ${stripeSubscription.id}`,
    );
    return;
  }

  const status = mapStripeStatus(stripeSubscription.status);
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tier = priceId ? getTierFromPriceId(priceId) : undefined;

  await updateSubscriptionByStripeSubscriptionId(stripeSubscription.id, {
    status,
    tier,
    stripePriceId: priceId,
    currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
    currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    cancelledAt: stripeSubscription.canceled_at
      ? new Date(stripeSubscription.canceled_at * 1000)
      : undefined,
  });

  console.log(`[stripe-service] Subscription updated: ${subscription.id} -> ${status}`);
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(stripeSubscription: Stripe.Subscription): Promise<void> {
  const subscription = await getSubscriptionByStripeSubscriptionId(stripeSubscription.id);

  if (!subscription) {
    console.warn(
      `[stripe-service] No subscription found for Stripe subscription ${stripeSubscription.id}`,
    );
    return;
  }

  await updateSubscriptionByStripeSubscriptionId(stripeSubscription.id, {
    status: 'CANCELLED',
    cancelledAt: new Date(),
  });

  console.log(`[stripe-service] Subscription deleted: ${subscription.id}`);
}

/**
 * Process a Stripe webhook event
 */
export async function handleWebhookEvent(event: Stripe.Event): Promise<WebhookResult> {
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`[stripe-service] Unhandled event type: ${event.type}`);
    }

    return { success: true, eventType: event.type };
  } catch (err) {
    console.error(`[stripe-service] Error handling ${event.type}:`, err);
    return {
      success: false,
      eventType: event.type,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Stripe is configured and available
 */
export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Get subscription info for a tenant (enriched with Stripe data)
 */
export async function getSubscriptionInfo(tenantId: string) {
  const subscription = await getSubscriptionByTenantId(tenantId);

  if (!subscription) {
    return {
      status: 'NONE' as SubscriptionStatus,
      tier: 'FREE' as SubscriptionTier,
      canAccessPlatform: false,
      requiresPayment: true,
    };
  }

  const canAccessPlatform = ['TRIAL_ACTIVE', 'PILOT_ACTIVE', 'ACTIVE'].includes(
    subscription.status,
  );

  const requiresPayment = [
    'TRIAL_EXPIRED',
    'TRIAL_CANCELLED',
    'PILOT_EXPIRED',
    'PILOT_CANCELLED',
    'PAST_DUE',
    'CANCELLED',
    'EXPIRED',
  ].includes(subscription.status);

  return {
    id: subscription.id,
    status: subscription.status as SubscriptionStatus,
    tier: subscription.tier as SubscriptionTier,
    stripeCustomerId: subscription.stripeCustomerId,
    stripeSubscriptionId: subscription.stripeSubscriptionId,
    trialStartedAt: subscription.trialStartedAt,
    trialEndsAt: subscription.trialEndsAt,
    hasUsedTrial: subscription.hasUsedTrial,
    pilotStartedAt: subscription.pilotStartedAt,
    pilotEndsAt: subscription.pilotEndsAt,
    hasUsedPilot: subscription.hasUsedPilot,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
    canAccessPlatform,
    requiresPayment,
  };
}
