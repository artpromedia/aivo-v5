import { prisma } from "./index";

export async function recordTelemetryEvent(args: {
  tenantId: string;
  learnerId: string;
  type: string;
  subject?: string;
  payload?: unknown;
}) {
  return (prisma as any).telemetryEvent.create({
    data: {
      tenantId: args.tenantId,
      learnerId: args.learnerId,
      type: args.type,
      subject: args.subject,
      payload: args.payload ?? {}
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
  return (prisma as any).subjectProgressSnapshot.upsert({
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
  const snapshots = await (prisma as any).subjectProgressSnapshot.findMany({
    where: { learnerId, subject },
    orderBy: { date: "asc" }
  });

  return snapshots;
}

export async function getAggregateTenantStats(tenantId: string) {
  const learnersCount = await (prisma as any).learner.count({ where: { tenantId } });

  // Simple aggregate: average minutes across all subjects and days
  const snapshots = await (prisma as any).subjectProgressSnapshot.findMany({
    where: {
      learner: { tenantId }
    }
  });

  const totalMinutes = snapshots.reduce((sum: number, s: any) => sum + s.minutesPracticed, 0);
  const avgMinutes = snapshots.length ? totalMinutes / snapshots.length : 0;

  const avgMastery =
    snapshots.reduce((sum: number, s: any) => sum + s.masteryScore, 0) / (snapshots.length || 1);

  return {
    learnersCount,
    avgMinutesPracticed: avgMinutes,
    avgMasteryScore: avgMastery
  };
}
