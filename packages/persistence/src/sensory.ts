/**
 * Sensory Profile Persistence Layer
 * 
 * Database operations for managing accessibility accommodations for neurodiverse learners.
 */

import { prisma } from "./client";
import { Prisma } from "@prisma/client";
import type { SensoryProfile } from "@prisma/client";

// =============================================================================
// Types
// =============================================================================

export interface VisualSettings {
  reduceAnimations: boolean;
  reduceMotion: boolean;
  highContrast: boolean;
  darkMode: boolean;
  reducedClutter: boolean;
  fontSize: "small" | "medium" | "large" | "x-large";
  fontFamily: "default" | "dyslexic" | "sans-serif" | "serif";
  lineSpacing: "normal" | "relaxed" | "loose";
  colorScheme: "default" | "warm" | "cool" | "muted" | "high-contrast";
  flashingContent: "allow" | "warn" | "block";
}

export interface AuditorySettings {
  muteAllSounds: boolean;
  soundVolume: number;
  noBackgroundMusic: boolean;
  noSoundEffects: boolean;
  textToSpeechEnabled: boolean;
  textToSpeechSpeed: number;
  textToSpeechVoice: string;
  audioDescriptions: boolean;
}

export interface MotorSettings {
  largerClickTargets: boolean;
  noDoubleClick: boolean;
  noDragAndDrop: boolean;
  increaseSpacing: boolean;
  stickyKeys: boolean;
  keyboardOnly: boolean;
  touchAccommodations: boolean;
  hoverDelay: number;
}

export interface CognitiveSettings {
  oneThingAtATime: boolean;
  noPopups: boolean;
  noAutoplay: boolean;
  simplifyInstructions: boolean;
  showProgressIndicator: boolean;
  limitChoices: number | null;
  extendedTime: boolean;
  timeMultiplier: number;
  breakReminders: boolean;
  breakFrequency: number;
}

export interface EnvironmentSettings {
  fullScreenMode: boolean;
  minimizeDistractions: boolean;
  hideChat: boolean;
  hideNotifications: boolean;
  whiteNoise: "none" | "rain" | "ocean" | "forest" | "pink" | "brown";
}

export interface TriggerSettings {
  avoidColors: string[];
  avoidPatterns: string[];
  avoidFlashing: boolean;
  contentWarnings: string[];
}

export interface SensoryProfileData {
  id: string;
  learnerId: string;
  name: string | null;
  presetId: string | null;
  isActive: boolean;
  visual: VisualSettings;
  auditory: AuditorySettings;
  motor: MotorSettings;
  cognitive: CognitiveSettings;
  environment: EnvironmentSettings;
  triggers: TriggerSettings | null;
  lastEffectivenessCheck: Date | null;
  effectivenessScore: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSensoryProfileInput {
  learnerId: string;
  name?: string;
  presetId?: string;
  isActive?: boolean;
  visual?: Partial<VisualSettings>;
  auditory?: Partial<AuditorySettings>;
  motor?: Partial<MotorSettings>;
  cognitive?: Partial<CognitiveSettings>;
  environment?: Partial<EnvironmentSettings>;
  triggers?: Partial<TriggerSettings>;
}

export interface UpdateSensoryProfileInput {
  name?: string;
  presetId?: string | null;
  isActive?: boolean;
  visual?: Partial<VisualSettings>;
  auditory?: Partial<AuditorySettings>;
  motor?: Partial<MotorSettings>;
  cognitive?: Partial<CognitiveSettings>;
  environment?: Partial<EnvironmentSettings>;
  triggers?: Partial<TriggerSettings> | null;
}

// =============================================================================
// Default Settings
// =============================================================================

export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  reduceAnimations: false,
  reduceMotion: false,
  highContrast: false,
  darkMode: false,
  reducedClutter: false,
  fontSize: "medium",
  fontFamily: "default",
  lineSpacing: "normal",
  colorScheme: "default",
  flashingContent: "allow",
};

export const DEFAULT_AUDITORY_SETTINGS: AuditorySettings = {
  muteAllSounds: false,
  soundVolume: 70,
  noBackgroundMusic: false,
  noSoundEffects: false,
  textToSpeechEnabled: false,
  textToSpeechSpeed: 1.0,
  textToSpeechVoice: "default",
  audioDescriptions: false,
};

