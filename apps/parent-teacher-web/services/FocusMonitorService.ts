/**
 * Focus Monitor Service for Web
 * Privacy-first focus monitoring with local interaction tracking
 *
 * Ported from Flutter: mobile/learner_flutter/lib/services/focus_monitor_service.dart
 */

// ==================== Types ====================

export enum InteractionType {
  Tap = 'tap',
  CorrectAnswer = 'correctAnswer',
  IncorrectAnswer = 'incorrectAnswer',
  PageView = 'pageView',
  ScrollAction = 'scrollAction',
  FormInput = 'formInput',
  ButtonClick = 'buttonClick',
}

export enum FocusEventType {
  FocusRestored = 'focusRestored',
  IdleDetected = 'idleDetected',
  DistractionDetected = 'distractionDetected',
  BreakStarted = 'breakStarted',
  BreakCompleted = 'breakCompleted',
  GamePlayed = 'gamePlayed',
}

export interface FocusEvent {
  learnerId: string;
  eventType: FocusEventType;
  focusScore?: number;
  gameId?: string;
  durationSeconds?: number;
  timestamp: Date;
}

export interface FocusMetrics {
  learnerId: string;
  sessionId: string;
  averageFocusScore: number;
  breaksTaken: number;
  gamesPlayed: number;
  totalActiveSeconds: number;
  totalIdleSeconds: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface SensoryProfileCognitive {
  avoidPopups?: boolean;
  breakIntervalMinutes?: number;
}

export interface SensoryProfile {
  cognitive?: SensoryProfileCognitive;
}

interface InteractionRecord {
  type: InteractionType;
  timestamp: Date;
  data?: Record<string, unknown>;
}

type FocusChangeListener = (score: number, breakSuggested: boolean) => void;

// ==================== Focus Monitor Service ====================

export class FocusMonitorService {
  private readonly learnerId: string;
  private readonly sessionId: string;

  // Configuration
  private static readonly IDLE_THRESHOLD_SECONDS = 120; // 2 minutes
  private static readonly CONSECUTIVE_INCORRECT_THRESHOLD = 3;
  private static readonly BREAK_SUGGESTION_THRESHOLD = 40.0;
  private static readonly MIN_TIME_BETWEEN_SUGGESTIONS_SECONDS = 300; // 5 minutes

  // Internal state
  private interactions: InteractionRecord[] = [];
  private events: FocusEvent[] = [];
  private lastInteractionTime: Date | null = null;
  private lastBreakSuggestionTime: Date | null = null;
  private sessionStartTime: Date;
  private idleTimerId: ReturnType<typeof setInterval> | null = null;

  // Tracking counters
  private consecutiveIncorrect = 0;
  private _breaksTaken = 0;
  private _gamesPlayed = 0;
  private totalIdleSeconds = 0;

  // Current state
  private _currentFocusScore = 100.0;
  private _breakSuggested = false;
  private _isIdle = false;

  // Sensory profile integration
  private sensoryProfile: SensoryProfile | null = null;

  // Listeners
  private listeners: FocusChangeListener[] = [];

  constructor(learnerId: string, sessionId?: string) {
    this.learnerId = learnerId;
    this.sessionId = sessionId ?? crypto.randomUUID();
    this.sessionStartTime = new Date();
    this.lastInteractionTime = new Date();
    this.startIdleTimer();
  }

  // ==================== Public Getters ====================

  get focusScore(): number {
    return this._currentFocusScore;
  }

  get breakSuggested(): boolean {
    return this._breakSuggested;
  }

  get isIdle(): boolean {
    return this._isIdle;
  }

  get breaksTaken(): number {
    return this._breaksTaken;
  }

  get gamesPlayed(): number {
    return this._gamesPlayed;
  }

  get breakSuggestionsEnabled(): boolean {
    if (!this.sensoryProfile) return true;
    if (this.sensoryProfile.cognitive?.avoidPopups) return false;
    return true;
  }

  get breakIntervalMinutes(): number {
    return this.sensoryProfile?.cognitive?.breakIntervalMinutes ?? 20;
  }

  // ==================== Public Methods ====================

