/**
 * Homework Validation Schemas for AIVO v5
 */

import { z } from 'zod';
import { idSchema, subjectSchema, gradeLevelSchema, paginationSchema } from './common';

/** Homework session status */
export const homeworkStatusSchema = z.enum([
  'IN_PROGRESS',
  'COMPLETED',
  'ABANDONED',
  'PAUSED',
]);

/** Homework step */
export const homeworkStepSchema = z.enum([
  'UNDERSTAND',
  'PLAN',
  'SOLVE',
  'CHECK',
]);

/** Difficulty mode for homework */
export const difficultyModeSchema = z.enum([
  'SCAFFOLDED',
  'STANDARD',
  'CHALLENGE',
]);

/** Create homework session input */
export const createHomeworkSessionSchema = z.object({
  learnerId: idSchema,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  subject: subjectSchema.optional(),
  gradeLevel: gradeLevelSchema.optional(),
  difficultyMode: difficultyModeSchema.default('SCAFFOLDED'),
  parentAssistMode: z.boolean().default(false),
  description: z.string().max(2000).optional(),
  imageUrl: z.string().url().optional(),
});

/** Update homework step input */
export const updateHomeworkStepSchema = z.object({
  step: homeworkStepSchema,
  content: z.string().max(10000, 'Content too long'),
  metadata: z.record(z.unknown()).optional(),
  completedAt: z.coerce.date().optional(),
});

/** Request hint for homework */
export const homeworkHintRequestSchema = z.object({
  hintLevel: z.coerce.number().int().min(1).max(3).default(1),
  context: z.string().max(5000).optional(),
  stepId: z.string().optional(),
});

/** List homework sessions query */
export const listHomeworkSessionsSchema = z
  .object({
    learnerId: idSchema,
    status: homeworkStatusSchema.optional(),
    subject: subjectSchema.optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .merge(paginationSchema);

/** Update homework session */
export const updateHomeworkSessionSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  status: homeworkStatusSchema.optional(),
  completedAt: z.coerce.date().optional(),
});

/** Submit homework answer */
export const submitHomeworkAnswerSchema = z.object({
  sessionId: idSchema,
  stepId: z.string(),
  answer: z.string().max(50000),
  attachments: z
    .array(
      z.object({
        type: z.enum(['image', 'audio', 'file']),
        url: z.string().url(),
        name: z.string().max(255),
      })
    )
    .max(5)
    .optional(),
});

// Export types
export type HomeworkStatus = z.infer<typeof homeworkStatusSchema>;
export type HomeworkStep = z.infer<typeof homeworkStepSchema>;
export type DifficultyMode = z.infer<typeof difficultyModeSchema>;
export type CreateHomeworkSessionInput = z.infer<typeof createHomeworkSessionSchema>;
export type UpdateHomeworkStepInput = z.infer<typeof updateHomeworkStepSchema>;
export type HomeworkHintRequestInput = z.infer<typeof homeworkHintRequestSchema>;
export type ListHomeworkSessionsInput = z.infer<typeof listHomeworkSessionsSchema>;
export type UpdateHomeworkSessionInput = z.infer<typeof updateHomeworkSessionSchema>;
export type SubmitHomeworkAnswerInput = z.infer<typeof submitHomeworkAnswerSchema>;