export const DEFAULT_MOTOR_SETTINGS: MotorSettings = {
  largerClickTargets: false,
  noDoubleClick: false,
  noDragAndDrop: false,
  increaseSpacing: false,
  stickyKeys: false,
  keyboardOnly: false,
  touchAccommodations: false,
  hoverDelay: 0,
};

export const DEFAULT_COGNITIVE_SETTINGS: CognitiveSettings = {
  oneThingAtATime: false,
  noPopups: false,
  noAutoplay: false,
  simplifyInstructions: false,
  showProgressIndicator: true,
  limitChoices: null,
  extendedTime: false,
  timeMultiplier: 1.0,
  breakReminders: false,
  breakFrequency: 30,
};

export const DEFAULT_ENVIRONMENT_SETTINGS: EnvironmentSettings = {
  fullScreenMode: false,
  minimizeDistractions: false,
  hideChat: false,
  hideNotifications: false,
  whiteNoise: "none",
};

export const DEFAULT_TRIGGER_SETTINGS: TriggerSettings = {
  avoidColors: [],
  avoidPatterns: [],
  avoidFlashing: false,
  contentWarnings: [],
};

// =============================================================================
// Helper Functions
// =============================================================================

function parseJsonField<T>(value: Prisma.JsonValue, defaultValue: T): T {
  if (value === null || value === undefined) return defaultValue;
  return value as unknown as T;
}

