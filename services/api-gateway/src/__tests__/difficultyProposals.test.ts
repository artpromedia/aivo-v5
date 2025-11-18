import { prisma } from '../db';
// Simple persistence test hitting Prisma directly, independent of HTTP or AI models.

describe('Difficulty proposals persistence', () => {
  const learnerId = 'test-learner-1';

  beforeAll(async () => {
    // Ensure DB is reachable and seed a learner to satisfy FK constraints
    await prisma.$connect();

    await prisma.learner.upsert({
      where: { id: learnerId },
      update: {},
      create: {
        id: learnerId,
        tenantId: 'test-tenant',
        userId: learnerId,
        displayName: 'Test Learner',
        currentGrade: 7,
        region: 'north_america',
      },
    });
  });

  afterAll(async () => {
    await prisma.difficultyChangeProposal.deleteMany({ where: { learnerId } });
    await prisma.learner.deleteMany({ where: { id: learnerId } });
    await prisma.difficultyChangeProposal.deleteMany({ where: { learnerId } });
    await prisma.$disconnect();
  });

  it('creates and updates a difficulty proposal in the database', async () => {
    const created = await prisma.difficultyChangeProposal.create({
      data: {
        learnerId,
        subject: 'math',
        fromAssessedGradeLevel: 5,
        toAssessedGradeLevel: 6,
        direction: 'harder',
        rationale: 'Test rationale',
        createdBy: 'system',
      },
    });

    expect(created.id).toBeDefined();
    expect(created.learnerId).toBe(learnerId);

    const found = await prisma.difficultyChangeProposal.findMany({
      where: { learnerId },
    });

    expect(found.length).toBe(1);

    const updated = await prisma.difficultyChangeProposal.update({
      where: { id: created.id },
      data: {
        status: 'approved',
        decidedByUserId: 'tester',
      },
    });

    expect(updated.status).toBe('approved');
    expect(updated.decidedByUserId).toBe('tester');
  });
});
