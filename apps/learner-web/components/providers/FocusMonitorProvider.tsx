'use client';

import { createContext, useContext, useCallback, useEffect, type ReactNode } from 'react';
import { useFocusMonitor } from '../../hooks/useFocusMonitor';
import type {
  SensoryProfileSettings,
  FocusMonitorContextValue,
} from '../../hooks/focusMonitorTypes';

// ============================================================================
// Context
// ============================================================================

const FocusMonitorContext = createContext<FocusMonitorContextValue | null>(null);

// ============================================================================
// Provider Props
// ============================================================================

interface FocusMonitorProviderProps {
  children: ReactNode;
  /** Session ID for tracking */
  sessionId?: string;
  /** Initial sensory profile settings */
  sensoryProfile?: Partial<SensoryProfileSettings>;
  /** Whether to track global interactions (clicks, scrolls) */
  trackGlobalInteractions?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * Context provider for focus monitoring.
 * Wraps the app to provide focus state and actions to all components.
 */
export function FocusMonitorProvider({
  children,
  sessionId,
  sensoryProfile,
  trackGlobalInteractions = true,
}: FocusMonitorProviderProps) {
  const focusMonitor = useFocusMonitor({
    sessionId,
    sensoryProfile,
    autoStart: true,
  });

  const { logInteraction } = focusMonitor;

  // ==================== Global Interaction Tracking ====================

  // Track clicks/taps
  const handleClick = useCallback(() => {
    logInteraction('tap');
  }, [logInteraction]);

  // Track scroll activity (debounced)
  const handleScroll = useCallback(() => {
    // Use a simple debounce by checking if we recently logged a scroll
    logInteraction('scroll');
  }, [logInteraction]);

  // Set up global event listeners
  useEffect(() => {
    if (!trackGlobalInteractions) return;

    // Debounce scroll events
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;
    const debouncedScroll = () => {
      if (scrollTimeout) return;
      scrollTimeout = setTimeout(() => {
        handleScroll();
        scrollTimeout = null;
      }, 1000); // Log scroll at most once per second
    };

    // Only track meaningful clicks (not on the FAB or navigation)
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // Skip if clicking on navigation or FAB elements
      if (
        target.closest('[data-focus-ignore]') ||
        target.closest('nav') ||
        target.closest("[role='navigation']")
      ) {
        return;
      }

      handleClick();
    };

    window.addEventListener('click', handleGlobalClick, { passive: true });
    window.addEventListener('scroll', debouncedScroll, { passive: true });

    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('scroll', debouncedScroll);
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
    };
  }, [trackGlobalInteractions, handleClick, handleScroll]);

  // ==================== Render ====================

  return (
    <FocusMonitorContext.Provider value={focusMonitor}>{children}</FocusMonitorContext.Provider>
  );
}

// ============================================================================
// Consumer Hook
// ============================================================================

/**
 * Hook to access focus monitor context.
 * Must be used within a FocusMonitorProvider.
 */
export function useFocusMonitorContext(): FocusMonitorContextValue {
  const context = useContext(FocusMonitorContext);

  if (context === null) {
    throw new Error('useFocusMonitorContext must be used within a FocusMonitorProvider');
  }

  return context;
}

/**
 * Hook to access focus monitor context, or null if not in provider.
 * Use this when the component may or may not be wrapped in a provider.
 */
export function useFocusMonitorContextOptional(): FocusMonitorContextValue | null {
  return useContext(FocusMonitorContext);
}

// ============================================================================
// Helper Hooks for Common Use Cases
// ============================================================================

/**
 * Hook for logging activity interactions (for session/homework pages).
 * Returns a simplified API for common interaction logging.
 */
export function useActivityInteractions() {
  const context = useFocusMonitorContextOptional();

  const logCorrectAnswer = useCallback(() => {
    context?.logInteraction('correctAnswer');
  }, [context]);

  const logIncorrectAnswer = useCallback(() => {
    context?.logInteraction('incorrectAnswer');
  }, [context]);

  const logActivityStarted = useCallback(
    (activityId?: string) => {
      context?.logInteraction('activityStarted', { activityId });
    },
    [context],
  );

  const logActivityCompleted = useCallback(
    (activityId?: string) => {
      context?.logInteraction('activityCompleted', { activityId });
    },
    [context],
  );

  const logStepCompleted = useCallback(
    (stepNumber?: number) => {
      context?.logInteraction('stepCompleted', { stepNumber });
    },
    [context],
  );

  const logHintUsed = useCallback(() => {
    context?.logInteraction('hintUsed');
  }, [context]);

  return {
    logCorrectAnswer,
    logIncorrectAnswer,
    logActivityStarted,
    logActivityCompleted,
    logStepCompleted,
    logHintUsed,
    // Also expose raw log for custom interactions
    logInteraction: context?.logInteraction ?? (() => {}),
  };
}

/**
 * Hook for break-related functionality.
 * Use this in components that handle breaks (like CalmCornerFab).
 */
export function useBreakHandler() {
  const context = useFocusMonitorContextOptional();

  return {
    breakSuggested: context?.breakSuggested ?? false,
    focusScore: context?.focusScore ?? 100,
    isIdle: context?.isIdle ?? false,
    startBreak: context?.startBreak ?? (() => {}),
    completeBreak: context?.completeBreak ?? (() => {}),
    dismissBreakSuggestion: context?.dismissBreakSuggestion ?? (() => {}),
    logGamePlayed: context?.logGamePlayed ?? (() => {}),
  };
}

// ============================================================================
// Exports
// ============================================================================

export type { FocusMonitorProviderProps };
export { FocusMonitorContext };
