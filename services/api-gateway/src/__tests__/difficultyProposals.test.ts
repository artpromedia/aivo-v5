import { prisma } from '../db';

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
        type: 'district',
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
        name: 'Owner User',
        tenantId,
      },
    });

    await prisma.learner.upsert({
      where: { id: learnerId },
      update: {},
      create: {
        id: learnerId,
        displayName: 'Test Learner',
        currentGrade: 7,
        region: 'north_america',
        tenant: {
          connect: { id: tenantId },
        },
        owner: {
          connect: { id: ownerUserId },
        },
      },
    });
  });

  afterAll(async () => {
    await prismaAny.difficultyProposal.deleteMany({ where: { learnerId } });
    await prisma.learner.deleteMany({ where: { id: learnerId } });
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
        status: 'pending',
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
        status: 'approved',
        decidedById: 'tester',
      },
    });

    expect(updated.status).toBe('approved');
    expect(updated.decidedById).toBe('tester');
  });
});
