/**
 * Email Templates Tests
 */

import { renderEmailTemplate } from '../templates';

describe('Email Templates', () => {
  describe('template definitions', () => {
    it('should support all required template types', () => {
      const types = [
        'welcome',
        'password-reset',
        'trial-expiring',
        'trial-expired',
        'subscription-activated',
        'payment-failed',
      ];

      for (const type of types) {
        expect(() => {
          // Each template should not throw when rendering with minimal data
          renderEmailTemplate(type, {
            userName: 'Test',
            loginUrl: 'http://test',
            resetUrl: 'http://test',
            expiresInMinutes: 60,
            daysRemaining: 3,
            trialEndsAt: new Date(),
            pilotEndsAt: new Date(),
            trialEndedAt: new Date(),
            pilotEndedAt: new Date(),
            upgradeUrl: 'http://test',
            contactSalesUrl: 'http://test',
            districtName: 'Test',
            tier: 'BASIC',
            amount: '9.99',
            currency: 'USD',
            nextBillingDate: new Date(),
            receiptUrl: 'http://test',
            invoiceUrl: 'http://test',
            updatePaymentUrl: 'http://test',
            accessEndsAt: new Date(),
            reactivateUrl: 'http://test',
            planName: 'Basic',
            features: ['Feature 1'],
            dashboardUrl: 'http://test',
            failureReason: 'Declined',
            retryDate: 'Jan 1',
          });
        }).not.toThrow();
      }
    });

    it('should throw for unknown template types', () => {
      expect(() => {
        renderEmailTemplate('unknown-template', {});
      }).toThrow('Unknown email template type');
    });
  });

  describe('welcome template', () => {
    const data = {
      userName: 'John',
      loginUrl: 'https://aivo.ai/login',
    };

    it('should render with subject, html, and text', () => {
      const result = renderEmailTemplate('welcome', data);
      expect(result).toHaveProperty('subject');
      expect(result).toHaveProperty('html');
      expect(result).toHaveProperty('text');
    });

    it('should include user name in HTML', () => {
      const result = renderEmailTemplate('welcome', data);
      expect(result.html).toContain('John');
    });
  });

  describe('password-reset template', () => {
    const data = {
      userName: 'Jane',
      resetUrl: 'https://aivo.ai/reset?token=abc123',
      expiresInMinutes: 60,
    };

    it('should include reset URL in HTML', () => {
      const result = renderEmailTemplate('password-reset', data);
      expect(result.html).toContain(data.resetUrl);
      expect(result.html).toContain('Jane');
    });

    it('should include expiration info', () => {
      const result = renderEmailTemplate('password-reset', data);
      expect(result.html).toContain('60');
    });
  });

  describe('trial-expiring template', () => {
    const data = {
      userName: 'Bob',
      daysRemaining: 3,
      trialEndsAt: new Date('2025-01-15'),
      upgradeUrl: 'https://aivo.ai/upgrade',
    };

    it('should include days remaining', () => {
      const result = renderEmailTemplate('trial-expiring', data);
      expect(result.subject).toContain('3');
    });

    it('should include upgrade URL', () => {
      const result = renderEmailTemplate('trial-expiring', data);
      expect(result.html).toContain(data.upgradeUrl);
    });
  });

  describe('subscription-activated template', () => {
    const data = {
      userName: 'Charlie',
      tier: 'PRO',
      amount: 1999, // Amount in cents
      currency: 'USD',
      nextBillingDate: new Date(),
      receiptUrl: 'https://aivo.ai/receipt',
      invoiceUrl: 'https://aivo.ai/invoice',
    };

    it('should include tier in subject', () => {
      const result = renderEmailTemplate('subscription-activated', data);
      expect(result.subject).toContain('PRO');
    });

    it('should include tier and amount', () => {
      const result = renderEmailTemplate('subscription-activated', data);
      expect(result.html).toContain('PRO');
      expect(result.html).toContain('$19.99'); // Formatted from cents
    });
  });

  describe('payment-failed template', () => {
    const data = {
      userName: 'Dave',
      amount: 999, // Amount in cents
      currency: 'USD',
      updatePaymentUrl: 'https://aivo.ai/settings/payment',
    };

    it('should include amount', () => {
      const result = renderEmailTemplate('payment-failed', data);
      expect(result.html).toContain('$9.99'); // Formatted from cents
    });

    it('should include update payment URL', () => {
      const result = renderEmailTemplate('payment-failed', data);
      expect(result.html).toContain(data.updatePaymentUrl);
    });
  });
});
