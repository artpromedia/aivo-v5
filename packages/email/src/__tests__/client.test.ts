/**
 * Email Client Tests
 */

import { renderEmailTemplate } from '../templates';

// Note: Integration tests for sendEmail/sendTemplatedEmail require SENDGRID_API_KEY
// These tests focus on template rendering since the client checks the API key at module load

describe('Email Client via Template Rendering', () => {
  describe('welcome template', () => {
    it('should render a complete welcome email', () => {
      const result = renderEmailTemplate('welcome', {
        userName: 'John',
        loginUrl: 'https://aivo.ai/login',
      });

      expect(result.subject).toContain('Welcome');
      expect(result.html).toContain('John');
      expect(result.html).toContain('https://aivo.ai/login');
      expect(result.text).toContain('John');
    });
  });

  describe('password-reset template', () => {
    it('should render a complete password reset email', () => {
      const result = renderEmailTemplate('password-reset', {
        userName: 'Jane',
        resetUrl: 'https://aivo.ai/reset?token=abc123',
        expiresInMinutes: 60,
      });

      expect(result.subject).toContain('Reset');
      expect(result.html).toContain('Jane');
      expect(result.html).toContain('https://aivo.ai/reset?token=abc123');
      expect(result.html).toContain('60');
    });
  });

  describe('trial-expiring template', () => {
    it('should render a complete trial expiring email', () => {
      const result = renderEmailTemplate('trial-expiring', {
        userName: 'Bob',
        daysRemaining: 3,
        trialEndsAt: new Date('2025-01-15'),
        upgradeUrl: 'https://aivo.ai/upgrade',
      });

      expect(result.subject).toContain('3');
      expect(result.html).toContain('Bob');
      expect(result.html).toContain('https://aivo.ai/upgrade');
    });
  });

  describe('trial-expired template', () => {
    it('should render a complete trial expired email', () => {
      const result = renderEmailTemplate('trial-expired', {
        userName: 'Alice',
        trialEndedAt: new Date(),
        upgradeUrl: 'https://aivo.ai/upgrade',
      });

      expect(result.subject.toLowerCase()).toContain('ended');
      expect(result.html).toContain('Alice');
      expect(result.html).toContain('https://aivo.ai/upgrade');
    });
  });

  describe('subscription-activated template', () => {
    it('should render a complete subscription activated email', () => {
      const result = renderEmailTemplate('subscription-activated', {
        userName: 'Charlie',
        tier: 'PRO',
        amount: 1999, // Amount in cents
        currency: 'USD',
        nextBillingDate: new Date('2025-02-01'),
        receiptUrl: 'https://aivo.ai/receipt',
        invoiceUrl: 'https://aivo.ai/invoice',
      });

      expect(result.subject).toContain('PRO');
      expect(result.html).toContain('Charlie');
      expect(result.html).toContain('PRO');
      expect(result.html).toContain('$19.99'); // Formatted from cents
    });
  });

  describe('payment-failed template', () => {
    it('should render a complete payment failed email', () => {
      const result = renderEmailTemplate('payment-failed', {
        userName: 'Dave',
        amount: 999, // Amount in cents
        currency: 'USD',
        updatePaymentUrl: 'https://aivo.ai/settings/payment',
      });

      expect(result.subject.toLowerCase()).toContain('failed');
      expect(result.html).toContain('Dave');
      expect(result.html).toContain('$9.99'); // Formatted from cents
      expect(result.html).toContain('https://aivo.ai/settings/payment');
    });
  });

  describe('payment-succeeded template', () => {
    it('should render a complete payment succeeded email', () => {
      const result = renderEmailTemplate('payment-succeeded', {
        userName: 'Eve',
        amount: 2999,
        currency: 'USD',
        invoiceNumber: 'INV-001',
        nextBillingDate: new Date('2025-02-01'),
      });

      expect(result.html).toContain('Eve');
      expect(result.html).toContain('$29.99');
    });
  });

  describe('subscription-cancelled template', () => {
    it('should render a complete subscription cancelled email', () => {
      const result = renderEmailTemplate('subscription-cancelled', {
        userName: 'Frank',
        tier: 'BASIC',
        accessEndsAt: new Date('2025-02-01'),
        reactivateUrl: 'https://aivo.ai/reactivate',
      });

      expect(result.subject.toLowerCase()).toContain('cancelled');
      expect(result.html).toContain('Frank');
      expect(result.html).toContain('https://aivo.ai/reactivate');
    });
  });
});
