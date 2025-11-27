"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSessionForLearnerToday = getSessionForLearnerToday;
exports.createSession = createSession;
exports.startSession = startSession;
exports.updateActivityStatus = updateActivityStatus;
exports.getRecentSessions = getRecentSessions;
exports.getSessionById = getSessionById;
const client_1 = require("./client");
/**
 * Get a session for a learner on a specific date and subject
 */
async function getSessionForLearnerToday(learnerId, subject, date) {
    const session = await client_1.prisma.session.findFirst({
        where: {
            learnerId,
            subject,
            date
        },
        include: {
            activities: true
        },
        orderBy: { createdAt: "desc" }
    });
    if (!session)
        return null;
    return mapSessionToResponse(session);
}
/**
 * Create a new learning session with activities
 */
async function createSession(input) {
    const session = await client_1.prisma.session.create({
        data: {
            learnerId: input.learnerId,
            tenantId: input.tenantId,
            date: input.date,
            subject: input.subject,
            status: "planned",
            plannedMinutes: input.plannedMinutes,
            activities: {
                create: input.activities.map(a => ({
                    learnerId: input.learnerId,
                    subject: input.subject,
                    type: a.type,
                    title: a.title,
                    instructions: a.instructions,
                    estimatedMinutes: a.estimatedMinutes,
                    status: a.status
                }))
            }
        },
        include: {
            activities: true
        }
    });
    return mapSessionToResponse(session);
}
/**
 * Start a session (mark as active)
 */
async function startSession(sessionId) {
    const session = await client_1.prisma.session.findUnique({
        where: { id: sessionId },
        include: { activities: true }
    });
    if (!session)
        return null;
    if (session.status === "planned") {
        const updated = await client_1.prisma.session.update({
            where: { id: sessionId },
            data: {
                status: "active",
                updatedAt: new Date()
            },
            include: { activities: true }
        });
        return mapSessionToResponse(updated);
    }
    return mapSessionToResponse(session);
}
/**
 * Update an activity's status within a session
 */
async function updateActivityStatus(input) {
    const activity = await client_1.prisma.sessionActivity.findUnique({
        where: { id: input.activityId }
    });
    if (!activity || activity.sessionId !== input.sessionId)
        return null;
    const now = new Date();
    const updateData = { status: input.status };
    if (input.status === "in_progress" && activity.status === "pending") {
        updateData.startedAt = now;
    }
    else if (input.status === "completed" || input.status === "skipped") {
        if (!activity.startedAt) {
            updateData.startedAt = now;
        }
        updateData.completedAt = now;
    }
    await client_1.prisma.sessionActivity.update({
        where: { id: input.activityId },
        data: updateData
    });
    // Check if all activities are done
    const session = await client_1.prisma.session.findUnique({
        where: { id: input.sessionId },
        include: { activities: true }
    });
    if (!session)
        return null;
    const allDone = session.activities.every(a => a.status === "completed" || a.status === "skipped");
    if (allDone) {
        const actualMinutes = session.activities.reduce((sum, a) => sum + a.estimatedMinutes, 0);
        await client_1.prisma.session.update({
            where: { id: input.sessionId },
            data: {
                status: "completed",
                actualMinutes,
                updatedAt: now
            }
        });
    }
    // Return updated session
    const updated = await client_1.prisma.session.findUnique({
        where: { id: input.sessionId },
        include: { activities: true }
    });
    if (!updated)
        return null;
    return mapSessionToResponse(updated);
}
/**
 * Get recent sessions for a learner
 */
async function getRecentSessions(learnerId, limit = 10) {
    const sessions = await client_1.prisma.session.findMany({
        where: { learnerId },
        include: { activities: true },
        orderBy: { createdAt: "desc" },
        take: limit
    });
    return sessions.map(mapSessionToResponse);
}
/**
 * Get session by ID
 */
async function getSessionById(sessionId) {
    const session = await client_1.prisma.session.findUnique({
        where: { id: sessionId },
        include: { activities: true }
    });
    if (!session)
        return null;
    return mapSessionToResponse(session);
}
/**
 * Map a Prisma Session to the API response format
 */
function mapSessionToResponse(session) {
    return {
        id: session.id,
        learnerId: session.learnerId,
        tenantId: session.tenantId,
        date: session.date,
        subject: session.subject,
        status: session.status,
        plannedMinutes: session.plannedMinutes,
        actualMinutes: session.actualMinutes ?? undefined,
        activities: (session.activities ?? []).map((a) => ({
            id: a.id,
            sessionId: session.id,
            learnerId: session.learnerId,
            subject: session.subject,
            type: a.type,
            title: a.title,
            instructions: a.instructions,
            estimatedMinutes: a.estimatedMinutes,
            status: a.status,
            startedAt: a.startedAt?.toISOString(),
            completedAt: a.completedAt?.toISOString()
        })),
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString()
    };
}
