import type { BaselineAssessmentSession, BaselineDomainResult, CurriculumContent, CurriculumModule } from "@prisma/client";
import type { AssessmentDomainName } from "@/lib/types/assessment";
import type { LearnerProfile } from "@/lib/types/models";
import type { BaselineDomain } from "@/types/baseline";

export type Subject = BaselineDomain | AssessmentDomainName;

function subjectToBaselineDomain(subject: Subject): BaselineDomain {
  switch (subject) {
    case "SPEECH":
      return "SPEECH_LANGUAGE";
    case "SCIENCE":
      return "SCIENCE_SOCIAL";
    default:
      return subject as BaselineDomain;
  }
}

export interface ActivityResource {
  type: "TEXT" | "VIDEO" | "AUDIO" | "MANIPULATIVE" | "GAME";
  label: string;
  url?: string;
  description?: string;
}

export interface Activity {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  estimatedMinutes: number;
  modality: "VISUAL" | "AUDITORY" | "KINESTHETIC" | "MIXED";
  hasVisualSupport: boolean;
  hasAudioNarration: boolean;
  isInteractive: boolean;
  hasVisualSchedule: boolean;
  resources: ActivityResource[];
  scaffolds: string[];
  standardCodes: string[];
  contentId?: string;
}

export interface LessonActivity extends Activity {
  skillId: string;
  skillName: string;
  domain: BaselineDomain;
  sequence: number;
}

export interface DailyLesson {
  date: string;
  focusDomain: BaselineDomain;
  lessons: LessonActivity[];
  estimatedMinutes: number;
}

export interface LessonPlan {
  id: string;
  learnerId: string;
  subject: Subject;
  startDate: string;
  endDate: string;
  durationDays: number;
  learnerProfile: LearnerProfile;
  domainLevels: Record<string, number>;
  dailySchedule: DailyLesson[];
}

export interface PerformanceMetrics {
  accuracy: number;
  timePerQuestion: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  currentLevel: number;
  sampleSize?: number;
}

export interface DifficultyAdjustment {
  action: "INCREASE" | "DECREASE" | "MAINTAIN";
  newLevel?: number;
  reason: string;
  scaffolding?: string[];
  encouragement?: string;
}

export interface Skill {
  id: string;
  name: string;
  domain: BaselineDomain;
  description?: string | null;
  targetGrade?: number | null;
}

export interface ActivityResult {
  activityId: string;
  accuracy: number;
  timePerQuestion: number;
  durationMs: number;
  streak?: number;
  responses?: Record<string, unknown>;
}

interface LearnerModel {
  getProfile(learnerId: string): Promise<LearnerProfile>;
}

interface ContentLibrary {
  getSkills(subject: Subject): Promise<Skill[]>;
  getActivitiesForSkill(skill: Skill, level: number, limit?: number): Promise<Activity[]>;
  getFallbackActivities(args: { subject: Subject; level: number; limit: number }): Promise<Activity[]>;
}

interface DifficultyAdjuster {
  estimateStartingLevel(args: {
    learner: LearnerProfile;
    domainLevels: Record<string, number>;
    subject: Subject;
    skill: Skill;
    dayIndex: number;
  }): number;
  buildDailyScaffolds(level: number, profile: LearnerProfile): string[];
}

interface AdaptiveCurriculumEngineContract {
  generateLessonPlan(learnerId: string, subject: Subject, duration?: number): Promise<LessonPlan>;
  adjustDifficulty(sessionId: string, recentPerformance: PerformanceMetrics): Promise<DifficultyAdjustment>;
  selectNextActivity(skill: Skill, learnerProfile: LearnerProfile, completedActivities: string[]): Promise<Activity>;
}

interface ServerDependencies {
  learnerModel?: LearnerModel;
  contentLibrary?: ContentLibrary;
  difficultyAdjuster?: DifficultyAdjuster;
}

type PrismaFactory = () => Promise<(typeof import("@/lib/prisma")) ["prisma"]>;

