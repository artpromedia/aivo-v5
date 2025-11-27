import { prisma } from "./client";
import {
  type OnboardingState,
  type OnboardingStep,
  type OnboardingStepId,
  type OnboardingAction,
  type OnboardingAnalyticsEvent,
  type OnboardingProgress,
  type OnboardingStatus,
  type Role,
  calculateProgress,
  getNextStep,
  isOnboardingComplete,
  initializeOnboardingSteps,
  deriveOnboardingStatus,
} from "@aivo/types";

/**
 * Onboarding Persistence Layer
 * 
 * Handles database operations for the progressive onboarding system including:
 * - Onboarding state management
 * - Step completion tracking
 * - Analytics event recording
 */

// ============================================================================
// ONBOARDING STATE
// ============================================================================

export interface OnboardingStateRecord {
  userId: string;
  role: Role;
  status: OnboardingStatus;
  steps: OnboardingStep[];
  startedAt: Date | null;
  completedAt: Date | null;
}

/**
 * Get the full onboarding state for a user
 */
export async function getOnboardingState(userId: string): Promise<OnboardingState | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      onboardingStatus: true,
      onboardingSteps: true,
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  if (!user) return null;

  // Parse stored steps or initialize new ones
  const steps = user.onboardingSteps
    ? (user.onboardingSteps as unknown as OnboardingStep[])
    : initializeOnboardingSteps(user.role as Role);

  const nextStep = getNextStep(steps);
  const progress = calculateProgress(steps);

  return {
    userId: user.id,
    role: user.role as Role,
    status: user.onboardingStatus as OnboardingStatus,
    currentStepId: nextStep?.id || "complete",
    steps,
    startedAt: user.onboardingStartedAt,
    completedAt: user.onboardingCompletedAt,
    progress: progress.progress,
  };
}

/**
 * Initialize onboarding for a new user
 */
export async function initializeOnboarding(
  userId: string,
  role: Role
): Promise<OnboardingState> {
  const steps = initializeOnboardingSteps(role);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: "PENDING",
      onboardingSteps: steps as unknown as object,
      onboardingStartedAt: new Date(),
    },
    select: {
      id: true,
      role: true,
      onboardingStatus: true,
      onboardingSteps: true,
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  // Record analytics event
  await recordOnboardingEvent(userId, "welcome", "started");

  return {
    userId: user.id,
    role: role,
    status: user.onboardingStatus as OnboardingStatus,
    currentStepId: steps[0]?.id || "welcome",
    steps,
    startedAt: user.onboardingStartedAt,
    completedAt: null,
    progress: 0,
  };
}

/**
 * Complete an onboarding step
 */
export async function completeOnboardingStep(
  userId: string,
  stepId: OnboardingStepId,
  timeSpentMs?: number,
  metadata?: Record<string, unknown>
): Promise<OnboardingState> {
  const state = await getOnboardingState(userId);
  if (!state) {
    throw new Error(`User ${userId} not found`);
  }

  // Update the step
  const updatedSteps = state.steps.map((step: OnboardingStep) =>
    step.id === stepId
      ? { ...step, isCompleted: true, completedAt: new Date() }
      : step
  );

  // Derive new status
  const newStatus = deriveOnboardingStatus(state.role, updatedSteps);
  const isComplete = isOnboardingComplete(updatedSteps);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: newStatus,
      onboardingSteps: updatedSteps as unknown as object,
      ...(isComplete && { onboardingCompletedAt: new Date() }),
    },
    select: {
      id: true,
      role: true,
      onboardingStatus: true,
      onboardingSteps: true,
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  // Record analytics
  await recordOnboardingEvent(userId, stepId, "completed", timeSpentMs, metadata);

  const progress = calculateProgress(updatedSteps);
  const nextStep = getNextStep(updatedSteps);

  return {
    userId: user.id,
    role: state.role,
    status: newStatus,
    currentStepId: nextStep?.id || "complete",
    steps: updatedSteps,
    startedAt: user.onboardingStartedAt,
    completedAt: user.onboardingCompletedAt,
    progress: progress.progress,
  };
}

/**
 * Skip an onboarding step (if allowed)
 */