  /**
   * Add a listener for focus changes
   */
  addListener(listener: FocusChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * Remove a listener
   */
  removeListener(listener: FocusChangeListener): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of changes
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this._currentFocusScore, this._breakSuggested);
    }
  }

  /**
   * Set the sensory profile for accommodation-aware behavior
   */
  setSensoryProfile(profile: SensoryProfile | null): void {
    this.sensoryProfile = profile;
    this.notifyListeners();
  }

  /**
   * Log a user interaction
   */
  logInteraction(type: InteractionType, data?: Record<string, unknown>): void {
    const now = new Date();
    this.interactions.push({ type, timestamp: now, data });
    this.lastInteractionTime = now;

    // Reset idle state
    if (this._isIdle) {
      this._isIdle = false;
      this.logEvent(FocusEventType.FocusRestored);
    }

    // Track consecutive incorrect answers
    if (type === InteractionType.IncorrectAnswer) {
      this.consecutiveIncorrect++;
      if (this.consecutiveIncorrect >= FocusMonitorService.CONSECUTIVE_INCORRECT_THRESHOLD) {
        this.onFrustrationDetected();
      }
    } else if (type === InteractionType.CorrectAnswer) {
      this.consecutiveIncorrect = 0;
      this.boostFocusScore(5);
    }

    // Restart idle timer
    this.resetIdleTimer();

    // Recalculate focus score
    this.recalculateFocusScore();
    this.notifyListeners();
  }

  /**
   * Calculate current focus score (0-100)
   */
  calculateFocusScore(): number {
    return this._currentFocusScore;
  }

  /**
   * Check if a break should be suggested
   */
  shouldSuggestBreak(): boolean {
    if (!this.breakSuggestionsEnabled) return false;
    if (this._breakSuggested) return false;

    // Check minimum time between suggestions
    if (this.lastBreakSuggestionTime) {
      const elapsed = (new Date().getTime() - this.lastBreakSuggestionTime.getTime()) / 1000;
      if (elapsed < FocusMonitorService.MIN_TIME_BETWEEN_SUGGESTIONS_SECONDS) {
        return false;
      }
    }

    // Suggest break if focus score is low
    if (this._currentFocusScore < FocusMonitorService.BREAK_SUGGESTION_THRESHOLD) {
      return true;
    }

    // Suggest break based on time interval from sensory profile
    const elapsed = (new Date().getTime() - this.sessionStartTime.getTime()) / 60000;
    if (elapsed >= this.breakIntervalMinutes && this._breaksTaken === 0) {
      return true;
    }

    return false;
  }

  /**
   * Mark that a break has been suggested
   */
  markBreakSuggested(): void {
    this._breakSuggested = true;
    this.lastBreakSuggestionTime = new Date();
    this.logEvent(FocusEventType.DistractionDetected, this._currentFocusScore);
    this.notifyListeners();
  }

  /**
   * Called when user starts a break
   */
  startBreak(): void {
    this.logEvent(FocusEventType.BreakStarted, this._currentFocusScore);
    this.notifyListeners();
  }

  /**
   * Called when user completes a break
   */
  completeBreak(durationSeconds?: number, gameId?: string): void {
    this._breaksTaken++;
    this._breakSuggested = false;

    // Restore focus after break
    this._currentFocusScore = Math.min(100.0, this._currentFocusScore + 30);
    this.consecutiveIncorrect = 0;

    this.logEvent(FocusEventType.BreakCompleted, this._currentFocusScore, durationSeconds, gameId);

    this.notifyListeners();
  }

  /**
   * Called when user plays a game
   */
  logGamePlayed(gameId: string, durationSeconds: number): void {
    this._gamesPlayed++;
    this.logEvent(FocusEventType.GamePlayed, undefined, durationSeconds, gameId);
    this.notifyListeners();
  }

  /**
   * Dismiss break suggestion without taking a break
   */
  dismissBreakSuggestion(): void {
    this._breakSuggested = false;
    this.lastBreakSuggestionTime = new Date();
    this.notifyListeners();
  }

  /**
   * Get aggregated metrics for server sync (privacy-safe)
   */
  getAggregatedMetrics(): FocusMetrics {
    const now = new Date();
    const activeSeconds =
      this.interactions.length > 0
        ? (this.interactions[this.interactions.length - 1].timestamp.getTime() -
            this.sessionStartTime.getTime()) /
            1000 -
          this.totalIdleSeconds
        : 0;

    // Calculate average focus score from events
    const focusEvents = this.events.filter((e) => e.focusScore !== undefined);
    const avgScore =
      focusEvents.length > 0
        ? focusEvents.reduce((sum, e) => sum + (e.focusScore ?? 0), 0) / focusEvents.length
        : this._currentFocusScore;

    return {
      learnerId: this.learnerId,
      sessionId: this.sessionId,
      averageFocusScore: avgScore,
      breaksTaken: this._breaksTaken,
      gamesPlayed: this._gamesPlayed,
      totalActiveSeconds: Math.max(0, activeSeconds),
      totalIdleSeconds: this.totalIdleSeconds,
      periodStart: this.sessionStartTime,
      periodEnd: now,
    };
  }

  /**
   * Sync aggregated metrics to server
   */
  async syncMetrics(): Promise<void> {
    try {
      const metrics = this.getAggregatedMetrics();
      // API call would go here
      await fetch('/api/focus/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metrics),
      });
    } catch (e) {
      // Fail silently - metrics are not critical
      console.warn('Failed to sync focus metrics:', e);
    }
  }

  /**
   * Reset the monitor for a new session
   */
  reset(): void {
    this.interactions = [];
    this.events = [];
    this.sessionStartTime = new Date();
    this.lastInteractionTime = new Date();
    this.lastBreakSuggestionTime = null;
    this.consecutiveIncorrect = 0;
    this._breaksTaken = 0;
    this._gamesPlayed = 0;
    this.totalIdleSeconds = 0;
    this._currentFocusScore = 100.0;
    this._breakSuggested = false;
    this._isIdle = false;
    this.notifyListeners();
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    if (this.idleTimerId) {
      clearInterval(this.idleTimerId);
      this.idleTimerId = null;
    }
    this.listeners = [];
  }

  // ==================== Private Methods ====================

  private startIdleTimer(): void {
    if (this.idleTimerId) {
      clearInterval(this.idleTimerId);
    }
    this.idleTimerId = setInterval(() => this.checkIdle(), 10000);
  }

  private resetIdleTimer(): void {
    this.startIdleTimer();
  }

  private checkIdle(): void {
    if (!this.lastInteractionTime) return;

    const elapsed = (new Date().getTime() - this.lastInteractionTime.getTime()) / 1000;
    if (elapsed >= FocusMonitorService.IDLE_THRESHOLD_SECONDS && !this._isIdle) {
      this.onIdleDetected();
    }

    if (this._isIdle) {
      this.totalIdleSeconds += 10;
    }
  }

  private onIdleDetected(): void {
    this._isIdle = true;
    this._currentFocusScore = Math.max(0, this._currentFocusScore - 15);
    this.logEvent(FocusEventType.IdleDetected, this._currentFocusScore);
    this.notifyListeners();
  }

  private onFrustrationDetected(): void {
    this._currentFocusScore = Math.max(0, this._currentFocusScore - 20);
    this.logEvent(FocusEventType.DistractionDetected, this._currentFocusScore);
    this.notifyListeners();
  }

  private boostFocusScore(amount: number): void {
    this._currentFocusScore = Math.min(100, this._currentFocusScore + amount);
  }

  private recalculateFocusScore(): void {
    // Get recent interactions (last 2 minutes)
    const cutoff = new Date(Date.now() - 2 * 60 * 1000);
    const recentInteractions = this.interactions.filter((i) => i.timestamp > cutoff);

    if (recentInteractions.length === 0) {
      this._currentFocusScore = Math.max(0, this._currentFocusScore - 5);
      return;
    }

    // Calculate score based on interaction patterns
    let score = this._currentFocusScore;

    // Factor 1: Interaction frequency (more is better, up to a point)
    const interactionsPerMinute = recentInteractions.length / 2.0;
    if (interactionsPerMinute < 1) {
      score -= 5;
    } else if (interactionsPerMinute > 10) {
      // Too many interactions might indicate frustration
      score -= 10;
    } else {
      score += 2;
    }

    // Factor 2: Correct vs incorrect answers
    const correctCount = recentInteractions.filter(
      (i) => i.type === InteractionType.CorrectAnswer,
    ).length;
    const incorrectCount = recentInteractions.filter(
      (i) => i.type === InteractionType.IncorrectAnswer,
    ).length;

    if (incorrectCount > 0 && correctCount === 0) {
      score -= 10;
    } else if (correctCount > incorrectCount) {
      score += 5;
    }

    // Factor 3: Check for erratic patterns (rapid taps)
    const tapInteractions = recentInteractions.filter((i) => i.type === InteractionType.Tap);
    if (tapInteractions.length > 20) {
      // Too many taps in 2 minutes suggests frustration
      score -= 15;
    }

    this._currentFocusScore = Math.max(0, Math.min(100, score));
  }

  private logEvent(
    eventType: FocusEventType,
    focusScore?: number,
    durationSeconds?: number,
    gameId?: string,
  ): void {
    this.events.push({
      learnerId: this.learnerId,
      eventType,
      focusScore,
      gameId,
      durationSeconds,
      timestamp: new Date(),
    });
  }
}

