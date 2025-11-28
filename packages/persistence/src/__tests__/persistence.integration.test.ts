import {
  createDifficultyProposal,
  createNotification,
  decideOnProposal,
  getLearnerWithBrainProfile,
  listNotificationsForUser,
  listPendingProposalsForLearner,
  markNotificationRead
} from '..';
import { prisma } from '../client';
import { seedTestData, cleanupTestData, SeedSummary } from './helpers/seed-test-data';

describe('persistence integration', () => {
  let seed: SeedSummary;

  beforeAll(async () => {
    await prisma.$connect();
    seed = await seedTestData(prisma);
  });

  afterAll(async () => {
    await cleanupTestData(prisma, seed);
    await prisma.$disconnect();
  });

  describe('learner context helpers', () => {
    it('returns learner data with synthesized brain profile detail', async () => {
      const learner = await getLearnerWithBrainProfile(seed.learner.id);

      expect(learner).toBeTruthy();
      expect(learner?.brainProfile).toBeDefined();
      expect(learner?.brainProfile.gradeBand).toMatch(/[a-z0-9_]+/i);
      expect(learner?.brainProfile.subjectLevels).toBeDefined();
    });
  });

  describe('difficulty proposal workflow', () => {
    it('creates, lists, and decides on approval requests', async () => {
      const proposal = await createDifficultyProposal({
        learnerId: seed.learner.id,
        tenantId: seed.tenantId,
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
        tenantId: seed.tenantId,
        learnerId: seed.learner.id,
        recipientUserId: seed.guardian.id,
        audience: 'parent',
        type: 'progress_update',
        title: 'Progress bump',
        body: 'Focus improved by 8% this week.'
      });

      expect(notification.status).toBe('unread');

      const inbox = await listNotificationsForUser(seed.guardian.id);
      const created = inbox.find((n) => n.id === notification.id);
      expect(created).toBeDefined();
      expect(created?.status).toBe('unread');

      const result = await markNotificationRead(notification.id);
      expect(result.status).toBe('read');

      const unreadOnly = await listNotificationsForUser(seed.guardian.id, { unreadOnly: true });
      expect(unreadOnly.find((n) => n.id === notification.id)).toBeUndefined();
    });
  });
});
