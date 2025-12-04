import { prisma } from '../db';
import { TenantType, Role, DifficultyProposalStatus } from '@prisma/client';

const prismaAny = prisma as any;
// Simple persistence test hitting Prisma directly, independent of HTTP or AI models.

describe('Difficulty proposals persistence', () => {
  const learnerId = 'test-learner-1';
  const tenantId = 'test-tenant-1';
  const ownerUserId = 'test-user-1';

  beforeAll(async () => {
    // Ensure DB is reachable and seed a learner to satisfy FK constraints
    await prisma.$connect();

    await prisma.tenant.upsert({
      where: { id: tenantId },
      update: {},
      create: {
        id: tenantId,
        type: TenantType.DISTRICT,
        name: 'Test Tenant',
        region: 'north_america',
        isActive: true,
      },
    });

    await prisma.user.upsert({
      where: { id: ownerUserId },
      update: {},
      create: {
        id: ownerUserId,
        email: 'owner@example.com',
        username: 'owner_test',
        password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        role: Role.PARENT,
        tenantId,
      },
    });

    await prisma.learner.upsert({
      where: { id: learnerId },
      update: {},
      create: {
        id: learnerId,
        firstName: 'Test',
        lastName: 'Learner',
        gradeLevel: 7,
        dateOfBirth: new Date('2010-01-01'),
        tenant: {
          connect: { id: tenantId },
        },
        user: {
          create: {
            email: `learner_${Date.now()}@test.com`,
            username: `learner_test_${Date.now()}`,
            password: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
            role: Role.LEARNER,
            tenantId,
          },
        },
        guardian: {
          connect: { id: ownerUserId },
        },
      },
    });
  });

  afterAll(async () => {
    await prismaAny.difficultyProposal.deleteMany({ where: { learnerId } });
    // Get learner to find associated user
    const learner = await prisma.learner.findUnique({ where: { id: learnerId }, select: { userId: true } });
    await prisma.learner.deleteMany({ where: { id: learnerId } });
    if (learner?.userId) {
      await prisma.user.deleteMany({ where: { id: learner.userId } });
    }
    await prisma.user.deleteMany({ where: { id: ownerUserId } });
    await prisma.tenant.deleteMany({ where: { id: tenantId } });
    await prisma.$disconnect();
  });

  it('creates and updates a difficulty proposal in the database', async () => {
    const created = await prismaAny.difficultyProposal.create({
      data: {
        learnerId,
        tenantId,
        subject: 'math',
        fromLevel: 5,
        toLevel: 6,
        direction: 'harder',
        rationale: 'Test rationale',
        createdBy: 'system',
        status: DifficultyProposalStatus.PENDING,
      },
    });

    expect(created.id).toBeDefined();
    expect(created.learnerId).toBe(learnerId);

    const found = await prismaAny.difficultyProposal.findMany({
      where: { learnerId },
    });

    expect(found.length).toBe(1);

    const updated = await prismaAny.difficultyProposal.update({
      where: { id: created.id },
      data: {
        status: DifficultyProposalStatus.APPROVED,
        decidedById: 'tester',
      },
    });

    expect(updated.status).toBe(DifficultyProposalStatus.APPROVED);
    expect(updated.decidedById).toBe('tester');
  });
});
