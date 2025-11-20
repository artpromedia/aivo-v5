"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordTelemetryEvent = recordTelemetryEvent;
exports.upsertSubjectProgressSnapshot = upsertSubjectProgressSnapshot;
exports.getSubjectTimeseriesForLearner = getSubjectTimeseriesForLearner;
exports.getAggregateTenantStats = getAggregateTenantStats;
const index_1 = require("./index");
async function recordTelemetryEvent(args) {
    return index_1.prisma.telemetryEvent.create({
        data: {
            tenantId: args.tenantId,
            learnerId: args.learnerId,
            type: args.type,
            subject: args.subject,
            payload: args.payload ?? {}
        }
    });
}
async function upsertSubjectProgressSnapshot(args) {
    return index_1.prisma.subjectProgressSnapshot.upsert({
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
async function getSubjectTimeseriesForLearner(learnerId, subject) {
    const snapshots = await index_1.prisma.subjectProgressSnapshot.findMany({
        where: { learnerId, subject },
        orderBy: { date: "asc" }
    });
    return snapshots;
}
async function getAggregateTenantStats(tenantId) {
    const learnersCount = await index_1.prisma.learner.count({ where: { tenantId } });
    // Simple aggregate: average minutes across all subjects and days
    const snapshots = await index_1.prisma.subjectProgressSnapshot.findMany({
        where: {
            learner: { tenantId }
        }
    });
    const totalMinutes = snapshots.reduce((sum, s) => sum + s.minutesPracticed, 0);
    const avgMinutes = snapshots.length ? totalMinutes / snapshots.length : 0;
    const avgMastery = snapshots.reduce((sum, s) => sum + s.masteryScore, 0) / (snapshots.length || 1);
    return {
        learnersCount,
        avgMinutesPracticed: avgMinutes,
        avgMasteryScore: avgMastery
    };
}
