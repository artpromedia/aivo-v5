/**
 * Self-Regulation Hub Persistence Layer
 * 
 * Database operations for the self-regulation and emotional wellness feature.
 */

import { prisma } from "./client";
import type { Prisma } from "@prisma/client";
import type { 
  RegulationSession, 
  EmotionHistory,
  RegulationActivityType
} from "@prisma/client";

// ============================================================================
// Regulation Session Operations
// ============================================================================

export interface CreateRegulationSessionParams {
  learnerId: string;
  activityId: string;
  activityType: RegulationActivityType;
  emotionBefore?: string;
  emotionLevelBefore?: number;
  triggeredBy?: string;
  context?: Record<string, unknown>;
}

export async function createRegulationSession(
  params: CreateRegulationSessionParams
): Promise<RegulationSession> {
  return prisma.regulationSession.create({
    data: {
      learnerId: params.learnerId,
      activityId: params.activityId,
      activityType: params.activityType,
      emotionBefore: params.emotionBefore,
      emotionLevelBefore: params.emotionLevelBefore,
      triggeredBy: params.triggeredBy ?? "manual",
      context: params.context as Prisma.InputJsonValue | undefined
    }
  });
}

export async function getRegulationSessionById(
  sessionId: string
): Promise<RegulationSession | null> {
  return prisma.regulationSession.findUnique({
    where: { id: sessionId }
  });
}

export interface UpdateRegulationSessionParams {
  emotionAfter?: string;
  emotionLevelAfter?: number;
  durationSeconds?: number;
  completed?: boolean;
  effectiveness?: number;
  notes?: string;
  completedAt?: Date;
}

export async function updateRegulationSession(
  sessionId: string,
  params: UpdateRegulationSessionParams
): Promise<RegulationSession> {
  return prisma.regulationSession.update({
    where: { id: sessionId },
    data: {
      ...params,
      ...(params.completed && !params.completedAt ? { completedAt: new Date() } : {})
    }
  });
}

export async function listRegulationSessions(
  learnerId: string,
  options?: {
    activityType?: RegulationActivityType;
    completed?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ sessions: RegulationSession[]; total: number }> {
  const where = {
    learnerId,
    ...(options?.activityType && { activityType: options.activityType }),
    ...(options?.completed !== undefined && { completed: options.completed }),
    ...(options?.startDate || options?.endDate ? {
      startedAt: {
        ...(options?.startDate && { gte: options.startDate }),
        ...(options?.endDate && { lte: options.endDate })
      }
    } : {})
  };

  const [sessions, total] = await Promise.all([
    prisma.regulationSession.findMany({
      where,
      orderBy: { startedAt: "desc" },
      take: options?.limit ?? 20,
      skip: options?.offset ?? 0
    }),
    prisma.regulationSession.count({ where })
  ]);

  return { sessions, total };
}

export async function getRecentRegulationSessions(
  learnerId: string,
  limit: number = 5
): Promise<RegulationSession[]> {
  return prisma.regulationSession.findMany({
    where: { learnerId },
    orderBy: { startedAt: "desc" },
    take: limit
  });
}

// ============================================================================
// Emotion History Operations
// ============================================================================

export interface LogEmotionParams {
  learnerId: string;
  emotion: string;
  level: number;
  trigger?: string;
  strategy?: string;
  context?: Record<string, unknown>;
  source?: string;
  notifyParent?: boolean;
}

export async function logEmotion(
  params: LogEmotionParams
): Promise<EmotionHistory> {
  // High distress levels (4-5) with negative emotions trigger parent notification
  const shouldNotify = params.notifyParent ?? (
    params.level >= 4 && 
    ["angry", "anxious", "frustrated", "overwhelmed", "sad"].includes(params.emotion)
  );

  return prisma.emotionHistory.create({
    data: {
      learnerId: params.learnerId,
      emotion: params.emotion,
      level: params.level,
      trigger: params.trigger,
      strategy: params.strategy,
      context: params.context as Prisma.InputJsonValue | undefined,
      source: params.source ?? "manual",
      notifyParent: shouldNotify
    }
  });
}

export async function getEmotionHistory(
  learnerId: string,
  options?: {
    emotion?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }
): Promise<{ records: EmotionHistory[]; total: number }> {
  const where = {
    learnerId,
    ...(options?.emotion && { emotion: options.emotion }),
    ...(options?.startDate || options?.endDate ? {
      timestamp: {
        ...(options?.startDate && { gte: options.startDate }),
        ...(options?.endDate && { lte: options.endDate })
      }
    } : {})
  };

  const [records, total] = await Promise.all([
    prisma.emotionHistory.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0
    }),
    prisma.emotionHistory.count({ where })
  ]);

  return { records, total };
}

