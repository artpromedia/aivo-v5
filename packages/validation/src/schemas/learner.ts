/**
 * Learner Profile Validation Schemas for AIVO v5
 */

import { z } from 'zod';
import { idSchema, gradeLevelSchema, learningStyleSchema, paginationSchema, displayNameSchema } from './common';

/** Learner age group */
export const ageGroupSchema = z.enum([
  'EARLY_CHILDHOOD', // 3-5
  'ELEMENTARY', // 6-10
  'MIDDLE_SCHOOL', // 11-13
  'HIGH_SCHOOL', // 14-18
]);

/** Special needs/accommodations */
export const accommodationSchema = z.enum([
  'EXTENDED_TIME',
  'TEXT_TO_SPEECH',
  'SPEECH_TO_TEXT',
  'LARGE_TEXT',
  'HIGH_CONTRAST',
  'REDUCED_MOTION',
  'SIMPLIFIED_UI',
  'FREQUENT_BREAKS',
  'AUDIO_INSTRUCTIONS',
  'VISUAL_SUPPORTS',
]);

/** Create learner profile */
export const createLearnerSchema = z.object({
  firstName: displayNameSchema,
  lastName: displayNameSchema,
  dateOfBirth: z.coerce.date().optional(),
  gradeLevel: gradeLevelSchema,
  parentId: idSchema.optional(),
  schoolId: idSchema.optional(),
  avatarUrl: z.string().url().optional(),
});

/** Update learner profile */
export const updateLearnerSchema = z.object({
  firstName: displayNameSchema.optional(),
  lastName: displayNameSchema.optional(),
  gradeLevel: gradeLevelSchema.optional(),
  avatarUrl: z.string().url().optional().nullable(),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

/** Update learner preferences */
export const updateLearnerPreferencesSchema = z.object({
  learnerId: idSchema,
  learningStyle: learningStyleSchema.optional(),
  preferredSubjects: z.array(z.string()).max(5).optional(),
  accommodations: z.array(accommodationSchema).optional(),
  sessionDurationPreference: z.number().int().min(5).max(60).optional(), // minutes
  breakFrequency: z.number().int().min(5).max(30).optional(), // minutes
  notificationsEnabled: z.boolean().optional(),
  soundEnabled: z.boolean().optional(),
  hapticFeedback: z.boolean().optional(),
});

/** Link learner to parent/teacher */
export const linkLearnerSchema = z.object({
  learnerId: idSchema,
  userId: idSchema,
  relationship: z.enum(['PARENT', 'GUARDIAN', 'TEACHER', 'TUTOR', 'COUNSELOR']),
  permissions: z.array(z.enum([
    'VIEW_PROGRESS',
    'VIEW_SESSIONS',
    'MANAGE_SETTINGS',
    'RECEIVE_NOTIFICATIONS',
    'COMMUNICATE',
  ])).optional(),
});

/** List learners query */
export const listLearnersSchema = z
  .object({
    parentId: idSchema.optional(),
    schoolId: idSchema.optional(),
    classId: idSchema.optional(),
    gradeLevel: gradeLevelSchema.optional(),
    search: z.string().max(100).optional(),
  })
  .merge(paginationSchema);

/** Get learner progress query */
export const getLearnerProgressSchema = z.object({
  learnerId: idSchema,
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  subjects: z.array(z.string()).optional(),
  includeDetails: z.coerce.boolean().default(false),
});

/** Learner goal */
export const createLearnerGoalSchema = z.object({
  learnerId: idSchema,
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  targetDate: z.coerce.date().optional(),
  subject: z.string().optional(),
  metricType: z.enum(['COMPLETION', 'SCORE', 'TIME', 'STREAK']),
  targetValue: z.number().positive(),
});

// Export types
export type AgeGroup = z.infer<typeof ageGroupSchema>;
export type Accommodation = z.infer<typeof accommodationSchema>;
export type CreateLearnerInput = z.infer<typeof createLearnerSchema>;
export type UpdateLearnerInput = z.infer<typeof updateLearnerSchema>;
export type UpdateLearnerPreferencesInput = z.infer<typeof updateLearnerPreferencesSchema>;
export type LinkLearnerInput = z.infer<typeof linkLearnerSchema>;
export type ListLearnersInput = z.infer<typeof listLearnersSchema>;
export type GetLearnerProgressInput = z.infer<typeof getLearnerProgressSchema>;
export type CreateLearnerGoalInput = z.infer<typeof createLearnerGoalSchema>;