function toSensoryProfileData(profile: SensoryProfile): SensoryProfileData {
  return {
    id: profile.id,
    learnerId: profile.learnerId,
    name: profile.name,
    presetId: profile.presetId,
    isActive: profile.isActive,
    visual: parseJsonField(profile.visual, DEFAULT_VISUAL_SETTINGS),
    auditory: parseJsonField(profile.auditory, DEFAULT_AUDITORY_SETTINGS),
    motor: parseJsonField(profile.motor, DEFAULT_MOTOR_SETTINGS),
    cognitive: parseJsonField(profile.cognitive, DEFAULT_COGNITIVE_SETTINGS),
    environment: parseJsonField(profile.environment, DEFAULT_ENVIRONMENT_SETTINGS),
    triggers: parseJsonField(profile.triggers, null),
    lastEffectivenessCheck: profile.lastEffectivenessCheck,
    effectivenessScore: profile.effectivenessScore,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

function mergeSettings<T>(current: T, updates: Partial<T> | undefined): T {
  if (!updates) return current;
  return { ...current, ...updates };
}

// =============================================================================
// CRUD Operations
// =============================================================================

/**
 * Get a sensory profile by learner ID
 */
export async function getSensoryProfile(learnerId: string): Promise<SensoryProfileData | null> {
  const profile = await prisma.sensoryProfile.findUnique({
    where: { learnerId },
  });

  if (!profile) return null;
  return toSensoryProfileData(profile);
}

/**
 * Get a sensory profile by ID
 */
export async function getSensoryProfileById(id: string): Promise<SensoryProfileData | null> {
  const profile = await prisma.sensoryProfile.findUnique({
    where: { id },
  });

  if (!profile) return null;
  return toSensoryProfileData(profile);
}

/**
 * Create a new sensory profile
 */
export async function createSensoryProfile(input: CreateSensoryProfileInput): Promise<SensoryProfileData> {
  const profile = await prisma.sensoryProfile.create({
    data: {
      learnerId: input.learnerId,
      name: input.name ?? null,
      presetId: input.presetId ?? null,
      isActive: input.isActive ?? true,
      visual: mergeSettings(DEFAULT_VISUAL_SETTINGS, input.visual) as unknown as Prisma.InputJsonValue,
      auditory: mergeSettings(DEFAULT_AUDITORY_SETTINGS, input.auditory) as unknown as Prisma.InputJsonValue,
      motor: mergeSettings(DEFAULT_MOTOR_SETTINGS, input.motor) as unknown as Prisma.InputJsonValue,
      cognitive: mergeSettings(DEFAULT_COGNITIVE_SETTINGS, input.cognitive) as unknown as Prisma.InputJsonValue,
      environment: mergeSettings(DEFAULT_ENVIRONMENT_SETTINGS, input.environment) as unknown as Prisma.InputJsonValue,
      triggers: input.triggers 
        ? (mergeSettings(DEFAULT_TRIGGER_SETTINGS, input.triggers) as unknown as Prisma.InputJsonValue) 
        : Prisma.DbNull,
    },
  });

  return toSensoryProfileData(profile);
}

/**
 * Update an existing sensory profile
 */
export async function updateSensoryProfile(
  learnerId: string,
  input: UpdateSensoryProfileInput
): Promise<SensoryProfileData | null> {
  // First get current profile to merge settings
  const current = await getSensoryProfile(learnerId);
  if (!current) return null;

  const profile = await prisma.sensoryProfile.update({
    where: { learnerId },
    data: {
      name: input.name !== undefined ? input.name : undefined,
      presetId: input.presetId !== undefined ? input.presetId : undefined,
      isActive: input.isActive !== undefined ? input.isActive : undefined,
      visual: input.visual
        ? (mergeSettings(current.visual, input.visual) as unknown as Prisma.InputJsonValue)
        : undefined,
      auditory: input.auditory
        ? (mergeSettings(current.auditory, input.auditory) as unknown as Prisma.InputJsonValue)
        : undefined,
      motor: input.motor
        ? (mergeSettings(current.motor, input.motor) as unknown as Prisma.InputJsonValue)
        : undefined,
      cognitive: input.cognitive
        ? (mergeSettings(current.cognitive, input.cognitive) as unknown as Prisma.InputJsonValue)
        : undefined,
      environment: input.environment
        ? (mergeSettings(current.environment, input.environment) as unknown as Prisma.InputJsonValue)
        : undefined,
      triggers: input.triggers !== undefined
        ? input.triggers === null
          ? Prisma.DbNull
          : (mergeSettings(current.triggers ?? DEFAULT_TRIGGER_SETTINGS, input.triggers) as unknown as Prisma.InputJsonValue)
        : undefined,
    },
  });

  return toSensoryProfileData(profile);
}

/**
 * Create or update a sensory profile (upsert)
 */
export async function upsertSensoryProfile(
  learnerId: string,
  input: UpdateSensoryProfileInput
): Promise<SensoryProfileData> {
  const existing = await getSensoryProfile(learnerId);

  if (existing) {
    const updated = await updateSensoryProfile(learnerId, input);
    return updated!;
  }

  // Convert UpdateSensoryProfileInput to CreateSensoryProfileInput
  const createInput: CreateSensoryProfileInput = {
    learnerId,
    name: input.name,
    presetId: input.presetId ?? undefined,
    isActive: input.isActive,
    visual: input.visual,
    auditory: input.auditory,
    motor: input.motor,
    cognitive: input.cognitive,
    environment: input.environment,
    triggers: input.triggers ?? undefined,
  };

  return createSensoryProfile(createInput);
}

/**
 * Delete a sensory profile
 */
export async function deleteSensoryProfile(learnerId: string): Promise<boolean> {
  try {
    await prisma.sensoryProfile.delete({
      where: { learnerId },
    });
    return true;
  } catch {
    return false;
  }
}

// =============================================================================
// Preset Operations
// =============================================================================

export interface PresetSettings {
  visual?: Partial<VisualSettings>;
  auditory?: Partial<AuditorySettings>;
  motor?: Partial<MotorSettings>;
  cognitive?: Partial<CognitiveSettings>;
  environment?: Partial<EnvironmentSettings>;
  triggers?: Partial<TriggerSettings>;
}

/**
 * Apply a preset to a learner's profile
 */
export async function applyPreset(
  learnerId: string,
  presetId: string,
  presetSettings: PresetSettings,
  customizations?: Partial<PresetSettings>
): Promise<SensoryProfileData> {
  // Merge preset settings with any customizations
  const mergedSettings: UpdateSensoryProfileInput = {
    presetId,
    visual: mergeSettings(presetSettings.visual ?? {}, customizations?.visual),
    auditory: mergeSettings(presetSettings.auditory ?? {}, customizations?.auditory),
    motor: mergeSettings(presetSettings.motor ?? {}, customizations?.motor),
    cognitive: mergeSettings(presetSettings.cognitive ?? {}, customizations?.cognitive),
    environment: mergeSettings(presetSettings.environment ?? {}, customizations?.environment),
    triggers: presetSettings.triggers || customizations?.triggers
      ? mergeSettings(presetSettings.triggers ?? {}, customizations?.triggers)
      : undefined,
  };

  return upsertSensoryProfile(learnerId, mergedSettings);
}

// =============================================================================
// Effectiveness Tracking
// =============================================================================

export interface EffectivenessData {
  engagementScore: number;
  completionRate: number;
  averageSessionDuration: number;
  settingsSnapshot: Partial<SensoryProfileData>;
}

/**
 * Record an effectiveness check
 */
export async function recordEffectivenessCheck(
  learnerId: string,
  score: number
): Promise<SensoryProfileData | null> {
  const profile = await prisma.sensoryProfile.update({
    where: { learnerId },
    data: {
      lastEffectivenessCheck: new Date(),
      effectivenessScore: score,
    },
  });

  return toSensoryProfileData(profile);
}

/**
 * Get effectiveness history for a learner
 * This would typically query a separate analytics table
 */
export async function getEffectivenessHistory(
  learnerId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{ date: Date; score: number }[]> {
  // For now, return current score as single point
  // In production, this would query an analytics/history table
  const profile = await getSensoryProfile(learnerId);
  
  if (!profile || profile.effectivenessScore === null) {
    return [];
  }

  return [
    {
      date: profile.lastEffectivenessCheck ?? profile.updatedAt,
      score: profile.effectivenessScore,
    },
  ];
}

// =============================================================================
// Bulk Operations
// =============================================================================

/**
 * Get sensory profiles for multiple learners
 */
export async function getSensoryProfilesForLearners(
  learnerIds: string[]
): Promise<Map<string, SensoryProfileData>> {
  const profiles = await prisma.sensoryProfile.findMany({
    where: {
      learnerId: { in: learnerIds },
    },
  });

  const map = new Map<string, SensoryProfileData>();
  for (const profile of profiles) {
    map.set(profile.learnerId, toSensoryProfileData(profile));
  }

  return map;
}

/**
 * Get all active sensory profiles (for analytics/reporting)
 */
export async function getActiveSensoryProfiles(limit = 100, offset = 0): Promise<SensoryProfileData[]> {
  const profiles = await prisma.sensoryProfile.findMany({
    where: { isActive: true },
    take: limit,
    skip: offset,
    orderBy: { updatedAt: "desc" },
  });

  return profiles.map(toSensoryProfileData);
}

/**
 * Get profiles using a specific preset
 */
export async function getProfilesByPreset(presetId: string): Promise<SensoryProfileData[]> {
  const profiles = await prisma.sensoryProfile.findMany({
    where: { presetId },
    orderBy: { updatedAt: "desc" },
  });

  return profiles.map(toSensoryProfileData);
}

// =============================================================================
// Analytics
// =============================================================================

/**
 * Get aggregated statistics about sensory profile usage
 */
export async function getSensoryProfileStats(): Promise<{
  totalProfiles: number;
  activeProfiles: number;
  presetUsage: Record<string, number>;
  commonSettings: {
    visual: Partial<Record<keyof VisualSettings, number>>;
    auditory: Partial<Record<keyof AuditorySettings, number>>;
    motor: Partial<Record<keyof MotorSettings, number>>;
    cognitive: Partial<Record<keyof CognitiveSettings, number>>;
  };
}> {
  const [totalProfiles, activeProfiles, presetCounts] = await Promise.all([
    prisma.sensoryProfile.count(),
    prisma.sensoryProfile.count({ where: { isActive: true } }),
    prisma.sensoryProfile.groupBy({
      by: ["presetId"],
      _count: true,
    }),
  ]);

  const presetUsage: Record<string, number> = {};
  for (const preset of presetCounts) {
    if (preset.presetId) {
      presetUsage[preset.presetId] = preset._count;
    }
  }

  // For common settings analysis, we'd need to aggregate JSON field values
  // This is a simplified placeholder - in production, use raw SQL or aggregate in application
  return {
    totalProfiles,
    activeProfiles,
    presetUsage,
    commonSettings: {
      visual: {},
      auditory: {},
      motor: {},
      cognitive: {},
    },
  };
}
