export const BASELINE_DOMAIN_VALUES = [
  "SPEECH_LANGUAGE",
  "READING",
  "MATH",
  "SCIENCE_SOCIAL",
  "SEL"
] as const;

export type BaselineDomain = (typeof BASELINE_DOMAIN_VALUES)[number];

export const BaselineDomainEnum = {
  SPEECH_LANGUAGE: BASELINE_DOMAIN_VALUES[0],
  READING: BASELINE_DOMAIN_VALUES[1],
  MATH: BASELINE_DOMAIN_VALUES[2],
  SCIENCE_SOCIAL: BASELINE_DOMAIN_VALUES[3],
  SEL: BASELINE_DOMAIN_VALUES[4]
} as const satisfies Record<string, BaselineDomain>;

export const BASELINE_ASSESSMENT_STATUS_VALUES = [
  "IN_PROGRESS",
  "COMPLETED",
  "ABANDONED"
] as const;

export type BaselineAssessmentStatus = (typeof BASELINE_ASSESSMENT_STATUS_VALUES)[number];

export const BaselineAssessmentStatusEnum = {
  IN_PROGRESS: BASELINE_ASSESSMENT_STATUS_VALUES[0],
  COMPLETED: BASELINE_ASSESSMENT_STATUS_VALUES[1],
  ABANDONED: BASELINE_ASSESSMENT_STATUS_VALUES[2]
} as const satisfies Record<string, BaselineAssessmentStatus>;