// ==================== React Hook ====================

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * React hook for using FocusMonitorService
 */
export function useFocusMonitor(learnerId: string, sessionId?: string) {
  const serviceRef = useRef<FocusMonitorService | null>(null);
  const [focusScore, setFocusScore] = useState(100);
  const [breakSuggested, setBreakSuggested] = useState(false);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const service = new FocusMonitorService(learnerId, sessionId);
    serviceRef.current = service;

    const listener = (score: number, breakSuggested: boolean) => {
      setFocusScore(score);
      setBreakSuggested(breakSuggested);
      setIsIdle(service.isIdle);
    };

    service.addListener(listener);

    return () => {
      service.dispose();
    };
  }, [learnerId, sessionId]);

  const logInteraction = useCallback((type: InteractionType, data?: Record<string, unknown>) => {
    serviceRef.current?.logInteraction(type, data);
  }, []);

  const completeBreak = useCallback((durationSeconds?: number, gameId?: string) => {
    serviceRef.current?.completeBreak(durationSeconds, gameId);
  }, []);

  const dismissBreakSuggestion = useCallback(() => {
    serviceRef.current?.dismissBreakSuggestion();
  }, []);

  const getMetrics = useCallback(() => {
    return serviceRef.current?.getAggregatedMetrics();
  }, []);

  const reset = useCallback(() => {
    serviceRef.current?.reset();
  }, []);

  return {
    focusScore,
    breakSuggested,
    isIdle,
    logInteraction,
    completeBreak,
    dismissBreakSuggestion,
    getMetrics,
    reset,
    service: serviceRef.current,
  };
}

export default FocusMonitorService;