const getPrisma: PrismaFactory = async () => (await import("@/lib/prisma")).prisma;

const isServer = typeof window === "undefined";

export class AdaptiveCurriculumEngine implements AdaptiveCurriculumEngineContract {
  private readonly impl: AdaptiveCurriculumEngineContract;

  constructor(dependencies?: ServerDependencies) {
    this.impl = isServer ? new ServerAdaptiveCurriculumEngine(dependencies) : new BrowserAdaptiveCurriculumEngine();
  }

  generateLessonPlan(learnerId: string, subject: Subject, duration = 14) {
    return this.impl.generateLessonPlan(learnerId, subject, duration);
  }

  adjustDifficulty(sessionId: string, recentPerformance: PerformanceMetrics) {
    return this.impl.adjustDifficulty(sessionId, recentPerformance);
  }

  selectNextActivity(skill: Skill, learnerProfile: LearnerProfile, completedActivities: string[]) {
    return this.impl.selectNextActivity(skill, learnerProfile, completedActivities);
  }
}

class ServerAdaptiveCurriculumEngine implements AdaptiveCurriculumEngineContract {
  private readonly learnerModel: LearnerModel;
  private readonly contentLibrary: ContentLibrary;
  private readonly difficultyAdjuster: DifficultyAdjuster;

  constructor(dependencies?: ServerDependencies) {
    this.learnerModel = dependencies?.learnerModel ?? new PrismaLearnerModel();
    this.contentLibrary = dependencies?.contentLibrary ?? new PrismaContentLibrary();
    this.difficultyAdjuster = dependencies?.difficultyAdjuster ?? new ZpdDifficultyAdjuster();
  }

  async generateLessonPlan(learnerId: string, subject: Subject, duration = 14): Promise<LessonPlan> {
    const learner = await this.learnerModel.getProfile(learnerId);
    const baseline = await this.getBaselineAssessment(learnerId);
    const baselineLevels = baseline ? this.calculateDomainLevels(baseline.domainResults) : {};
    const domainLevels = { ...baselineLevels, ...learner.domainLevels };
    const schedule: DailyLesson[] = [];
    const today = new Date();

    for (let day = 0; day < duration; day++) {
      const lessons = await this.planDailyLessons({ learner, domainLevels, subject, day });
      schedule.push({
        date: addDays(today, day).toISOString(),
  focusDomain: lessons[0]?.domain ?? subjectToBaselineDomain(subject),
        lessons,
        estimatedMinutes: lessons.reduce((sum, lesson) => sum + lesson.estimatedMinutes, 0)
      });
    }

    return {
      id: cryptoRandomId(),
      learnerId,
      subject,
      startDate: today.toISOString(),
      endDate: addDays(today, duration).toISOString(),
      durationDays: duration,
      learnerProfile: learner,
      domainLevels,
      dailySchedule: schedule
    };
  }

  async adjustDifficulty(_sessionId: string, recentPerformance: PerformanceMetrics): Promise<DifficultyAdjustment> {
    const { accuracy, timePerQuestion, consecutiveCorrect, consecutiveIncorrect, currentLevel } = recentPerformance;
    const boundedLevel = clamp(currentLevel ?? 1, 1, 12);

    if (consecutiveCorrect >= 5 && accuracy >= 0.9) {
      return {
        action: "INCREASE",
        newLevel: Math.min(boundedLevel + 1, 12),
        reason: "High accuracy streak - increasing challenge"
      };
    }

    if (consecutiveIncorrect >= 3 || accuracy < 0.5 || timePerQuestion > 90_000) {
      const nextLevel = Math.max(boundedLevel - 1, 1);
      return {
        action: "DECREASE",
        newLevel: nextLevel,
        reason: "Struggling - providing more support",
        scaffolding: this.getScaffoldingSupport(nextLevel)
      };
    }

    if (accuracy >= 0.7 && accuracy < 0.9) {
      return {
        action: "MAINTAIN",
        newLevel: boundedLevel,
        reason: "Optimal challenge level",
        encouragement: this.getEncouragementMessage()
      };
    }

    return {
      action: "MAINTAIN",
      newLevel: boundedLevel,
      reason: "Collecting more evidence"
    };
  }

