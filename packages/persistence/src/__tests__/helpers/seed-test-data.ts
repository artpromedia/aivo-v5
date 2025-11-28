import { PrismaClient, Role, AssessmentType, AssessmentStatus, DomainType, GoalStatus, TenantType } from '@prisma/client';

export interface SeedSummary {
  guardian: { id: string; username: string };
  admin: { id: string; username: string };
  teacher: { id: string; username: string };
  learner: { id: string; userId: string; firstName: string };
  classId: string;
  tenantId: string;
}

const PASSWORD_PLACEHOLDER = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

export async function seedTestData(prisma: PrismaClient): Promise<SeedSummary> {
  // Create tenant first
  const tenant = await prisma.tenant.create({
    data: {
      name: `test_tenant_${Date.now()}`,
      type: TenantType.DISTRICT,
      region: 'north_america',
      isActive: true
    }
  });

  // Create users
  const adminUser = await prisma.user.create({
    data: {
      username: `admin_test_${Date.now()}`,
      email: `admin_${Date.now()}@aivo.test`,
      password: PASSWORD_PLACEHOLDER,
      role: Role.SUPER_ADMIN
    }
  });

  const guardianUser = await prisma.user.create({
    data: {
      username: `guardian_test_${Date.now()}`,
      email: `guardian_${Date.now()}@aivo.test`,
      password: PASSWORD_PLACEHOLDER,
      role: Role.PARENT
    }
  });

  const teacherUser = await prisma.user.create({
    data: {
      username: `teacher_test_${Date.now()}`,
      email: `teacher_${Date.now()}@aivo.test`,
      password: PASSWORD_PLACEHOLDER,
      role: Role.TEACHER
    }
  });

  const learnerUser = await prisma.user.create({
    data: {
      username: `learner_test_${Date.now()}`,
      email: `learner_${Date.now()}@aivo.test`,
      password: PASSWORD_PLACEHOLDER,
      role: Role.LEARNER
    }
  });

  // Create learner
  const learner = await prisma.learner.create({
    data: {
      userId: learnerUser.id,
      guardianId: guardianUser.id,
      firstName: 'TestLearner',
      lastName: 'Seed',
      dateOfBirth: new Date('2015-03-15'),
      gradeLevel: 4,
      actualLevel: 3.2
    }
  });

  // Create assessment for brain profile synthesis
  await prisma.assessment.create({
    data: {
      learnerId: learner.id,
      type: AssessmentType.BASELINE,
      status: AssessmentStatus.COMPLETED,
      startedAt: new Date(),
      completedAt: new Date(),
      overallLevel: 3.1,
      domains: {
        create: [
          {
            domain: DomainType.READING,
            questions: { items: 24 },
            responses: { correct: 18, incorrect: 6 },
            score: 0.75,
            level: 3.0
          },
          {
            domain: DomainType.MATH,
            questions: { items: 24 },
            responses: { correct: 16, incorrect: 8 },
            score: 0.67,
            level: 3.2
          }
        ]
      },
      results: { focus: 0.68, persistence: 0.8 }
    }
  });

  // Create IEP goal
  await prisma.iEPGoal.create({
    data: {
      learnerId: learner.id,
      goal: 'Improve reading comprehension',
      category: 'Literacy',
      targetDate: new Date('2025-05-30'),
      status: GoalStatus.IN_PROGRESS,
      progress: 0.42
    }
  });

  // Create class
  const homeroom = await prisma.class.create({
    data: {
      name: 'Test Class',
      description: 'Test class for integration tests',
      gradeLevel: 4,
      teacherId: teacherUser.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000)
    }
  });

  return {
    guardian: { id: guardianUser.id, username: guardianUser.username },
    admin: { id: adminUser.id, username: adminUser.username },
    teacher: { id: teacherUser.id, username: teacherUser.username },
    learner: { id: learner.id, userId: learnerUser.id, firstName: learner.firstName },
    classId: homeroom.id,
    tenantId: tenant.id
  };
}

export async function cleanupTestData(prisma: PrismaClient, seed: SeedSummary): Promise<void> {
  // Clean up in reverse order of dependencies
  try {
    await prisma.extendedNotification.deleteMany({ where: { tenantId: seed.tenantId } });
    await prisma.difficultyProposal.deleteMany({ where: { tenantId: seed.tenantId } });
    await prisma.notification.deleteMany({ where: { learnerId: seed.learner.id } });
    await prisma.approvalRequest.deleteMany({ where: { learnerId: seed.learner.id } });
    await prisma.class.deleteMany({ where: { id: seed.classId } });
    await prisma.iEPGoal.deleteMany({ where: { learnerId: seed.learner.id } });
    await prisma.assessmentDomain.deleteMany({ 
      where: { assessment: { learnerId: seed.learner.id } } 
    });
    await prisma.assessment.deleteMany({ where: { learnerId: seed.learner.id } });
    await prisma.learner.deleteMany({ where: { id: seed.learner.id } });
    await prisma.user.deleteMany({ 
      where: { 
        id: { 
          in: [seed.guardian.id, seed.admin.id, seed.teacher.id, seed.learner.userId] 
        } 
      } 
    });
    await prisma.tenant.deleteMany({ where: { id: seed.tenantId } });
  } catch (error) {
    console.warn('Cleanup error (may be expected if data was already cleaned):', error);
  }
}
