import type {
  GradeBand,
  LearnerBrainProfile,
  Region,
  SubjectCode,
  SubjectLevel
} from "@aivo/types";
import { getLearnerWithBrainProfile } from "@aivo/persistence";

export type RawLearnerRecordWithProfile = Awaited<
  ReturnType<typeof getLearnerWithBrainProfile>
>;
export type LearnerRecordWithProfile = NonNullable<RawLearnerRecordWithProfile>;

function inferGradeBand(grade: number): GradeBand {
  if (grade <= 5) return "k_5";
  if (grade <= 8) return "6_8";
  return "9_12";
}

function buildDefaultSubjectLevels(grade: number): SubjectLevel[] {
  const clampedGrade = Number.isFinite(grade) ? grade : 6;
  const assessed = Math.max(1, clampedGrade - 2);
  return ["math", "ela"].map((subject) => ({
    subject: subject as SubjectCode,
    enrolledGrade: clampedGrade,
    assessedGradeLevel: assessed,
    masteryScore: 0.55
  }));
}

export function createDefaultBrainProfile(args: {
  learnerId: string;
  tenantId: string;
  region: Region;
  currentGrade: number;
}): LearnerBrainProfile {
  const gradeBand = inferGradeBand(args.currentGrade);
  return {
    learnerId: args.learnerId,
    tenantId: args.tenantId,
    region: args.region,
    currentGrade: args.currentGrade,
    gradeBand,
    subjectLevels: buildDefaultSubjectLevels(args.currentGrade),
    neurodiversity: {},
    preferences: {},
    lastUpdatedAt: new Date().toISOString()
  };
}

export async function fetchLearnerBrainProfile(
  learnerId: string,
  existingRecord?: RawLearnerRecordWithProfile
): Promise<LearnerBrainProfile | null> {
  const record = existingRecord ?? (await getLearnerWithBrainProfile(learnerId));
  if (!record) return null;

  const region = (record.region as Region) ?? "north_america";
  const currentGrade = record.currentGrade ?? 6;

  if (!record.brainProfile) {
    return createDefaultBrainProfile({
      learnerId: record.id,
      tenantId: record.tenantId,
      region,
      currentGrade
    });
  }

  const gradeBand = (record.brainProfile.gradeBand as GradeBand) ?? inferGradeBand(currentGrade);
  const subjectLevels = Array.isArray(record.brainProfile.subjectLevels)
    ? (record.brainProfile.subjectLevels as unknown as SubjectLevel[])
    : [];

  return {
    learnerId: record.id,
    tenantId: record.tenantId,
    region: (record.brainProfile.region as Region) ?? region,
    currentGrade: record.brainProfile.currentGrade ?? currentGrade,
    gradeBand,
    subjectLevels,
    neurodiversity: (record.brainProfile.neurodiversity as Record<string, unknown>) ?? {},
    preferences: (record.brainProfile.preferences as Record<string, unknown>) ?? {},
    lastUpdatedAt: record.brainProfile.updatedAt.toISOString()
  };
}
