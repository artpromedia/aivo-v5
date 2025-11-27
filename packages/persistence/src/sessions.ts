import { prisma } from "./client";

/**
 * Session persistence layer
 * Stores learning sessions with activities in the database
 */

export interface CreateSessionInput {
  learnerId: string;
  tenantId: string;
  subject: string;
  date: string; // YYYY-MM-DD
  plannedMinutes: number;
  activities: SessionActivityInput[];
}

export interface SessionActivityInput {
  id: string;
  type: string;
  title: string;
  instructions: string;
  estimatedMinutes: number;
  status: "pending" | "in_progress" | "completed" | "skipped";
  startedAt?: string;
  completedAt?: string;
}

export interface UpdateActivityStatusInput {
  sessionId: string;
  activityId: string;
  status: "in_progress" | "completed" | "skipped";
}

export interface SessionRecord {
  id: string;
  learnerId: string;
  tenantId: string;
  date: string;
  subject: string;
  status: string;
  plannedMinutes: number;
  actualMinutes?: number;
  activities: ActivityRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ActivityRecord {
  id: string;
  sessionId: string;
  learnerId: string;
  subject: string;
  type: string;
  title: string;
  instructions: string;
  estimatedMinutes: number;
  status: string;
  startedAt?: string;
  completedAt?: string;
}

/**
 * Get a session for a learner on a specific date and subject
 */
export async function getSessionForLearnerToday(
  learnerId: string,
  subject: string,
  date: string
): Promise<SessionRecord | null> {
  const session = await prisma.session.findFirst({
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

  if (!session) return null;
  return mapSessionToResponse(session);
}

/**
 * Create a new learning session with activities
 */
export async function createSession(input: CreateSessionInput): Promise<SessionRecord> {
  const session = await prisma.session.create({
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
export async function startSession(sessionId: string): Promise<SessionRecord | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { activities: true }
  });

  if (!session) return null;

  if (session.status === "planned") {
    const updated = await prisma.session.update({
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
export async function updateActivityStatus(input: UpdateActivityStatusInput): Promise<SessionRecord | null> {
  const activity = await prisma.sessionActivity.findUnique({
    where: { id: input.activityId }
  });

  if (!activity || activity.sessionId !== input.sessionId) return null;

  const now = new Date();
  const updateData: any = { status: input.status };

  if (input.status === "in_progress" && activity.status === "pending") {
    updateData.startedAt = now;
  } else if (input.status === "completed" || input.status === "skipped") {
    if (!activity.startedAt) {
      updateData.startedAt = now;
    }
    updateData.completedAt = now;
  }

  await prisma.sessionActivity.update({
    where: { id: input.activityId },
    data: updateData
  });

  // Check if all activities are done
  const session = await prisma.session.findUnique({
    where: { id: input.sessionId },
    include: { activities: true }
  });

  if (!session) return null;

  const allDone = session.activities.every(
    a => a.status === "completed" || a.status === "skipped"
  );

  if (allDone) {
    const actualMinutes = session.activities.reduce(
      (sum, a) => sum + a.estimatedMinutes,
      0
    );

    await prisma.session.update({
      where: { id: input.sessionId },
      data: {
        status: "completed",
        actualMinutes,
        updatedAt: now
      }
    });
  }

  // Return updated session
  const updated = await prisma.session.findUnique({
    where: { id: input.sessionId },
    include: { activities: true }
  });

  if (!updated) return null;
  return mapSessionToResponse(updated);
}

/**
 * Get recent sessions for a learner
 */
export async function getRecentSessions(learnerId: string, limit = 10): Promise<SessionRecord[]> {
  const sessions = await prisma.session.findMany({
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
export async function getSessionById(sessionId: string): Promise<SessionRecord | null> {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { activities: true }
  });

  if (!session) return null;
  return mapSessionToResponse(session);
}

/**
 * Map a Prisma Session to the API response format
 */
function mapSessionToResponse(session: any): SessionRecord {
  return {
    id: session.id,
    learnerId: session.learnerId,
    tenantId: session.tenantId,
    date: session.date,
    subject: session.subject,
    status: session.status,
    plannedMinutes: session.plannedMinutes,
    actualMinutes: session.actualMinutes ?? undefined,
    activities: (session.activities ?? []).map((a: any) => ({
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
