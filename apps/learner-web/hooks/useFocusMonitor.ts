import { useCallback, useEffect, useRef, useState } from 'react';
import {
  InteractionType,
  InteractionRecord,
  FocusEvent,
  FocusEventType,
  FocusMetrics,
  FocusMonitorState,
  FocusMonitorActions,
  SensoryProfileSettings,
  FOCUS_MONITOR_CONFIG,
} from './focusMonitorTypes';

// ============================================================================
// Default Sensory Profile
// ============================================================================

const DEFAULT_SENSORY_PROFILE: SensoryProfileSettings = {
  breakIntervalMinutes: FOCUS_MONITOR_CONFIG.DEFAULT_BREAK_INTERVAL_MINUTES,
  avoidPopups: false,
  reduceMotion: false,
};

// ============================================================================
// Hook: useFocusMonitor
// ============================================================================

interface UseFocusMonitorOptions {
  /** Session ID for tracking */
  sessionId?: string;
  /** Initial sensory profile settings */
  sensoryProfile?: Partial<SensoryProfileSettings>;
  /** Whether to auto-start monitoring */
  autoStart?: boolean;
}

interface UseFocusMonitorReturn extends FocusMonitorState, FocusMonitorActions {}

/**
 * React hook for tracking learner focus and engagement.
 *
 * Privacy-first approach: all tracking stays local, only aggregated
 * metrics can be synced if needed.
 */
