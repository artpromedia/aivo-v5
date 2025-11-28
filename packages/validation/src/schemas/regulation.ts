/**
 * Self-Regulation Validation Schemas for AIVO v5
 */

import { z } from 'zod';
import { idSchema, paginationSchema } from './common';

/** Mood/emotion type */
export const moodSchema = z.enum([
  'HAPPY',
  'CALM',
  'FOCUSED',
  'TIRED',
  'FRUSTRATED',
  'ANXIOUS',
  'SAD',
  'EXCITED',
  'BORED',
  'CONFUSED',
]);

/** Energy level */
export const energyLevelSchema = z.enum([
  'VERY_LOW',
  'LOW',
  'MEDIUM',
  'HIGH',
  'VERY_HIGH',
]);

/** Regulation activity type */
export const activityTypeSchema = z.enum([
  'BREATHING',
  'MOVEMENT',
  'SENSORY',
  'MINDFULNESS',
  'BREAK',
  'MUSIC',
  'JOURNALING',
]);

/** Submit mood check-in */
export const submitMoodCheckinSchema = z.object({
  learnerId: idSchema,
  mood: moodSchema,
  energyLevel: energyLevelSchema.optional(),
  notes: z.string().max(500).optional(),
  context: z.enum(['START_SESSION', 'DURING_SESSION', 'END_SESSION', 'MANUAL']).default('MANUAL'),
});

/** Start regulation activity */
export const startActivitySchema = z.object({
  learnerId: idSchema,
  activityType: activityTypeSchema,
  duration: z.number().int().min(30).max(1800), // 30 seconds to 30 minutes
  settings: z.record(z.unknown()).optional(),
});

/** Complete regulation activity */
export const completeActivitySchema = z.object({
  activityId: idSchema,
  completedDuration: z.number().int().min(0),
  moodAfter: moodSchema.optional(),
  effectiveness: z.number().min(1).max(5).optional(),
  feedback: z.string().max(500).optional(),
});

/** Start focus session */
export const startFocusSessionSchema = z.object({
  learnerId: idSchema,
  targetDuration: z.number().int().min(5).max(120), // minutes
  breakInterval: z.number().int().min(5).max(60).optional(), // minutes
  breakDuration: z.number().int().min(1).max(15).optional(), // minutes
  taskDescription: z.string().max(200).optional(),
});

/** Update focus session */
export const updateFocusSessionSchema = z.object({
  sessionId: idSchema,
  action: z.enum(['PAUSE', 'RESUME', 'END', 'EXTEND']),
  extensionMinutes: z.number().int().min(5).max(30).optional(),
});

/** List mood history query */
export const listMoodHistorySchema = z
  .object({
    learnerId: idSchema,
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    context: z.enum(['START_SESSION', 'DURING_SESSION', 'END_SESSION', 'MANUAL']).optional(),
  })
  .merge(paginationSchema);

/** Get regulation recommendations */
export const getRecommendationsSchema = z.object({
  learnerId: idSchema,
  currentMood: moodSchema.optional(),
  currentEnergy: energyLevelSchema.optional(),
  context: z.string().max(500).optional(),
});

/** Journal entry */
export const createJournalEntrySchema = z.object({
  learnerId: idSchema,
  content: z.string().min(1).max(5000),
  mood: moodSchema.optional(),
  isPrivate: z.boolean().default(true),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

// Export types
export type Mood = z.infer<typeof moodSchema>;
export type EnergyLevel = z.infer<typeof energyLevelSchema>;
export type ActivityType = z.infer<typeof activityTypeSchema>;
export type SubmitMoodCheckinInput = z.infer<typeof submitMoodCheckinSchema>;
export type StartActivityInput = z.infer<typeof startActivitySchema>;
export type CompleteActivityInput = z.infer<typeof completeActivitySchema>;
export type StartFocusSessionInput = z.infer<typeof startFocusSessionSchema>;
export type UpdateFocusSessionInput = z.infer<typeof updateFocusSessionSchema>;
export type ListMoodHistoryInput = z.infer<typeof listMoodHistorySchema>;
export type GetRecommendationsInput = z.infer<typeof getRecommendationsSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
