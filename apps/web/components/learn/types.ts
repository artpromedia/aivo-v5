export type LearningStyle = 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'MIXED';

export interface SensoryProfile {
  primaryColor: string;
  backgroundColor: string;
  contrast: number;
  fontSize: number;
  lineHeight: number;
  reduceMotion: boolean;
  soundEnabled: boolean;
  soundVolume: number;
}

export interface LearnerPreferences {
  learnerId: string;
  theme: string;
  showSchedule: boolean;
  focusReminders: boolean;
  sensory: SensoryProfile;
  supports: {
    visualSchedule: boolean;
    progressCelebrations: boolean;
    chunkedText: boolean;
  };
}

export interface ScheduleEntry {
  id: string;
  title: string;
  type: 'warmup' | 'lesson' | 'break' | 'reflection';
  start: string;
  durationMinutes: number;
  status: 'upcoming' | 'in-progress' | 'complete';
  icon: string;
}

export interface ProgressSnapshot {
  mastery: number;
  focusScore: number;
  streakDays: number;
  badges: string[];
}
