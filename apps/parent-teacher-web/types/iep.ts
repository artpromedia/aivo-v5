// ============================================================================
// IEP (Individualized Education Program) Types
// ============================================================================

/**
 * Category of an IEP goal
 */
export type IEPCategory =
  | 'academic'
  | 'behavioral'
  | 'social_emotional'
  | 'communication'
  | 'motor'
  | 'self_care'
  | 'transition';

/**
 * Status of an IEP goal
 */
export type IEPGoalStatus = 'on_track' | 'needs_review' | 'at_risk' | 'achieved' | 'not_started';

/**
 * Context in which a measurement was taken
 */
export type IEPMeasurementContext =
  | 'classroom'
  | 'therapy'
  | 'home'
  | 'community'
  | 'assessment'
  | 'other';

/**
 * A single data point for an IEP goal measurement
 */
export interface IEPDataPoint {
  id: string;
  goalId: string;
  value: number;
  measurementDate: string;
  context: IEPMeasurementContext;
  notes?: string;
  evidenceUrl?: string;
  recordedBy?: string;
  createdAt?: string;
}

/**
 * A note attached to an IEP goal
 */
export interface IEPNote {
  id: string;
  goalId: string;
  content: string;
  createdAt: string;
  createdBy: string;
  authorRole?: 'teacher' | 'parent' | 'therapist' | 'admin';
}

/**
 * Full IEP goal with all data
 */
export interface IEPGoal {
  id: string;
  learnerId: string;
  name: string;
  description: string;
  category: IEPCategory;
  status: IEPGoalStatus;
  subject?: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  startDate: string;
  targetDate: string;
  reviewDate?: string;
  dataPoints: IEPDataPoint[];
  notes: IEPNote[];
  createdAt?: string;
  updatedAt?: string;
}

// ============================================================================
// Category Display Configuration
// ============================================================================

export interface CategoryConfig {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

export const CATEGORY_CONFIG: Record<IEPCategory, CategoryConfig> = {
  academic: {
    label: 'Academic',
    emoji: '📚',
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    borderColor: 'border-violet-200',
  },
  behavioral: {
    label: 'Behavioral',
    emoji: '🎯',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
  },
  social_emotional: {
    label: 'Social-Emotional',
    emoji: '💚',
    color: 'text-pink-600',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-200',
  },
  communication: {
    label: 'Communication',
    emoji: '💬',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100',
    borderColor: 'border-cyan-200',
  },
  motor: {
    label: 'Motor Skills',
    emoji: '✋',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-200',
  },
  self_care: {
    label: 'Self-Care',
    emoji: '🧼',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-200',
  },
  transition: {
    label: 'Transition',
    emoji: '🚀',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
  },
};

// ============================================================================
// Status Display Configuration
// ============================================================================

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}

export const STATUS_CONFIG: Record<IEPGoalStatus, StatusConfig> = {
  on_track: {
    label: 'On Track',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-100',
    borderColor: 'border-emerald-300',
    icon: '✓',
  },
  needs_review: {
    label: 'Needs Review',
    color: 'text-amber-700',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-300',
    icon: '⚠️',
  },
  at_risk: {
    label: 'At Risk',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: '⚡',
  },
  achieved: {
    label: 'Achieved',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: '🎉',
  },
  not_started: {
    label: 'Not Started',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: '○',
  },
};

// ============================================================================
// Context Display Configuration
// ============================================================================

export interface ContextConfig {
  label: string;
  icon: string;
  color: string;
  bgColor: string;
}

export const CONTEXT_CONFIG: Record<IEPMeasurementContext, ContextConfig> = {
  classroom: {
    label: 'Classroom',
    icon: '🏫',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  home: {
    label: 'Home',
    icon: '🏠',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  therapy: {
    label: 'Therapy',
    icon: '🧠',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  community: {
    label: 'Community',
    icon: '👥',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
  },
  assessment: {
    label: 'Assessment',
    icon: '📋',
    color: 'text-rose-600',
    bgColor: 'bg-rose-100',
  },
  other: {
    label: 'Other',
    icon: '📍',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  },
};

export const ALL_CONTEXTS: IEPMeasurementContext[] = [
  'classroom',
  'home',
  'therapy',
  'community',
  'assessment',
  'other',
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate progress percentage for a goal
 */
export function calculateProgress(goal: IEPGoal): number {
  if (goal.targetValue === 0) return 0;
  const progress = (goal.currentValue / goal.targetValue) * 100;
  return Math.min(100, Math.max(0, progress));
}

/**
 * Check if a goal needs attention based on progress and timeline
 */
export function needsAttention(goal: IEPGoal): boolean {
  if (goal.status === 'achieved' || goal.status === 'not_started') return false;

  const progress = calculateProgress(goal);
  const now = new Date();
  const start = new Date(goal.startDate);
  const target = new Date(goal.targetDate);

  const totalDays = (target.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const daysPassed = (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
  const expectedProgress = (daysPassed / totalDays) * 100;

  // Goal needs attention if progress is significantly behind expected
  return progress < expectedProgress - 20;
}

/**
 * Get days until target date
 */
export function getDaysUntilTarget(goal: IEPGoal): number {
  const now = new Date();
  const target = new Date(goal.targetDate);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Get days until review date
 */
export function getDaysUntilReview(goal: IEPGoal): number | null {
  if (!goal.reviewDate) return null;
  const now = new Date();
  const review = new Date(goal.reviewDate);
  return Math.ceil((review.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format a relative date string
 */
export function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Format a date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Get the latest data point for a goal
 */
export function getLatestDataPoint(goal: IEPGoal): IEPDataPoint | null {
  if (goal.dataPoints.length === 0) return null;

  return goal.dataPoints.reduce((latest, current) => {
    return new Date(current.measurementDate) > new Date(latest.measurementDate) ? current : latest;
  });
}

// ============================================================================
// All categories and statuses for filtering
// ============================================================================

export const ALL_CATEGORIES: IEPCategory[] = [
  'academic',
  'behavioral',
  'social_emotional',
  'communication',
  'motor',
  'self_care',
  'transition',
];

export const ALL_STATUSES: IEPGoalStatus[] = [
  'on_track',
  'needs_review',
  'at_risk',
  'achieved',
  'not_started',
];