export async function skipOnboardingStep(
  userId: string,
  stepId: OnboardingStepId,
  reason?: string
): Promise<{ success: boolean; state: OnboardingState }> {
  const state = await getOnboardingState(userId);
  if (!state) {
    throw new Error(`User ${userId} not found`);
  }

  const step = state.steps.find((s: OnboardingStep) => s.id === stepId);
  if (!step) {
    throw new Error(`Step ${stepId} not found`);
  }

  // Cannot skip required steps
  if (step.isRequired) {
    return { success: false, state };
  }

  // Update the step
  const updatedSteps = state.steps.map((s: OnboardingStep) =>
    s.id === stepId
      ? { ...s, isSkipped: true, skippedAt: new Date() }
      : s
  );

  const newStatus = deriveOnboardingStatus(state.role, updatedSteps);

  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: newStatus,
      onboardingSteps: updatedSteps as unknown as object,
    },
    select: {
      id: true,
      role: true,
      onboardingStatus: true,
      onboardingSteps: true,
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  // Record analytics
  await recordOnboardingEvent(userId, stepId, "skipped", undefined, { reason });

  const progress = calculateProgress(updatedSteps);
  const nextStep = getNextStep(updatedSteps);

  return {
    success: true,
    state: {
      userId: user.id,
      role: state.role,
      status: newStatus,
      currentStepId: nextStep?.id || "complete",
      steps: updatedSteps,
      startedAt: user.onboardingStartedAt,
      completedAt: user.onboardingCompletedAt,
      progress: progress.progress,
    },
  };
}

/**
 * Reset onboarding for a user (admin action)
 */
