import { prisma } from "./client";

export async function recordTelemetryEvent(args: {
  tenantId: string;
  learnerId: string;
  type: string;
  subject?: string;
  payload?: unknown;
}) {
  return prisma.telemetryEvent.create({
    data: {
      tenantId: args.tenantId,
      learnerId: args.learnerId,
      type: args.type,
      subject: args.subject,
      payload: (args.payload ?? {}) as object
    }
  });
}

export async function upsertSubjectProgressSnapshot(args: {
  learnerId: string;
  subject: string;
  date: string;
  masteryScore: number;
  minutesPracticed: number;
  difficultyLevel: number;
}) {
  return prisma.subjectProgressSnapshot.upsert({
    where: {
      learnerId_subject_date: {
        learnerId: args.learnerId,
        subject: args.subject,
        date: args.date
      }
    },
    create: {
      learnerId: args.learnerId,
      subject: args.subject,
      date: args.date,
      masteryScore: args.masteryScore,
      minutesPracticed: args.minutesPracticed,
      difficultyLevel: args.difficultyLevel
    },
    update: {
      masteryScore: args.masteryScore,
      minutesPracticed: args.minutesPracticed,
      difficultyLevel: args.difficultyLevel
    }
  });
}

export async function getSubjectTimeseriesForLearner(learnerId: string, subject: string) {
  const snapshots = await prisma.subjectProgressSnapshot.findMany({
    where: { learnerId, subject },
    orderBy: { date: "asc" }
  });

  return snapshots;
}

export async function getAggregateTenantStats(tenantId: string) {
  const learnersCount = await prisma.learner.count({ where: { tenantId } });

  // Simple aggregate: average minutes across all subjects and days
  const snapshots = await prisma.subjectProgressSnapshot.findMany({
    where: {
      learner: { tenantId }
    }
  });

  const totalMinutes = snapshots.reduce((sum: number, s) => sum + s.minutesPracticed, 0);
  const avgMinutes = snapshots.length ? totalMinutes / snapshots.length : 0;

  const avgMastery =
    snapshots.reduce((sum: number, s) => sum + s.masteryScore, 0) / (snapshots.length || 1);

  return {
    learnersCount,
    avgMinutesPracticed: avgMinutes,
    avgMasteryScore: avgMastery
  };
}
