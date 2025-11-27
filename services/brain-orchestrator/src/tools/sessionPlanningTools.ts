import { getLearnerWithBrainProfile } from "@aivo/persistence";
import { getDifficultyRecommendations } from "@aivo/brain-model";
import type {
  BrainDomain,
  LearnerBrainProfile,
  LearnerSession,
  Region,
  SessionActivity,
  SessionPlanInsights,
  SubjectCode,
  SubjectLevel
} from "@aivo/types";
import {
  fetchLearnerBrainProfile,
  type LearnerRecordWithProfile,
  type RawLearnerRecordWithProfile
} from "../lib/brainProfile";
import type { AgentTool } from "../workflows/agentTypes";

export interface LearnerContextSummary {
  learnerId: string;
  tenantId: string;
  displayName: string;
  region: Region;
  currentGrade: number;
  brainProfile: LearnerBrainProfile;
  primarySubjectLevel: SubjectLevel | null;
  fallbackProfile: boolean;
}

interface SessionIntentInput {
  learnerContext: LearnerContextSummary;
  subject: SubjectCode;
}

export interface SessionIntent {
  objective: string;
  tone: string;
  estimatedMinutes: number;
  focusDomain: BrainDomain;
  practiceDomain: BrainDomain;
  reflectionDomain: BrainDomain;
  calmingStrategies: string[];
  difficultySummary: string;
  narrativeHook: string;
}

interface AssembleSessionPlanInput {
  learnerContext: LearnerContextSummary;
  intent: SessionIntent;
}

export interface SessionPlanArtifacts {
  plan: LearnerSession;
  insights: SessionPlanInsights;
}

function assertRecord(
  record: RawLearnerRecordWithProfile
): asserts record is LearnerRecordWithProfile {
  if (!record) {
    throw new Error("Learner not found");
  }
}

function determineRegion(record: LearnerRecordWithProfile): Region {
  return (record.region as Region) ?? "north_america";
}

function buildActivities(
  learnerContext: LearnerContextSummary,
  intent: SessionIntent
): SessionActivity[] {
  const activities: SessionActivity[] = [
    {
      id: `${intent.focusDomain}-calm-${Date.now()}`,
      sessionId: "pending",
      learnerId: learnerContext.learnerId,
      subject: "sel" as SubjectCode,
      type: "calm_check_in",
      title: "Arrive and notice",
      instructions: `Take a slow breath. ${intent.narrativeHook} Rate your readiness from 1 (needs time) to 5 (ready).`,
      estimatedMinutes: 2,
      status: "pending"
    },
    {
      id: `${intent.focusDomain}-lesson-${Date.now()}`,
      sessionId: "pending",
      learnerId: learnerContext.learnerId,
      subject: learnerContext.primarySubjectLevel?.subject ?? ("math" as SubjectCode),
      type: "micro_lesson",
      title: "Gentle mini-lesson",
      instructions: `Objective: ${intent.objective}. We'll look at one example with pauses to reflect.`,
      estimatedMinutes: 5,
      status: "pending"
    },
    {
      id: `${intent.practiceDomain}-practice-${Date.now()}`,
      sessionId: "pending",
      learnerId: learnerContext.learnerId,
      subject: learnerContext.primarySubjectLevel?.subject ?? ("math" as SubjectCode),
      type: "guided_practice",
      title: "Supported practice",
      instructions: `Try 2 questions with hints ready. Difficulty: ${intent.difficultySummary}.`,
      estimatedMinutes: 6,
      status: "pending"
    },
    {
      id: `${intent.reflectionDomain}-reflection-${Date.now()}`,
      sessionId: "pending",
      learnerId: learnerContext.learnerId,
      subject: learnerContext.primarySubjectLevel?.subject ?? ("math" as SubjectCode),
      type: "reflection",
      title: "Feelings check-out",
      instructions: "What helped? What should we change next time? Use 3 feeling words if possible.",
      estimatedMinutes: 3,
      status: "pending"
    }
  ];

  return activities;
}

