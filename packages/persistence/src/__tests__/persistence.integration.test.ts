import { PersonalizedModelStatus } from '@prisma/client';
import {
  createDifficultyProposal,
  createNotification,
  decideOnProposal,
  getLearnerWithBrainProfile,
  listNotificationsForUser,
  listPendingProposalsForLearner,
  markNotificationRead,
  upsertPersonalizedModel
} from '..';
import { prisma } from '../client';
// @ts-ignore: integration tests reuse repo-level seed helper outside package root
import { seedCoreData, SeedSummary } from '../../../../scripts/seed-core-data';

describe('persistence integration', () => {
  let seed: SeedSummary;

  beforeAll(async () => {
    await prisma.$connect();
    seed = await seedCoreData(prisma as any);
  });

  describe('learner context helpers', () => {
    it('returns learner data with synthesized brain profile detail', async () => {
      const learner = await getLearnerWithBrainProfile(seed.learner.id);

      expect(learner).toBeTruthy();
      expect(learner?.brainProfile).toBeDefined();
      expect(learner?.brainProfile.gradeBand).toMatch(/[a-z0-9_]+/i);
      expect(learner?.brainProfile.subjectLevels).toBeDefined();
    });

    it('upserts personalized models with incremental updates', async () => {
      const created = await upsertPersonalizedModel({
        learnerId: seed.learner.id,
        modelId: 'integration-model',
  status: PersonalizedModelStatus.ACTIVE,
        configuration: {
          reinforcement: 'encouraging',
          subjectLevels: [{ subject: 'reading', level: 3.2 }]
        }
      });

  expect(created.status).toBe(PersonalizedModelStatus.ACTIVE);
      expect(created.configuration).toMatchObject({ reinforcement: 'encouraging' });

      const updated = await upsertPersonalizedModel({
        learnerId: seed.learner.id,
  status: PersonalizedModelStatus.UPDATING,
        performanceMetrics: { mae: 0.12 }
      });

  expect(updated.status).toBe(PersonalizedModelStatus.UPDATING);
      expect(updated.performanceMetrics).toMatchObject({ mae: 0.12 });
    });
  });

  describe('difficulty proposal workflow', () => {
    it('creates, lists, and decides on approval requests', async () => {
      const proposal = await createDifficultyProposal({
        learnerId: seed.learner.id,
        requesterId: seed.teacher.id,
        approverId: seed.admin.id,
        subject: 'math',
        fromLevel: 3.1,
        toLevel: 3.4,
        direction: 'harder',
        rationale: 'Sustained mastery in session plans',
        createdBy: 'teacher'
      });

      expect(proposal.status).toBe('PENDING');

      const pending = await listPendingProposalsForLearner(seed.learner.id);
      expect(pending.some((p) => p.id === proposal.id)).toBe(true);

      const decision = await decideOnProposal({
        proposalId: proposal.id,
        approve: true,
        decidedById: seed.admin.id,
        notes: 'Confirmed with MTSS team'
      });

      expect(decision.status).toBe('APPROVED');
    });
  });

  describe('notification lifecycle', () => {
    it('creates notifications and marks them as read', async () => {
      const notification = await createNotification({
        tenantId: 'demo-tenant',
        learnerId: seed.learner.id,
        recipientUserId: seed.guardian.id,
        audience: 'parent',
        type: 'progress_update',
        title: 'Progress bump',
        body: 'Focus improved by 8% this week.'
      });

      expect(notification.read).toBe(false);

      const inbox = await listNotificationsForUser(seed.guardian.id);
      const created = inbox.find((n) => n.id === notification.id);
      expect(created).toBeDefined();
      expect(created?.status).toBe('unread');

      const result = await markNotificationRead({
        notificationId: notification.id,
        userId: seed.guardian.id
      });
      expect(result.count).toBe(1);

      const unreadOnly = await listNotificationsForUser(seed.guardian.id, { unreadOnly: true });
      expect(unreadOnly.find((n) => n.id === notification.id)).toBeUndefined();
    });
  });
});
