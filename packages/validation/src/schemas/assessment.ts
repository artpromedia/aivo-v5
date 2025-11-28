/**
 * Assessment Validation Schemas for AIVO v5
 */

import { z } from 'zod';
import { idSchema, subjectSchema, gradeLevelSchema, paginationSchema } from './common';

/** Assessment type */
export const assessmentTypeSchema = z.enum([
  'BASELINE',
  'PROGRESS',
  'DIAGNOSTIC',
  'SUMMATIVE',
  'FORMATIVE',
]);

/** Assessment status */
export const assessmentStatusSchema = z.enum([
  'NOT_STARTED',
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
  'EXPIRED',
]);

/** Question type */
export const questionTypeSchema = z.enum([
  'MULTIPLE_CHOICE',
  'TRUE_FALSE',
  'SHORT_ANSWER',
  'ESSAY',
  'MATCHING',
  'FILL_BLANK',
  'DRAG_DROP',
]);

/** Start assessment */
export const startAssessmentSchema = z.object({
  learnerId: idSchema,
  assessmentType: assessmentTypeSchema.default('BASELINE'),
  subjects: z.array(subjectSchema).min(1).max(5).optional(),
  gradeLevel: gradeLevelSchema.optional(),
  adaptiveDifficulty: z.boolean().default(true),
});

/** Submit assessment answer */
export const submitAssessmentAnswerSchema = z.object({
  assessmentId: idSchema,
  questionId: idSchema,
  answer: z.union([
    z.string(), // For text answers
    z.array(z.string()), // For multiple selection
    z.record(z.string()), // For matching
  ]),
  timeSpentSeconds: z.number().int().min(0).optional(),
  confidence: z.number().min(0).max(1).optional(),
});

/** Complete assessment */
export const completeAssessmentSchema = z.object({
  assessmentId: idSchema,
  feedback: z.string().max(1000).optional(),
});

/** List assessments query */
export const listAssessmentsSchema = z
  .object({
    learnerId: idSchema.optional(),
    type: assessmentTypeSchema.optional(),
    status: assessmentStatusSchema.optional(),
    subject: subjectSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .merge(paginationSchema);

/** Get assessment results query */
export const getAssessmentResultsSchema = z.object({
  assessmentId: idSchema,
  includeQuestions: z.coerce.boolean().default(false),
  includeAnalysis: z.coerce.boolean().default(true),
});

/** Create assessment (admin/teacher) */
export const createAssessmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: assessmentTypeSchema,
  subjects: z.array(subjectSchema).min(1),
  gradeLevel: gradeLevelSchema,
  duration: z.number().int().min(5).max(180).optional(), // minutes
  questions: z.array(z.object({
    type: questionTypeSchema,
    content: z.string().min(1).max(5000),
    options: z.array(z.string()).optional(),
    correctAnswer: z.union([z.string(), z.array(z.string())]),
    points: z.number().int().min(1).default(1),
    explanation: z.string().max(2000).optional(),
  })).min(1).max(100),
});

// Export types
export type AssessmentType = z.infer<typeof assessmentTypeSchema>;
export type AssessmentStatus = z.infer<typeof assessmentStatusSchema>;
export type QuestionType = z.infer<typeof questionTypeSchema>;
export type StartAssessmentInput = z.infer<typeof startAssessmentSchema>;
export type SubmitAssessmentAnswerInput = z.infer<typeof submitAssessmentAnswerSchema>;
export type CompleteAssessmentInput = z.infer<typeof completeAssessmentSchema>;
export type ListAssessmentsInput = z.infer<typeof listAssessmentsSchema>;
export type GetAssessmentResultsInput = z.infer<typeof getAssessmentResultsSchema>;
export type CreateAssessmentInput = z.infer<typeof createAssessmentSchema>;
