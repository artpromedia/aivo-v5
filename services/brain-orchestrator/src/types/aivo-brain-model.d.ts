declare module "@aivo/brain-model" {
  import type { LearnerBrainProfile, SubjectCode } from "@aivo/types";

  export interface DifficultyRecommendation {
    subject: SubjectCode;
    recommendedDifficulty: "easier" | "maintain" | "harder";
    rationale: string;
  }

  export function getDifficultyRecommendations(
    profile: LearnerBrainProfile
  ): DifficultyRecommendation[];
}