export function useFocusMonitor(options: UseFocusMonitorOptions = {}): UseFocusMonitorReturn {
  const {
    sessionId = `session-${Date.now()}`,
    sensoryProfile: initialSensoryProfile,
    autoStart = true,
  } = options;

  // ==================== State ====================

  const [focusScore, setFocusScore] = useState(100);
  const [breakSuggested, setBreakSuggested] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [breaksTaken, setBreaksTaken] = useState(0);
  const [gamesPlayed, setGamesPlayed] = useState(0);

  // ==================== Refs (mutable state that doesn't trigger re-renders) ====================

  const sensoryProfileRef = useRef<SensoryProfileSettings>({
    ...DEFAULT_SENSORY_PROFILE,
    ...initialSensoryProfile,
  });

  const interactionsRef = useRef<InteractionRecord[]>([]);
  const eventsRef = useRef<FocusEvent[]>([]);
  const lastInteractionTimeRef = useRef<number>(Date.now());
  const lastBreakSuggestionTimeRef = useRef<number | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const consecutiveIncorrectRef = useRef<number>(0);
  const totalIdleSecondsRef = useRef<number>(0);
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusScoreRef = useRef<number>(100); // Keep in sync with state

  // Keep focusScoreRef in sync with state
  useEffect(() => {
    focusScoreRef.current = focusScore;
  }, [focusScore]);

  // ==================== Helper Functions ====================

  const clamp = useCallback((value: number, min: number, max: number) => {
    return Math.max(min, Math.min(max, value));
  }, []);

  const logEvent = useCallback(
    (
      eventType: FocusEventType,
      extra?: { focusScore?: number; gameId?: string; durationSeconds?: number },
    ) => {
      eventsRef.current.push({
        eventType,
        timestamp: Date.now(),
        ...extra,
      });
    },
    [],
  );

  const boostFocusScore = useCallback(
    (amount: number) => {
      setFocusScore((prev) => clamp(prev + amount, 0, 100));
    },
    [clamp],
  );

  const reduceFocusScore = useCallback(
    (amount: number) => {
      setFocusScore((prev) => clamp(prev - amount, 0, 100));
    },
    [clamp],
  );

  // ==================== Focus Score Calculation ====================

  const recalculateFocusScore = useCallback(() => {
    const now = Date.now();
    const cutoff = now - 2 * 60 * 1000; // Last 2 minutes

    const recentInteractions = interactionsRef.current.filter((i) => i.timestamp > cutoff);

    if (recentInteractions.length === 0) {
      reduceFocusScore(5);
      return;
    }

    let scoreAdjustment = 0;

    // Factor 1: Interaction frequency
    const interactionsPerMinute = recentInteractions.length / 2;
    if (interactionsPerMinute < 1) {
      scoreAdjustment -= 5;
    } else if (interactionsPerMinute > 10) {
      // Too many interactions might indicate frustration
      scoreAdjustment -= 10;
    } else {
      scoreAdjustment += 2;
    }

    // Factor 2: Correct vs incorrect answers
    const correctCount = recentInteractions.filter((i) => i.type === 'correctAnswer').length;
    const incorrectCount = recentInteractions.filter((i) => i.type === 'incorrectAnswer').length;

    if (incorrectCount > 0 && correctCount === 0) {
      scoreAdjustment -= 10;
    } else if (correctCount > incorrectCount) {
      scoreAdjustment += 5;
    }

    // Factor 3: Check for erratic patterns (rapid taps)
    const tapInteractions = recentInteractions.filter((i) => i.type === 'tap');
    if (tapInteractions.length > 20) {
      scoreAdjustment -= 15;
    }

    setFocusScore((prev) => clamp(prev + scoreAdjustment, 0, 100));
  }, [clamp, reduceFocusScore]);

  // ==================== Break Suggestion Logic ====================

  const shouldSuggestBreak = useCallback((): boolean => {
    const profile = sensoryProfileRef.current;

    // Don't suggest if popups are disabled
    if (profile.avoidPopups) return false;

    // Don't suggest if already suggested
    if (breakSuggested) return false;

    // Check minimum time between suggestions
    if (lastBreakSuggestionTimeRef.current !== null) {
      const elapsed = Date.now() - lastBreakSuggestionTimeRef.current;
      if (elapsed < FOCUS_MONITOR_CONFIG.MIN_TIME_BETWEEN_SUGGESTIONS_SECONDS * 1000) {
        return false;
      }
    }

    // Suggest if focus score is low
    if (focusScoreRef.current < FOCUS_MONITOR_CONFIG.BREAK_SUGGESTION_THRESHOLD) {
      return true;
    }

    // Suggest based on time interval from sensory profile
    const elapsed = Date.now() - sessionStartTimeRef.current;
    const breakIntervalMs = profile.breakIntervalMinutes * 60 * 1000;
    if (elapsed >= breakIntervalMs && breaksTaken === 0) {
      return true;
    }

    return false;
  }, [breakSuggested, breaksTaken]);

  // ==================== Idle Detection ====================

  const onIdleDetected = useCallback(() => {
    setIsIdle(true);
    reduceFocusScore(FOCUS_MONITOR_CONFIG.IDLE_PENALTY);
    logEvent('idleDetected', { focusScore: focusScoreRef.current });
  }, [logEvent, reduceFocusScore]);

  const onFrustrationDetected = useCallback(() => {
    reduceFocusScore(FOCUS_MONITOR_CONFIG.FRUSTRATION_PENALTY);
    logEvent('distractionDetected', { focusScore: focusScoreRef.current });

    // Check if break should be suggested
    if (shouldSuggestBreak()) {
      setBreakSuggested(true);
      lastBreakSuggestionTimeRef.current = Date.now();
    }
  }, [logEvent, reduceFocusScore, shouldSuggestBreak]);

  const checkIdle = useCallback(() => {
    if (lastInteractionTimeRef.current === null) return;

    const elapsed = Date.now() - lastInteractionTimeRef.current;
    if (elapsed >= FOCUS_MONITOR_CONFIG.IDLE_THRESHOLD_SECONDS * 1000) {
      if (!isIdle) {
        onIdleDetected();
      }
    }

    if (isIdle) {
      totalIdleSecondsRef.current += FOCUS_MONITOR_CONFIG.IDLE_CHECK_INTERVAL_MS / 1000;
    }
  }, [isIdle, onIdleDetected]);

  // ==================== Public Actions ====================

  const logInteraction = useCallback(
    (type: InteractionType, data?: Record<string, unknown>) => {
      const now = Date.now();

      // Record the interaction
      interactionsRef.current.push({
        type,
        timestamp: now,
        data,
      });

      // Limit stored interactions to last 5 minutes
      const cutoff = now - 5 * 60 * 1000;
      interactionsRef.current = interactionsRef.current.filter((i) => i.timestamp > cutoff);

      lastInteractionTimeRef.current = now;

      // Reset idle state
      if (isIdle) {
        setIsIdle(false);
        logEvent('focusRestored');
      }

      // Track consecutive incorrect answers
      if (type === 'incorrectAnswer') {
        consecutiveIncorrectRef.current++;
        if (
          consecutiveIncorrectRef.current >= FOCUS_MONITOR_CONFIG.CONSECUTIVE_INCORRECT_THRESHOLD
        ) {
          onFrustrationDetected();
        }
      } else if (type === 'correctAnswer') {
        consecutiveIncorrectRef.current = 0;
        boostFocusScore(FOCUS_MONITOR_CONFIG.CORRECT_ANSWER_BOOST);
      }

      // Recalculate focus score
      recalculateFocusScore();

      // Check if break should be suggested
      if (shouldSuggestBreak()) {
        setBreakSuggested(true);
        lastBreakSuggestionTimeRef.current = Date.now();
      }
    },
    [
      isIdle,
      logEvent,
      onFrustrationDetected,
      boostFocusScore,
      recalculateFocusScore,
      shouldSuggestBreak,
    ],
  );

  const startBreak = useCallback(() => {
    logEvent('breakStarted', { focusScore: focusScoreRef.current });
  }, [logEvent]);

  const completeBreak = useCallback(
    (durationSeconds?: number, gameId?: string) => {
      setBreaksTaken((prev) => prev + 1);
      setBreakSuggested(false);

      // Restore focus after break
      boostFocusScore(FOCUS_MONITOR_CONFIG.BREAK_RESTORATION);
      consecutiveIncorrectRef.current = 0;

      logEvent('breakCompleted', {
        focusScore: focusScoreRef.current + FOCUS_MONITOR_CONFIG.BREAK_RESTORATION,
        durationSeconds,
        gameId,
      });
    },
    [boostFocusScore, logEvent],
  );

  const logGamePlayed = useCallback(
    (gameId: string, durationSeconds: number) => {
      setGamesPlayed((prev) => prev + 1);
      logEvent('gamePlayed', { gameId, durationSeconds });
    },
    [logEvent],
  );

  const dismissBreakSuggestion = useCallback(() => {
    setBreakSuggested(false);
    lastBreakSuggestionTimeRef.current = Date.now();
  }, []);

  const setSensoryProfile = useCallback((settings: Partial<SensoryProfileSettings>) => {
    sensoryProfileRef.current = {
      ...sensoryProfileRef.current,
      ...settings,
    };
  }, []);

  const reset = useCallback(() => {
    interactionsRef.current = [];
    eventsRef.current = [];
    sessionStartTimeRef.current = Date.now();
    lastInteractionTimeRef.current = Date.now();
    lastBreakSuggestionTimeRef.current = null;
    consecutiveIncorrectRef.current = 0;
    totalIdleSecondsRef.current = 0;

    setFocusScore(100);
    setBreakSuggested(false);
    setIsIdle(false);
    setBreaksTaken(0);
    setGamesPlayed(0);
  }, []);

  const getMetrics = useCallback((): FocusMetrics => {
    const now = Date.now();
    const interactions = interactionsRef.current;

    const activeSeconds =
      interactions.length > 0
        ? Math.floor(
            (interactions[interactions.length - 1].timestamp - sessionStartTimeRef.current) / 1000,
          ) - totalIdleSecondsRef.current
        : 0;

    // Calculate average focus score from events
    const focusEvents = eventsRef.current.filter((e) => e.focusScore !== undefined);
    const avgScore =
      focusEvents.length > 0
        ? focusEvents.reduce((sum, e) => sum + (e.focusScore ?? 0), 0) / focusEvents.length
        : focusScoreRef.current;

    return {
      sessionId,
      averageFocusScore: avgScore,
      breaksTaken,
      gamesPlayed,
      totalActiveSeconds: Math.max(0, activeSeconds),
      totalIdleSeconds: totalIdleSecondsRef.current,
      periodStart: sessionStartTimeRef.current,
      periodEnd: now,
    };
  }, [sessionId, breaksTaken, gamesPlayed]);

  // ==================== Effects ====================

  // Start idle timer
  useEffect(() => {
    if (!autoStart) return;

    idleTimerRef.current = setInterval(() => {
      checkIdle();
    }, FOCUS_MONITOR_CONFIG.IDLE_CHECK_INTERVAL_MS);

    return () => {
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [autoStart, checkIdle]);

  // ==================== Return ====================

  return {
    // State
    focusScore,
    breakSuggested,
    isIdle,
    breaksTaken,
    gamesPlayed,
    sessionStartTime: sessionStartTimeRef.current,
    breakSuggestionsEnabled: !sensoryProfileRef.current.avoidPopups,

    // Actions
    logInteraction,
    startBreak,
    completeBreak,
    logGamePlayed,
    dismissBreakSuggestion,
    setSensoryProfile,
    reset,
    getMetrics,
  };
}

export type { UseFocusMonitorOptions, UseFocusMonitorReturn };
