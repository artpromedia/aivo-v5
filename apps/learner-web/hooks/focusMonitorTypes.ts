// ============================================================================
// Focus Monitor Types
// ============================================================================

/**
 * Types of user interactions that can be tracked
 */
export type InteractionType =
  | 'tap'
  | 'scroll'
  | 'correctAnswer'
  | 'incorrectAnswer'
  | 'activityStarted'
  | 'activityCompleted'
  | 'hintUsed'
  | 'stepCompleted'
  | 'timerPaused'
  | 'timerResumed';

/**
 * Focus event types for logging
 */
export type FocusEventType =
  | 'idleDetected'
  | 'focusRestored'
  | 'distractionDetected'
  | 'breakStarted'
  | 'breakCompleted'
  | 'gamePlayed';

/**
 * Record of a single user interaction
 */
export interface InteractionRecord {
  type: InteractionType;
  timestamp: number; // Unix timestamp in ms
  data?: Record<string, unknown>;
}

/**
 * Focus event for logging/analytics
 */
export interface FocusEvent {
  eventType: FocusEventType;
  timestamp: number;
  focusScore?: number;
  gameId?: string;
  durationSeconds?: number;
}

/**
 * Aggregated metrics for privacy-safe sync
 */
export interface FocusMetrics {
  sessionId: string;
  averageFocusScore: number;
  breaksTaken: number;
  gamesPlayed: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  periodStart: number;
  periodEnd: number;
}

/**
 * Sensory profile settings that affect focus monitoring
 */
export interface SensoryProfileSettings {
  /** Break interval in minutes (default 20) */
  breakIntervalMinutes: number;
  /** Whether to avoid popups/interruptions */
  avoidPopups: boolean;
  /** Whether to reduce animations */
  reduceMotion: boolean;
}

/**
 * Focus monitor state
 */
export interface FocusMonitorState {
  /** Current focus score (0-100) */
  focusScore: number;
  /** Whether a break is currently suggested */
  breakSuggested: boolean;
  /** Whether the user is currently idle */
  isIdle: boolean;
  /** Number of breaks taken this session */
  breaksTaken: number;
  /** Number of games played this session */
  gamesPlayed: number;
  /** Session start time */
  sessionStartTime: number;
  /** Whether break suggestions are enabled */
  breakSuggestionsEnabled: boolean;
}

/**
 * Focus monitor actions
 */
export interface FocusMonitorActions {
  /** Log a user interaction */
  logInteraction: (type: InteractionType, data?: Record<string, unknown>) => void;
  /** Start a break */
  startBreak: () => void;
  /** Complete a break */
  completeBreak: (durationSeconds?: number, gameId?: string) => void;
  /** Log a game played */
  logGamePlayed: (gameId: string, durationSeconds: number) => void;
  /** Dismiss break suggestion without taking break */
  dismissBreakSuggestion: () => void;
  /** Update sensory profile settings */
  setSensoryProfile: (settings: Partial<SensoryProfileSettings>) => void;
  /** Reset the monitor for a new session */
  reset: () => void;
  /** Get aggregated metrics for sync */
  getMetrics: () => FocusMetrics;
}

/**
 * Complete focus monitor context value
 */
export interface FocusMonitorContextValue extends FocusMonitorState, FocusMonitorActions {}

/**
 * Configuration constants for the focus monitor
 */
export const FOCUS_MONITOR_CONFIG = {
  /** Seconds of inactivity before user is considered idle */
  IDLE_THRESHOLD_SECONDS: 120,
  /** Number of consecutive incorrect answers that indicates frustration */
  CONSECUTIVE_INCORRECT_THRESHOLD: 3,
  /** Focus score threshold below which a break is suggested */
  BREAK_SUGGESTION_THRESHOLD: 40,
  /** Minimum seconds between break suggestions */
  MIN_TIME_BETWEEN_SUGGESTIONS_SECONDS: 300,
  /** Default break interval in minutes */
  DEFAULT_BREAK_INTERVAL_MINUTES: 20,
  /** How often to check for idle state (ms) */
  IDLE_CHECK_INTERVAL_MS: 10000,
  /** Focus score boost for correct answer */
  CORRECT_ANSWER_BOOST: 5,
  /** Focus score penalty for idle detection */
  IDLE_PENALTY: 15,
  /** Focus score penalty for frustration detection */
  FRUSTRATION_PENALTY: 20,
  /** Focus score restoration after break */
  BREAK_RESTORATION: 30,
} as const;
