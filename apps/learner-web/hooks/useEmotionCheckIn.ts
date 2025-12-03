import { useState, useCallback, useEffect } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Emotion options for check-in
 */
export type EmotionType =
  | 'happy'
  | 'calm'
  | 'excited'
  | 'tired'
  | 'anxious'
  | 'frustrated'
  | 'sad'
  | 'angry';

/**
 * Emotion option with display data
 */
export interface EmotionOption {
  type: EmotionType;
  emoji: string;
  label: string;
  color: string;
}

/**
 * Recorded emotion check-in
 */
export interface EmotionCheckIn {
  emotion: EmotionType;
  intensity: number; // 1-5
  timestamp: number;
  context?: string;
}

/**
 * Hook return type
 */
export interface UseEmotionCheckInReturn {
  /** Whether check-in should be shown */
  shouldShowCheckIn: boolean;
  /** Last recorded check-in */
  lastCheckIn: EmotionCheckIn | null;
  /** Show the check-in modal */
  showCheckIn: () => void;
  /** Log a new emotion check-in */
  logEmotionCheckIn: (emotion: EmotionType, intensity: number, context?: string) => void;
  /** Skip/dismiss the check-in prompt */
  skipCheckIn: () => void;
  /** Force check the conditions (useful after mount) */
  checkIfShouldShow: () => boolean;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_LAST_CHECKIN = 'aivo_last_emotion_checkin';
const STORAGE_KEY_CHECKIN_HISTORY = 'aivo_emotion_checkin_history';
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000;
const MAX_HISTORY_ITEMS = 50;

/**
 * Available emotion options with their display data
 */
export const EMOTION_OPTIONS: EmotionOption[] = [
  { type: 'happy', emoji: '😊', label: 'Happy', color: '#FCD34D' },
  { type: 'calm', emoji: '😌', label: 'Calm', color: '#5EEAD4' },
  { type: 'excited', emoji: '🤩', label: 'Excited', color: '#F472B6' },
  { type: 'tired', emoji: '😴', label: 'Tired', color: '#94A3B8' },
  { type: 'anxious', emoji: '😰', label: 'Anxious', color: '#A78BFA' },
  { type: 'frustrated', emoji: '😤', label: 'Frustrated', color: '#FB923C' },
  { type: 'sad', emoji: '😢', label: 'Sad', color: '#60A5FA' },
  { type: 'angry', emoji: '😠', label: 'Angry', color: '#F87171' },
];

// ============================================================================
// Storage Helpers
// ============================================================================

function getLastCheckInFromStorage(): EmotionCheckIn | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_CHECKIN);
    if (stored) {
      return JSON.parse(stored) as EmotionCheckIn;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveCheckInToStorage(checkIn: EmotionCheckIn): void {
  if (typeof window === 'undefined') return;

  try {
    // Save as last check-in
    localStorage.setItem(STORAGE_KEY_LAST_CHECKIN, JSON.stringify(checkIn));

    // Add to history (keep last N items)
    const historyStr = localStorage.getItem(STORAGE_KEY_CHECKIN_HISTORY);
    let history: EmotionCheckIn[] = [];

    if (historyStr) {
      try {
        history = JSON.parse(historyStr) as EmotionCheckIn[];
      } catch {
        history = [];
      }
    }

    history.unshift(checkIn);
    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    localStorage.setItem(STORAGE_KEY_CHECKIN_HISTORY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

function getCheckInHistoryFromStorage(): EmotionCheckIn[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY_CHECKIN_HISTORY);
    if (stored) {
      return JSON.parse(stored) as EmotionCheckIn[];
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

// ============================================================================
// Hook
// ============================================================================

interface UseEmotionCheckInOptions {
  /** Override the check interval (default: 4 hours) */
  checkIntervalMs?: number;
  /** Whether to respect sensory profile popup preferences */
  respectSensoryProfile?: boolean;
  /** Whether popups are disabled from sensory profile */
  avoidPopups?: boolean;
  /** Whether user is in an active session */
  isInSession?: boolean;
  /** Context string for logging */
  context?: string;
}

/**
 * Hook for managing emotion check-ins.
 * Tracks when to show prompts and records check-in data.
 */
export function useEmotionCheckIn(options: UseEmotionCheckInOptions = {}): UseEmotionCheckInReturn {
  const {
    checkIntervalMs = FOUR_HOURS_MS,
    avoidPopups = false,
    isInSession = false,
    context = 'home',
  } = options;

  const [shouldShowCheckIn, setShouldShowCheckIn] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<EmotionCheckIn | null>(null);

  // Check if we should show the check-in
  const checkIfShouldShow = useCallback((): boolean => {
    // Don't show if user prefers no popups
    if (avoidPopups) return false;

    // Don't show if user is in an active session
    if (isInSession) return false;

    const last = getLastCheckInFromStorage();
    setLastCheckIn(last);

    if (!last) {
      // Never checked in, should show
      return true;
    }

    const now = Date.now();
    const timeSinceLastCheckIn = now - last.timestamp;

    // Show if more than configured interval since last check-in
    return timeSinceLastCheckIn > checkIntervalMs;
  }, [avoidPopups, isInSession, checkIntervalMs]);

  // Initialize on mount
  useEffect(() => {
    const shouldShow = checkIfShouldShow();
    setShouldShowCheckIn(shouldShow);
  }, [checkIfShouldShow]);

  // Show the check-in modal
  const showCheckIn = useCallback(() => {
    setShouldShowCheckIn(true);
  }, []);

  // Log a new emotion check-in
  const logEmotionCheckIn = useCallback(
    (emotion: EmotionType, intensity: number, checkInContext?: string) => {
      const checkIn: EmotionCheckIn = {
        emotion,
        intensity: Math.max(1, Math.min(5, intensity)),
        timestamp: Date.now(),
        context: checkInContext ?? context,
      };

      saveCheckInToStorage(checkIn);
      setLastCheckIn(checkIn);
      setShouldShowCheckIn(false);

      // Prepare payload for potential API sync
      // This could be sent to backend if needed
      const payload = {
        emotion,
        intensity: checkIn.intensity,
        timestamp: new Date(checkIn.timestamp).toISOString(),
        context: checkIn.context,
      };

      // Log for debugging (in production, this would be an API call)
      console.log('[EmotionCheckIn] Recorded:', payload);
    },
    [context],
  );

  // Skip/dismiss the check-in
  const skipCheckIn = useCallback(() => {
    setShouldShowCheckIn(false);

    // Update last check-in timestamp to prevent immediate re-prompt
    // but don't record an actual emotion
    if (typeof window !== 'undefined') {
      try {
        const skipRecord = {
          emotion: 'skipped' as EmotionType,
          intensity: 0,
          timestamp: Date.now(),
          context: 'skipped',
        };
        localStorage.setItem(STORAGE_KEY_LAST_CHECKIN, JSON.stringify(skipRecord));
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  return {
    shouldShowCheckIn,
    lastCheckIn,
    showCheckIn,
    logEmotionCheckIn,
    skipCheckIn,
    checkIfShouldShow,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get the emotion option for a given type
 */
export function getEmotionOption(type: EmotionType): EmotionOption | undefined {
  return EMOTION_OPTIONS.find((e) => e.type === type);
}

/**
 * Get check-in history
 */
export function getEmotionCheckInHistory(): EmotionCheckIn[] {
  return getCheckInHistoryFromStorage();
}

/**
 * Clear all check-in data (for testing/reset)
 */
export function clearEmotionCheckInData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_LAST_CHECKIN);
    localStorage.removeItem(STORAGE_KEY_CHECKIN_HISTORY);
  } catch {
    // Ignore storage errors
  }
}