  async selectNextActivity(skill: Skill, learnerProfile: LearnerProfile, completedActivities: string[]): Promise<Activity> {
    const targetLevel = this.difficultyAdjuster.estimateStartingLevel({
      learner: learnerProfile,
      domainLevels: learnerProfile.domainLevels,
      subject: skill.domain,
      skill,
      dayIndex: completedActivities.length
    });

    const activities = await this.contentLibrary.getActivitiesForSkill(skill, targetLevel, 5);
    const remaining = activities.find((activity) => !completedActivities.includes(activity.id));

    if (remaining) {
      return remaining;
    }

    const [fallback] = await this.contentLibrary.getFallbackActivities({ subject: skill.domain, level: targetLevel, limit: 1 });
    return fallback;
  }

  private async getBaselineAssessment(learnerId: string): Promise<(BaselineAssessmentSession & { domainResults: BaselineDomainResult[] }) | null> {
    const prisma = await getPrisma();
    return prisma.baselineAssessmentSession.findFirst({
      where: { learnerId, status: "COMPLETED" },
      orderBy: { completedAt: "desc" },
      include: { domainResults: true }
    });
  }

  private calculateDomainLevels(results: BaselineDomainResult[]): Record<string, number> {
    if (!results.length) {
      return {};
    }

    const aggregates = results.reduce<Record<string, { total: number; count: number }>>((acc, result) => {
      const key = result.domain;
      const score = typeof result.score === "number" ? result.score : 0.6;
      const level = clamp(Math.round(score * 12), 1, 12);
      if (!acc[key]) {
        acc[key] = { total: 0, count: 0 };
      }
      acc[key].total += level;
      acc[key].count += 1;
      return acc;
    }, {});

    return Object.fromEntries(
      Object.entries(aggregates).map(([domain, { total, count }]) => [domain, Math.round(total / Math.max(count, 1))])
    );
  }

  private async planDailyLessons(args: {
    learner: LearnerProfile;
    domainLevels: Record<string, number>;
    subject: Subject;
    day: number;
  }): Promise<LessonActivity[]> {
    const { learner, domainLevels, subject, day } = args;
    const skills = await this.contentLibrary.getSkills(subject);
    const skill = skills[day % Math.max(skills.length, 1)] ?? buildFallbackSkill(subject);
    const baseLevel = this.difficultyAdjuster.estimateStartingLevel({
      learner,
      domainLevels,
      subject,
      skill,
      dayIndex: day
    });

    const activities = await this.contentLibrary.getActivitiesForSkill(skill, baseLevel, 3);
    const source = activities.length ? activities : await this.contentLibrary.getFallbackActivities({ subject, level: baseLevel, limit: 3 });

    return source.map((activity, index) => ({
      ...activity,
      skillId: skill.id,
      skillName: skill.name,
      domain: skill.domain,
      sequence: index + 1,
      scaffolds: activity.scaffolds.length ? activity.scaffolds : this.difficultyAdjuster.buildDailyScaffolds(activity.difficulty, learner)
    }));
  }

  private getScaffoldingSupport(level: number): string[] {
    return [
      `Revisit concrete examples at level ${level}`,
      "Use visual organizers before abstract practice",
      "Prompt verbal rehearsal before independent attempts"
    ];
  }

  private getEncouragementMessage(): string {
    const options = [
      "Right in the sweet spot—keep the momentum!",
      "Your focus is steady. Let’s build on this streak.",
      "Great balance of support and stretch today."
    ];
    return options[Math.floor(Math.random() * options.length)];
  }
}