export async function resetOnboarding(userId: string): Promise<OnboardingState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  const role = user.role as Role;
  const freshSteps = initializeOnboardingSteps(role);

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      onboardingStatus: "PENDING",
      onboardingSteps: freshSteps as unknown as object,
      onboardingStartedAt: new Date(),
      onboardingCompletedAt: null,
    },
    select: {
      id: true,
      role: true,
      onboardingStatus: true,
      onboardingSteps: true,
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  // Record analytics
  await recordOnboardingEvent(userId, "welcome", "started", undefined, { reset: true });

  return {
    userId: updatedUser.id,
    role,
    status: "PENDING",
    currentStepId: freshSteps[0]?.id || "welcome",
    steps: freshSteps,
    startedAt: updatedUser.onboardingStartedAt,
    completedAt: null,
    progress: 0,
  };
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Record an onboarding analytics event
 */
export async function recordOnboardingEvent(
  userId: string,
  step: OnboardingStepId,
  action: OnboardingAction,
  timeSpentMs?: number,
  metadata?: Record<string, unknown>
): Promise<void> {
  await prisma.onboardingAnalytics.create({
    data: {
      userId,
      step,
      action,
      timeSpentMs,
      metadata: metadata as object,
    },
  });
}

/**
 * Get onboarding analytics for a user
 */
export async function getOnboardingAnalytics(
  userId: string
): Promise<OnboardingAnalyticsEvent[]> {
  const events = await prisma.onboardingAnalytics.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return events.map((e: {
    userId: string;
    step: string;
    action: string;
    timeSpentMs: number | null;
    metadata: unknown;
    createdAt: Date;
  }) => ({
    userId: e.userId,
    step: e.step as OnboardingStepId,
    action: e.action as OnboardingAction,
    timeSpentMs: e.timeSpentMs || undefined,
    metadata: e.metadata as Record<string, unknown> | undefined,
    createdAt: e.createdAt,
  }));
}

/**
 * Get aggregated onboarding metrics (for admin dashboard)
 */
export async function getOnboardingMetrics(
  organizationId?: string
): Promise<{
  totalUsers: number;
  completedOnboarding: number;
  inProgress: number;
  pending: number;
  averageCompletionTimeMs: number;
  stepCompletionRates: Record<string, number>;
}> {
  // Base filter
  const where = organizationId
    ? { organizationId }
    : {};

  // Get user counts by status
  const statusCounts = await prisma.user.groupBy({
    by: ["onboardingStatus"],
    where,
    _count: { id: true },
  });

  type StatusCount = { onboardingStatus: string; _count: { id: number } };
  const totalUsers = statusCounts.reduce((sum: number, s: StatusCount) => sum + s._count.id, 0);
  const completedOnboarding = (statusCounts as StatusCount[]).find(s => s.onboardingStatus === "COMPLETE")?._count.id || 0;
  const pending = (statusCounts as StatusCount[]).find(s => s.onboardingStatus === "PENDING")?._count.id || 0;
  const inProgress = totalUsers - completedOnboarding - pending;

  // Get average completion time for completed users
  const completedUsers = await prisma.user.findMany({
    where: {
      ...where,
      onboardingStatus: "COMPLETE",
      onboardingStartedAt: { not: null },
      onboardingCompletedAt: { not: null },
    },
    select: {
      onboardingStartedAt: true,
      onboardingCompletedAt: true,
    },
  });

  type CompletedUser = { onboardingStartedAt: Date | null; onboardingCompletedAt: Date | null };
  const completionTimes = (completedUsers as CompletedUser[])
    .filter((u: CompletedUser) => u.onboardingStartedAt && u.onboardingCompletedAt)
    .map((u: CompletedUser) => u.onboardingCompletedAt!.getTime() - u.onboardingStartedAt!.getTime());

  const averageCompletionTimeMs = completionTimes.length > 0
    ? completionTimes.reduce((a: number, b: number) => a + b, 0) / completionTimes.length
    : 0;

  // Get step completion rates
  const stepEvents = await prisma.onboardingAnalytics.groupBy({
    by: ["step", "action"],
    _count: { id: true },
  });

  const stepCompletionRates: Record<string, number> = {};
  const startedByStep: Record<string, number> = {};
  const completedByStep: Record<string, number> = {};

  type StepEvent = { step: string; action: string; _count: { id: number } };
  for (const event of stepEvents as StepEvent[]) {
    if (event.action === "started") {
      startedByStep[event.step] = event._count.id;
    } else if (event.action === "completed") {
      completedByStep[event.step] = event._count.id;
    }
  }

  for (const step of Object.keys(startedByStep)) {
    const started = startedByStep[step] || 0;
    const completed = completedByStep[step] || 0;
    stepCompletionRates[step] = started > 0 ? Math.round((completed / started) * 100) : 0;
  }

  return {
    totalUsers,
    completedOnboarding,
    inProgress,
    pending,
    averageCompletionTimeMs,
    stepCompletionRates,
  };
}

// ============================================================================
// QUERIES
// ============================================================================

/**
 * Get users with incomplete onboarding
 */
export async function getUsersWithIncompleteOnboarding(
  options: {
    organizationId?: string;
    role?: Role;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{
  users: Array<{
    id: string;
    email: string;
    name: string | null;
    role: Role;
    status: OnboardingStatus;
    progress: number;
    startedAt: Date | null;
  }>;
  total: number;
}> {
  const where = {
    onboardingStatus: { not: "COMPLETE" as const },
    ...(options.organizationId && { organizationId: options.organizationId }),
    ...(options.role && { role: options.role }),
  };

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        onboardingStatus: true,
        onboardingSteps: true,
        onboardingStartedAt: true,
      },
      take: options.limit || 50,
      skip: options.offset || 0,
      orderBy: { onboardingStartedAt: "desc" },
    }),
    prisma.user.count({ where }),
  ]);

  type UserRecord = {
    id: string;
    email: string;
    name: string | null;
    role: string;
    onboardingStatus: string;
    onboardingSteps: unknown;
    onboardingStartedAt: Date | null;
  };

  return {
    users: (users as UserRecord[]).map((u: UserRecord) => {
      const steps = u.onboardingSteps as OnboardingStep[] || [];
      const progress = calculateProgress(steps);
      return {
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role as Role,
        status: u.onboardingStatus as OnboardingStatus,
        progress: progress.progress,
        startedAt: u.onboardingStartedAt,
      };
    }),
    total,
  };
}

/**
 * Check if a user has completed onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingStatus: true },
  });

  return user?.onboardingStatus === "COMPLETE";
}

/**
 * Get onboarding completion percentage for a user
 */
export async function getOnboardingProgress(userId: string): Promise<OnboardingProgress | null> {
  const state = await getOnboardingState(userId);
  if (!state) return null;

  return calculateProgress(state.steps);
}
