import { useState, useCallback, useEffect, useRef } from 'react';

// ============================================================================
// Types
// ============================================================================

/**
 * Break reminder state
 */
export interface BreakReminderState {
  /** Whether the reminder should be shown */
  shouldShowReminder: boolean;
  /** Last break time (null if never taken) */
  lastBreakTime: Date | null;
  /** Whether the reminder is temporarily snoozed */
  isSnoozed: boolean;
  /** Time remaining on snooze (in seconds) */
  snoozeTimeRemaining: number;
}

/**
 * Break reminder actions
 */
export interface BreakReminderActions {
  /** Dismiss the reminder (snooze for a period) */
  dismissReminder: (snoozeMinutes?: number) => void;
  /** Record that a break was taken */
  takeBreak: () => void;
  /** Force check if reminder should show */
  checkReminder: () => boolean;
  /** Clear snooze and re-evaluate */
  clearSnooze: () => void;
}

/**
 * Hook return type
 */
export interface UseBreakReminderReturn extends BreakReminderState, BreakReminderActions {}

/**
 * Hook options
 */
export interface UseBreakReminderOptions {
  /** Break interval in minutes (default: 20) */
  breakIntervalMinutes?: number;
  /** Default snooze duration in minutes (default: 10) */
  defaultSnoozeDurationMinutes?: number;
  /** Whether to auto-check on interval */
  autoCheck?: boolean;
  /** Check interval in ms (default: 60000 = 1 minute) */
  checkIntervalMs?: number;
  /** Callback when break is taken */
  onBreakTaken?: () => void;
  /** Callback when reminder is dismissed */
  onReminderDismissed?: () => void;
}

// ============================================================================
// Constants
// ============================================================================

const STORAGE_KEY_LAST_BREAK = 'aivo_last_break_timestamp';
const STORAGE_KEY_SNOOZE_UNTIL = 'aivo_break_snooze_until';
const DEFAULT_BREAK_INTERVAL_MINUTES = 20;
const DEFAULT_SNOOZE_DURATION_MINUTES = 10;
const DEFAULT_CHECK_INTERVAL_MS = 60000; // 1 minute

// ============================================================================
// Storage Helpers
// ============================================================================

function getLastBreakFromStorage(): Date | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_LAST_BREAK);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function saveLastBreakToStorage(date: Date): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_LAST_BREAK, date.getTime().toString());
  } catch {
    // Ignore storage errors
  }
}

function getSnoozeUntilFromStorage(): Date | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY_SNOOZE_UNTIL);
    if (stored) {
      const timestamp = parseInt(stored, 10);
      if (!isNaN(timestamp)) {
        return new Date(timestamp);
      }
    }
  } catch {
    // Ignore storage errors
  }
  return null;
}

function saveSnoozeUntilToStorage(date: Date): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY_SNOOZE_UNTIL, date.getTime().toString());
  } catch {
    // Ignore storage errors
  }
}

function clearSnoozeFromStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
  } catch {
    // Ignore storage errors
  }
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook for managing break reminders.
 * Tracks when breaks are needed and handles snoozing.
 */