class BrowserAdaptiveCurriculumEngine implements AdaptiveCurriculumEngineContract {
  async generateLessonPlan(_learnerId: string, subject: Subject, duration = 14): Promise<LessonPlan> {
    const response = await fetch("/api/curriculum/adaptive/lesson-plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, duration })
    });

    if (!response.ok) {
      throw new Error("Unable to generate adaptive lesson plan");
    }

    return (await response.json()) as LessonPlan;
  }

  async adjustDifficulty(sessionId: string, recentPerformance: PerformanceMetrics): Promise<DifficultyAdjustment> {
    const response = await fetch("/api/curriculum/adaptive/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, recentPerformance })
    });

    if (!response.ok) {
      throw new Error("Unable to adjust difficulty");
    }

    return (await response.json()) as DifficultyAdjustment;
  }

  async selectNextActivity(skill: Skill, learnerProfile: LearnerProfile, completedActivities: string[]): Promise<Activity> {
    const response = await fetch("/api/curriculum/adaptive/next-activity", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, learnerProfile, completedActivities })
    });

    if (!response.ok) {
      throw new Error("Unable to select next activity");
    }

    return (await response.json()) as Activity;
  }
}

class PrismaLearnerModel implements LearnerModel {
  constructor(private readonly prismaFactory: PrismaFactory = getPrisma) {}

  async getProfile(learnerId: string): Promise<LearnerProfile> {
    const prisma = await this.prismaFactory();
    const learner = await prisma.learner.findUnique({
      where: { id: learnerId },
      include: { diagnoses: true }
    });

    if (!learner) {
      throw new Error("Learner not found");
    }

    return {
      learnerId: learner.id,
      gradeLevel: learner.gradeLevel,
      actualLevel: learner.actualLevel ?? learner.gradeLevel,
      domainLevels: {},
      learningStyle: "MIXED",
  diagnoses: learner.diagnoses.map((diagnosis) => diagnosis.type ?? diagnosis.description ?? diagnosis.id),
      strengths: [],
      challenges: []
    };
  }
}

class PrismaContentLibrary implements ContentLibrary {
  constructor(private readonly prismaFactory: PrismaFactory = getPrisma) {}

  async getSkills(subject: Subject): Promise<Skill[]> {
    const prisma = await this.prismaFactory();
    const modules = await prisma.curriculumModule.findMany({
      where: { subject: subject.toUpperCase() },
      select: { id: true, title: true, skillFocus: true, targetGrade: true }
    });

    if (modules.length === 0) {
      return [buildFallbackSkill(subject)];
    }

    return modules.map((module) => ({
      id: module.id,
      name: module.skillFocus ?? module.title,
  domain: subjectToBaselineDomain(subject),
      description: module.skillFocus,
      targetGrade: module.targetGrade
    }));
  }

  async getActivitiesForSkill(skill: Skill, level: number, limit = 3): Promise<Activity[]> {
    const prisma = await this.prismaFactory();
    const contents = (await prisma.curriculumContent.findMany({
      where: { moduleId: skill.id, status: "ACTIVE" },
      orderBy: [{ difficultyLevel: "asc" }, { updatedAt: "desc" }],
      include: { primaryStandard: true, module: true },
      take: limit * 2
    })) as Array<CurriculumContent & { module?: CurriculumModule | null; primaryStandard?: { code?: string | null; id: string } | null }>;

    if (contents.length === 0) {
      return [];
    }

    const sorted = contents
      .map((content) => ({
        content,
        delta: Math.abs((content.difficultyLevel ?? level) - level)
      }))
      .sort((a, b) => a.delta - b.delta)
      .slice(0, limit)
      .map(({ content }, index) => this.mapContentToActivity(content, index));

    return sorted;
  }