export const gatherLearnerContextTool: AgentTool<void, LearnerContextSummary> = {
  name: "gather-learner-context",
  description: "Load learner record, region, and brain profile snapshot",
  async run({ context }) {
    const record = await getLearnerWithBrainProfile(context.learnerId);
    assertRecord(record);

    const brainProfile = await fetchLearnerBrainProfile(context.learnerId, record);
    if (!brainProfile) {
      throw new Error("Unable to build brain profile for learner");
    }

    const primarySubjectLevel = brainProfile.subjectLevels.find(
      (lvl) => lvl.subject === context.subject
    ) ?? null;

    return {
      learnerId: record.id,
      tenantId: record.tenantId ?? undefined,
      displayName: `${record.firstName} ${record.lastName}`.trim() || "Learner",
      region: determineRegion(record),
      currentGrade: brainProfile.currentGrade,
      brainProfile,
      primarySubjectLevel,
      fallbackProfile: !record.brainProfile
    };
  },
  summarizeResult: (result) =>
    `Profile ready for ${result.displayName} (${result.primarySubjectLevel?.subject ?? "general"})`
};

export const computeSessionIntentTool: AgentTool<SessionIntentInput, SessionIntent> = {
  name: "compute-session-intent",
  description: "Blend difficulty recommendations, tone, and SEL focus",
  async run({ input }) {
    const { learnerContext, subject } = input;
    const recommendations = getDifficultyRecommendations(learnerContext.brainProfile);
    const subjectRecommendation =
      recommendations.find((rec: { subject: SubjectCode }) => rec.subject === subject) ?? recommendations[0];

    const difficultySummary = subjectRecommendation
      ? `${subjectRecommendation.recommendedDifficulty.toUpperCase()} – ${subjectRecommendation.rationale}`
      : "Default gentle difficulty";

    const calmingStrategies = learnerContext.brainProfile.preferences?.prefersShortSessions
      ? ["Keep instructions short", "Offer movement break if attention drifts"]
      : ["Slow breathing", "Invite sensory check"];

    const tone = learnerContext.fallbackProfile
      ? "Calm + exploratory"
      : "Calm + gently challenging";

    return {
      objective: `Stay regulated while practicing ${subject.toUpperCase()}`,
      tone,
      estimatedMinutes: 16,
      focusDomain: "self_regulation",
      practiceDomain: "procedural_fluency",
      reflectionDomain: "self_regulation",
      calmingStrategies,
      difficultySummary,
      narrativeHook: learnerContext.primarySubjectLevel
        ? `We're working at a ${learnerContext.primarySubjectLevel.assessedGradeLevel}th-grade comfort level.`
        : "We'll listen to what your brain needs today."
    };
  },
  summarizeResult: (intent) => `Objective: ${intent.objective}`
};

export const assembleSessionPlanTool: AgentTool<
  AssembleSessionPlanInput,
  SessionPlanArtifacts
> = {
  name: "assemble-session-plan",
  description: "Convert intent into concrete calm session activities",
  async run({ context, input }) {
    const now = new Date();
    const idSuffix = now.getTime();
    const sessionId = `session-plan-${idSuffix}`;
    const date = now.toISOString().slice(0, 10);

    const activities = buildActivities(input.learnerContext, input.intent).map((activity, index) => ({
      ...activity,
      sessionId,
      id: `${activity.id}-${index}`
    }));

    const plannedMinutes = activities.reduce((sum, activity) => sum + activity.estimatedMinutes, 0);

    const plan: LearnerSession = {
      id: sessionId,
      learnerId: context.learnerId,
      tenantId: context.tenantId,
      date,
      subject: context.subject,
      status: "planned",
      plannedMinutes,
      activities,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    const insights: SessionPlanInsights = {
      objective: input.intent.objective,
      tone: input.intent.tone,
      difficultySummary: input.intent.difficultySummary,
      calmingStrategies: input.intent.calmingStrategies,
      recommendedMinutes: plannedMinutes
    };

    return { plan, insights };
  },
  summarizeResult: (result) => `Plan ready (${result.plan.plannedMinutes} minutes)`
};