export function useBreakReminder(options: UseBreakReminderOptions = {}): UseBreakReminderReturn {
  const {
    breakIntervalMinutes = DEFAULT_BREAK_INTERVAL_MINUTES,
    defaultSnoozeDurationMinutes = DEFAULT_SNOOZE_DURATION_MINUTES,
    autoCheck = true,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
    onBreakTaken,
    onReminderDismissed,
  } = options;

  const [shouldShowReminder, setShouldShowReminder] = useState(false);
  const [lastBreakTime, setLastBreakTime] = useState<Date | null>(null);
  const [isSnoozed, setIsSnoozed] = useState(false);
  const [snoozeTimeRemaining, setSnoozeTimeRemaining] = useState(0);

  const snoozeUntilRef = useRef<Date | null>(null);
  const checkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const snoozeCountdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check if reminder should be shown
  const checkReminder = useCallback((): boolean => {
    const now = new Date();

    // Check if snoozed
    const snoozeUntil = snoozeUntilRef.current ?? getSnoozeUntilFromStorage();
    if (snoozeUntil && now < snoozeUntil) {
      setIsSnoozed(true);
      setSnoozeTimeRemaining(Math.ceil((snoozeUntil.getTime() - now.getTime()) / 1000));
      setShouldShowReminder(false);
      return false;
    } else {
      setIsSnoozed(false);
      setSnoozeTimeRemaining(0);
      snoozeUntilRef.current = null;
      clearSnoozeFromStorage();
    }

    // Check time since last break
    const lastBreak = getLastBreakFromStorage();
    setLastBreakTime(lastBreak);

    const breakIntervalMs = breakIntervalMinutes * 60 * 1000;

    if (!lastBreak) {
      // If never taken a break, check against session start
      // For now, show reminder after the interval from page load
      // In production, this would integrate with session start time
      setShouldShowReminder(true);
      return true;
    }

    const timeSinceLastBreak = now.getTime() - lastBreak.getTime();
    const shouldShow = timeSinceLastBreak >= breakIntervalMs;

    setShouldShowReminder(shouldShow);
    return shouldShow;
  }, [breakIntervalMinutes]);

  // Initialize on mount
  useEffect(() => {
    // Load initial state
    const lastBreak = getLastBreakFromStorage();
    setLastBreakTime(lastBreak);

    const snoozeUntil = getSnoozeUntilFromStorage();
    if (snoozeUntil) {
      snoozeUntilRef.current = snoozeUntil;
    }

    // Initial check (with small delay to avoid flash)
    const initialTimer = setTimeout(() => {
      checkReminder();
    }, 1000);

    return () => clearTimeout(initialTimer);
  }, [checkReminder]);

  // Set up auto-check interval
  useEffect(() => {
    if (!autoCheck) return;

    checkIntervalRef.current = setInterval(() => {
      checkReminder();
    }, checkIntervalMs);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [autoCheck, checkIntervalMs, checkReminder]);

  // Snooze countdown timer
  useEffect(() => {
    if (!isSnoozed || snoozeTimeRemaining <= 0) {
      if (snoozeCountdownRef.current) {
        clearInterval(snoozeCountdownRef.current);
        snoozeCountdownRef.current = null;
      }
      return;
    }

    snoozeCountdownRef.current = setInterval(() => {
      setSnoozeTimeRemaining((prev) => {
        if (prev <= 1) {
          // Snooze expired, check reminder
          setIsSnoozed(false);
          snoozeUntilRef.current = null;
          clearSnoozeFromStorage();
          checkReminder();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (snoozeCountdownRef.current) {
        clearInterval(snoozeCountdownRef.current);
      }
    };
  }, [isSnoozed, snoozeTimeRemaining, checkReminder]);

  // Dismiss reminder (snooze)
  const dismissReminder = useCallback(
    (snoozeMinutes?: number) => {
      const duration = snoozeMinutes ?? defaultSnoozeDurationMinutes;
      const snoozeUntil = new Date(Date.now() + duration * 60 * 1000);

      snoozeUntilRef.current = snoozeUntil;
      saveSnoozeUntilToStorage(snoozeUntil);

      setIsSnoozed(true);
      setSnoozeTimeRemaining(duration * 60);
      setShouldShowReminder(false);

      onReminderDismissed?.();

      console.log('[BreakReminder] Snoozed for', duration, 'minutes');
    },
    [defaultSnoozeDurationMinutes, onReminderDismissed],
  );

  // Take a break
  const takeBreak = useCallback(() => {
    const now = new Date();

    saveLastBreakToStorage(now);
    setLastBreakTime(now);
    setShouldShowReminder(false);
    setIsSnoozed(false);
    setSnoozeTimeRemaining(0);
    snoozeUntilRef.current = null;
    clearSnoozeFromStorage();

    onBreakTaken?.();

    console.log('[BreakReminder] Break taken at', now.toISOString());
  }, [onBreakTaken]);

  // Clear snooze manually
  const clearSnooze = useCallback(() => {
    snoozeUntilRef.current = null;
    clearSnoozeFromStorage();
    setIsSnoozed(false);
    setSnoozeTimeRemaining(0);
    checkReminder();
  }, [checkReminder]);

  return {
    // State
    shouldShowReminder,
    lastBreakTime,
    isSnoozed,
    snoozeTimeRemaining,

    // Actions
    dismissReminder,
    takeBreak,
    checkReminder,
    clearSnooze,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Format seconds as MM:SS
 */
export function formatSnoozeTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get time since last break in a friendly format
 */
export function getTimeSinceBreak(lastBreak: Date | null): string {
  if (!lastBreak) return 'a while';

  const now = Date.now();
  const diff = now - lastBreak.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;

  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour';
  return `${hours} hours`;
}

/**
 * Clear all break reminder data (for testing/reset)
 */
export function clearBreakReminderData(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(STORAGE_KEY_LAST_BREAK);
    localStorage.removeItem(STORAGE_KEY_SNOOZE_UNTIL);
  } catch {
    // Ignore storage errors
  }
}
