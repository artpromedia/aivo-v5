import { GradeBand, LearnerBrainProfile, SubjectLevel } from "@aivo/types";

export function getGradeBand(grade: number): GradeBand {
  if (grade <= 5) return "k_5";
  if (grade <= 8) return "6_8";
  return "9_12";
}

export function computeDifficultyLevel(level: SubjectLevel): "remedial" | "on_level" | "advanced" {
  const diff = level.enrolledGrade - level.assessedGradeLevel;
  if (diff >= 2) return "remedial";
  if (diff <= -1) return "advanced";
  return "on_level";
}

export interface DifficultyRecommendation {
  subject: SubjectLevel["subject"];
  recommendedDifficulty: "easier" | "maintain" | "harder";
  rationale: string;
}

export function getDifficultyRecommendations(
  profile: LearnerBrainProfile
): DifficultyRecommendation[] {
  return profile.subjectLevels.map((level) => {
    const mode = computeDifficultyLevel(level);
    if (mode === "remedial") {
      return {
        subject: level.subject,
        recommendedDifficulty: "easier",
        rationale:
          "Learner is significantly below enrolled grade in this subject; scaffold 7th grade content at a 5th grade difficulty and gradually ramp up."
      };
    }
    if (mode === "advanced") {
      return {
        subject: level.subject,
        recommendedDifficulty: "harder",
        rationale:
          "Learner is ahead of enrolled grade; introduce more challenging extensions with explicit consent from guardian/teacher."
      };
    }
    return {
      subject: level.subject,
      recommendedDifficulty: "maintain",
      rationale: "Learner is close to enrolled grade; keep current difficulty and monitor mastery."
    };
  });
}

// Export agent system
export { AgentManager } from './agents/AgentManager'
export { AgentOrchestrator } from './agents/base/AgentOrchestrator'
export { PersonalizedLearningAgent } from './agents/implementations/PersonalizedLearningAgent'
export { AITutorAgent } from './agents/implementations/AITutorAgent'
export { ContentAdaptationAgent } from './agents/implementations/ContentAdaptationAgent'
