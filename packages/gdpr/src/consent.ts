/**
 * Consent Management Service
 * Handles user consent preferences for GDPR compliance
 */

import { info, recordMetric } from '@aivo/observability';
import type { ConsentPreferences, ConsentType, ConsentUpdate } from './types';

// Use any for prisma to avoid type issues before prisma generate
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PrismaClientAny = any;

export class ConsentService {
  private prisma: PrismaClientAny;

  constructor(prisma: PrismaClientAny) {
    this.prisma = prisma;
  }

  /**
   * Get all consent preferences for a user
   */
  async getConsents(userId: string): Promise<ConsentPreferences> {
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId },
    });

    return {
      userId,
      consents: consents.map(
        (c: {
          consentType: string;
          granted: boolean;
          grantedAt?: Date | null;
          revokedAt?: Date | null;
          version: string;
        }) => ({
          type: c.consentType,
          granted: c.granted,
          grantedAt: c.grantedAt || undefined,
          revokedAt: c.revokedAt || undefined,
          version: c.version,
        }),
      ),
    };
  }

  /**
   * Update a single consent preference
   */
  async updateConsent(
    userId: string,
    update: ConsentUpdate,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const now = new Date();

    await this.prisma.consentRecord.upsert({
      where: {
        userId_consentType: {
          userId,
          consentType: update.consentType as ConsentType,
        },
      },
      create: {
        userId,
        consentType: update.consentType as ConsentType,
        granted: update.granted,
        version: update.version || '1.0',
        grantedAt: update.granted ? now : null,
        revokedAt: update.granted ? null : now,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
      update: {
        granted: update.granted,
        version: update.version || '1.0',
        grantedAt: update.granted ? now : undefined,
        revokedAt: update.granted ? null : now,
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    info('Consent updated', {
      userId,
      meta: { consentType: update.consentType },
    });

    recordMetric({
      name: 'gdpr_consent_updated',
      value: 1,
      labels: {
        consent_type: update.consentType,
        granted: String(update.granted),
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Update multiple consent preferences at once
   */
  async updateConsents(
    userId: string,
    updates: ConsentUpdate[],
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    for (const update of updates) {
      await this.updateConsent(userId, update, metadata);
    }
  }

  /**
   * Check if a user has granted a specific consent
   */
  async hasConsent(userId: string, consentType: ConsentType): Promise<boolean> {
    const consent = await this.prisma.consentRecord.findUnique({
      where: {
        userId_consentType: {
          userId,
          consentType,
        },
      },
    });

    return consent?.granted ?? false;
  }

  /**
   * Check if a user has granted all required consents
   */
  async hasRequiredConsents(userId: string): Promise<boolean> {
    const requiredConsents: ConsentType[] = [
      'TERMS_OF_SERVICE',
      'PRIVACY_POLICY',
      'DATA_PROCESSING',
    ];

    const consents = await this.prisma.consentRecord.findMany({
      where: {
        userId,
        consentType: { in: requiredConsents },
        granted: true,
      },
    });

    return consents.length === requiredConsents.length;
  }

  /**
   * Revoke all consents for a user (used during account deletion)
   */
  async revokeAllConsents(userId: string): Promise<void> {
    const now = new Date();

    await this.prisma.consentRecord.updateMany({
      where: { userId, granted: true },
      data: {
        granted: false,
        revokedAt: now,
      },
    });

    info('All consents revoked', { userId });
    recordMetric({
      name: 'gdpr_all_consents_revoked',
      value: 1,
      timestamp: Date.now(),
    });
  }

  /**
   * Grant initial required consents (during registration)
   */
  async grantInitialConsents(
    userId: string,
    metadata?: { ipAddress?: string; userAgent?: string },
  ): Promise<void> {
    const requiredConsents: ConsentType[] = [
      'TERMS_OF_SERVICE',
      'PRIVACY_POLICY',
      'DATA_PROCESSING',
    ];

    const now = new Date();

    for (const consentType of requiredConsents) {
      await this.prisma.consentRecord.upsert({
        where: {
          userId_consentType: {
            userId,
            consentType,
          },
        },
        create: {
          userId,
          consentType,
          granted: true,
          version: '1.0',
          grantedAt: now,
          ipAddress: metadata?.ipAddress,
          userAgent: metadata?.userAgent,
        },
        update: {
          granted: true,
          grantedAt: now,
        },
      });
    }

    info('Initial consents granted', { userId });
    recordMetric({
      name: 'gdpr_initial_consents_granted',
      value: 1,
      timestamp: Date.now(),
    });
  }

  /**
   * Get consent audit trail for a user
   */
  async getConsentHistory(
    userId: string,
  ): Promise<Array<{ type: string; granted: boolean; timestamp: Date }>> {
    const consents = await this.prisma.consentRecord.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    // Build a simplified audit trail
    const history: Array<{ type: string; granted: boolean; timestamp: Date }> = [];

    for (const consent of consents) {
      if (consent.grantedAt) {
        history.push({
          type: consent.consentType,
          granted: true,
          timestamp: consent.grantedAt,
        });
      }
      if (consent.revokedAt) {
        history.push({
          type: consent.consentType,
          granted: false,
          timestamp: consent.revokedAt,
        });
      }
    }

    return history.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