  async getFallbackActivities({ subject, level, limit }: { subject: Subject; level: number; limit: number }): Promise<Activity[]> {
    return Array.from({ length: limit }).map((_, index) => ({
      id: `${subject}-fallback-${index}`,
      title: `${subject} practice burst ${index + 1}`,
      description: "Guided activity with manipulatives and calm pacing.",
      difficulty: clamp(level + index * 0.5, 1, 12),
      estimatedMinutes: 12,
      modality: subject === "SEL" ? "MIXED" : "VISUAL",
      hasVisualSupport: true,
      hasAudioNarration: subject === "READING",
      isInteractive: true,
      hasVisualSchedule: true,
      resources: [
        {
          type: "TEXT",
          label: "Prompt",
          description: "Follow the scaffolded prompt to keep the task low-stress."
        }
      ],
      scaffolds: ["Chunk instructions", "Use sentence frames", "Offer movement breaks"],
      standardCodes: [],
      contentId: undefined
    }));
  }

  private mapContentToActivity(
    content: CurriculumContent & { module?: CurriculumModule | null; primaryStandard?: { code?: string | null; id: string } | null },
    index: number
  ): Activity {
    const tags = (content.aiTags ?? []).map((tag) => tag.toLowerCase());
    const summary = content.summary ?? "Adaptive content";

    return {
      id: `${content.id}-v${index}`,
      title: content.title,
      description: summary,
      difficulty: clamp(Math.round(content.difficultyLevel ?? 5), 1, 12),
      estimatedMinutes: content.module?.durationMinutes ?? 15,
      modality: tags.includes("auditory") ? "AUDITORY" : tags.includes("kinesthetic") ? "KINESTHETIC" : "VISUAL",
      hasVisualSupport: tags.includes("visual") || tags.includes("graphic"),
      hasAudioNarration: tags.includes("audio") || tags.includes("auditory"),
      isInteractive: tags.includes("interactive") || tags.includes("game"),
      hasVisualSchedule: tags.includes("schedule") || tags.includes("structured"),
      resources: this.buildResources(content),
      scaffolds: [],
      standardCodes: content.primaryStandard ? [content.primaryStandard.code ?? content.primaryStandard.id] : [],
      contentId: content.id
    };
  }

  private buildResources(content: CurriculumContent): ActivityResource[] {
    const resources: ActivityResource[] = [];
    if (content.summary) {
      resources.push({ type: "TEXT", label: "Summary", description: content.summary });
    }
    if ((content.aiTags ?? []).includes("video")) {
      resources.push({ type: "VIDEO", label: "Visual support", description: "Watch a quick clip to preview the concept." });
    }
    if ((content.aiTags ?? []).includes("audio")) {
      resources.push({ type: "AUDIO", label: "Calm narration", description: "Listen while following along." });
    }
    return resources;
  }
}

class ZpdDifficultyAdjuster implements DifficultyAdjuster {
  estimateStartingLevel(args: { learner: LearnerProfile; domainLevels: Record<string, number>; subject: Subject; skill: Skill; dayIndex: number }): number {
    const { learner, domainLevels, subject, dayIndex } = args;
    const domainLevel = domainLevels[subject] ?? learner.domainLevels[subject] ?? learner.actualLevel ?? learner.gradeLevel;
    const adjustment = dayIndex % 3 === 0 ? 0.5 : 0;
    return clamp(Math.round(domainLevel + adjustment), 1, 12);
  }

  buildDailyScaffolds(level: number, profile: LearnerProfile): string[] {
    const supports = ["Use worked examples", "Model one example together", `Check in after step ${Math.max(level - 2, 1)}`];

    if (profile.diagnoses.includes("ADHD")) {
      supports.push("Add short movement breaks", "Use timers for micro-deadlines");
    }

    if (profile.diagnoses.includes("ASD")) {
      supports.push("Preview visual schedule", "Provide concrete scripts");
    }

    return supports;
  }
}

function buildFallbackSkill(subject: Subject): Skill {
  return {
    id: `${subject}-core-skill`,
    name: `${subject} fundamentals`,
  domain: subjectToBaselineDomain(subject),
    description: `${subject} adaptive strand`,
    targetGrade: 5
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