export async function getRecentEmotions(
  learnerId: string,
  limit: number = 10
): Promise<EmotionHistory[]> {
  return prisma.emotionHistory.findMany({
    where: { learnerId },
    orderBy: { timestamp: "desc" },
    take: limit
  });
}

export async function getEmotionById(
  emotionId: string
): Promise<EmotionHistory | null> {
  return prisma.emotionHistory.findUnique({
    where: { id: emotionId }
  });
}

// ============================================================================
// Analytics Operations
// ============================================================================

export interface RegulationStatsResult {
  totalSessions: number;
  completedSessions: number;
  averageEffectiveness: number;
  totalMinutes: number;
  activityBreakdown: Record<string, number>;
  mostEffectiveActivity: string | null;
  emotionImprovementRate: number;
}

export async function getRegulationStats(
  learnerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<RegulationStatsResult> {
  const where = {
    learnerId,
    ...(options?.startDate || options?.endDate ? {
      startedAt: {
        ...(options?.startDate && { gte: options.startDate }),
        ...(options?.endDate && { lte: options.endDate })
      }
    } : {})
  };

  const sessions = await prisma.regulationSession.findMany({
    where,
    select: {
      activityType: true,
      completed: true,
      effectiveness: true,
      durationSeconds: true,
      emotionLevelBefore: true,
      emotionLevelAfter: true
    }
  });

  const completedSessions = sessions.filter(s => s.completed);
  const sessionsWithEffectiveness = completedSessions.filter(s => s.effectiveness !== null);
  
  // Calculate activity breakdown
  const activityBreakdown: Record<string, number> = {};
  sessions.forEach(s => {
    activityBreakdown[s.activityType] = (activityBreakdown[s.activityType] || 0) + 1;
  });

  // Calculate effectiveness by activity type
  const effectivenessByType: Record<string, { total: number; count: number }> = {};
  sessionsWithEffectiveness.forEach(s => {
    if (!effectivenessByType[s.activityType]) {
      effectivenessByType[s.activityType] = { total: 0, count: 0 };
    }
    effectivenessByType[s.activityType].total += s.effectiveness!;
    effectivenessByType[s.activityType].count += 1;
  });

  let mostEffectiveActivity: string | null = null;
  let highestEffectiveness = 0;
  Object.entries(effectivenessByType).forEach(([type, data]) => {
    const avg = data.total / data.count;
    if (avg > highestEffectiveness) {
      highestEffectiveness = avg;
      mostEffectiveActivity = type;
    }
  });

  // Calculate emotion improvement rate
  const sessionsWithBothEmotions = completedSessions.filter(
    s => s.emotionLevelBefore !== null && s.emotionLevelAfter !== null
  );
  const improvedSessions = sessionsWithBothEmotions.filter(
    s => s.emotionLevelAfter! < s.emotionLevelBefore!
  );
  const emotionImprovementRate = sessionsWithBothEmotions.length > 0
    ? improvedSessions.length / sessionsWithBothEmotions.length
    : 0;

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    averageEffectiveness: sessionsWithEffectiveness.length > 0
      ? sessionsWithEffectiveness.reduce((sum, s) => sum + s.effectiveness!, 0) / sessionsWithEffectiveness.length
      : 0,
    totalMinutes: Math.round(sessions.reduce((sum, s) => sum + s.durationSeconds, 0) / 60),
    activityBreakdown,
    mostEffectiveActivity,
    emotionImprovementRate
  };
}

export interface EmotionSummaryResult {
  mostFrequentEmotion: string | null;
  averageLevel: number;
  emotionCounts: Record<string, number>;
  trendDirection: "improving" | "stable" | "declining" | "insufficient_data";
  commonTriggers: string[];
  effectiveStrategies: string[];
}

export async function getEmotionSummary(
  learnerId: string,
  options?: {
    startDate?: Date;
    endDate?: Date;
  }
): Promise<EmotionSummaryResult> {
  const where = {
    learnerId,
    ...(options?.startDate || options?.endDate ? {
      timestamp: {
        ...(options?.startDate && { gte: options.startDate }),
        ...(options?.endDate && { lte: options.endDate })
      }
    } : {})
  };

  const records = await prisma.emotionHistory.findMany({
    where,
    orderBy: { timestamp: "asc" }
  });

  if (records.length === 0) {
    return {
      mostFrequentEmotion: null,
      averageLevel: 0,
      emotionCounts: {},
      trendDirection: "insufficient_data",
      commonTriggers: [],
      effectiveStrategies: []
    };
  }

  // Count emotions
  const emotionCounts: Record<string, number> = {};
  records.forEach(r => {
    emotionCounts[r.emotion] = (emotionCounts[r.emotion] || 0) + 1;
  });

  // Find most frequent
  const mostFrequentEmotion = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Calculate average level
  const averageLevel = records.reduce((sum, r) => sum + r.level, 0) / records.length;

  // Calculate trend (compare first half to second half for negative emotions)
  const negativeEmotions = ["angry", "anxious", "frustrated", "overwhelmed", "sad", "tired"];
  const negativeRecords = records.filter(r => negativeEmotions.includes(r.emotion));
  let trendDirection: "improving" | "stable" | "declining" | "insufficient_data" = "insufficient_data";
  
  if (negativeRecords.length >= 4) {
    const midpoint = Math.floor(negativeRecords.length / 2);
    const firstHalf = negativeRecords.slice(0, midpoint);
    const secondHalf = negativeRecords.slice(midpoint);
    
    const firstAvg = firstHalf.reduce((sum, r) => sum + r.level, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + r.level, 0) / secondHalf.length;
    
    if (secondAvg < firstAvg - 0.3) {
      trendDirection = "improving";
    } else if (secondAvg > firstAvg + 0.3) {
      trendDirection = "declining";
    } else {
      trendDirection = "stable";
    }
  }

  // Find common triggers
  const triggerCounts: Record<string, number> = {};
  records.filter(r => r.trigger).forEach(r => {
    triggerCounts[r.trigger!] = (triggerCounts[r.trigger!] || 0) + 1;
  });
  const commonTriggers = Object.entries(triggerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([trigger]) => trigger);

  // Find effective strategies
  const strategyCounts: Record<string, number> = {};
  records.filter(r => r.strategy).forEach(r => {
    strategyCounts[r.strategy!] = (strategyCounts[r.strategy!] || 0) + 1;
  });
  const effectiveStrategies = Object.entries(strategyCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([strategy]) => strategy);

  return {
    mostFrequentEmotion,
    averageLevel,
    emotionCounts,
    trendDirection,
    commonTriggers,
    effectiveStrategies
  };
}

// ============================================================================
// Streak Tracking
// ============================================================================

export async function getRegulationStreak(learnerId: string): Promise<number> {
  const sessions = await prisma.regulationSession.findMany({
    where: { 
      learnerId,
      completed: true 
    },
    orderBy: { startedAt: "desc" },
    select: { startedAt: true }
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sessionDates = new Set(
    sessions.map(s => {
      const date = new Date(s.startedAt);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  const checkDate = new Date(today);
  
  // Check if today has a session, if not start from yesterday
  if (!sessionDates.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  // Count consecutive days
  while (sessionDates.has(checkDate.getTime())) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
  }

  return streak;
}

// ============================================================================
// Parent Notification Check
// ============================================================================

export async function getUnreadDistressAlerts(
  learnerId: string
): Promise<EmotionHistory[]> {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  return prisma.emotionHistory.findMany({
    where: {
      learnerId,
      notifyParent: true,
      timestamp: { gte: oneDayAgo }
    },
    orderBy: { timestamp: "desc" }
  });
}
