/**
 * useSensoryProfile Hook
 * 
 * Manages sensory profile state and applies settings to the UI.
 * This hook fetches the user's sensory profile, applies CSS variables,
 * and provides methods to update settings.
 */

"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import type {
  SensoryProfile,
  SensoryPreset,
  VisualSettings,
  AuditorySettings,
  MotorSettings,
  CognitiveSettings,
  EnvironmentSettings,
  PresetId,
} from "@aivo/api-client/src/sensory-contracts";
import { sensoryProfileToCSSVariables } from "@aivo/api-client/src/sensory-contracts";

// =============================================================================
// Types
// =============================================================================

interface UseSensoryProfileOptions {
  /** Learner ID (defaults to current user if not provided) */
  learnerId?: string;
  /** Whether to auto-apply CSS variables */
  autoApplyCSS?: boolean;
  /** Whether to auto-apply motion settings */
  autoApplyMotion?: boolean;
  /** Callback when profile changes */
  onProfileChange?: (profile: SensoryProfile | null) => void;
}

interface UseSensoryProfileReturn {
  /** Current sensory profile (null if not loaded or doesn't exist) */
  profile: SensoryProfile | null;
  /** Available presets */
  presets: SensoryPreset[];
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Update visual settings */
  updateVisual: (settings: Partial<VisualSettings>) => Promise<void>;
  /** Update auditory settings */
  updateAuditory: (settings: Partial<AuditorySettings>) => Promise<void>;
  /** Update motor settings */
  updateMotor: (settings: Partial<MotorSettings>) => Promise<void>;
  /** Update cognitive settings */
  updateCognitive: (settings: Partial<CognitiveSettings>) => Promise<void>;
  /** Update environment settings */
  updateEnvironment: (settings: Partial<EnvironmentSettings>) => Promise<void>;
  /** Apply a preset */
  applyPreset: (presetId: PresetId) => Promise<void>;
  /** Refresh profile from server */
  refresh: () => Promise<void>;
  /** Computed CSS variables for current profile */
  cssVariables: Record<string, string>;
  /** Whether animations should be reduced */
  shouldReduceAnimations: boolean;
  /** Whether motion should be reduced */
  shouldReduceMotion: boolean;
  /** Framer Motion variants based on profile */
  motionVariants: {
    hidden: { opacity: number; y?: number; scale?: number };
    visible: { opacity: number; y?: number; scale?: number; transition: { duration: number } };
  };
}

// =============================================================================
// Constants
// =============================================================================

const API_BASE = "/api/sensory";

// =============================================================================
// Hook Implementation
// =============================================================================

export function useSensoryProfile(
  options: UseSensoryProfileOptions = {}
): UseSensoryProfileReturn {
  const {
    learnerId,
    autoApplyCSS = true,
    autoApplyMotion = true,
    onProfileChange,
  } = options;

  const [profile, setProfile] = useState<SensoryProfile | null>(null);
  const [presets, setPresets] = useState<SensoryPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch profile from API
  const fetchProfile = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const endpoint = learnerId
        ? `${API_BASE}/learner/${learnerId}`
        : `${API_BASE}/profile`;

      const response = await fetch(endpoint);
      
      if (!response.ok) {
        if (response.status === 404) {
          setProfile(null);
          return;
        }
        throw new Error(`Failed to fetch profile: ${response.statusText}`);
      }

      const data = await response.json();
      setProfile(data.profile);
      setPresets(data.presets || []);
      onProfileChange?.(data.profile);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [learnerId, onProfileChange]);

  // Update profile on server
  const updateProfile = useCallback(
    async (updates: Record<string, unknown>) => {
      try {
        const endpoint = learnerId
          ? `${API_BASE}/learner/${learnerId}`
          : `${API_BASE}/profile`;

        const response = await fetch(endpoint, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`Failed to update profile: ${response.statusText}`);
        }

        const data = await response.json();
        setProfile(data.profile);
        onProfileChange?.(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        throw err;
      }
    },
    [learnerId, onProfileChange]
  );

  // Category-specific update functions
  const updateVisual = useCallback(
    (settings: Partial<VisualSettings>) => updateProfile({ visual: settings }),
    [updateProfile]
  );

  const updateAuditory = useCallback(
    (settings: Partial<AuditorySettings>) => updateProfile({ auditory: settings }),
    [updateProfile]
  );

  const updateMotor = useCallback(
    (settings: Partial<MotorSettings>) => updateProfile({ motor: settings }),
    [updateProfile]
  );

  const updateCognitive = useCallback(
    (settings: Partial<CognitiveSettings>) => updateProfile({ cognitive: settings }),
    [updateProfile]
  );

  const updateEnvironment = useCallback(
    (settings: Partial<EnvironmentSettings>) => updateProfile({ environment: settings }),
    [updateProfile]
  );

  // Apply preset
  const applyPresetFn = useCallback(
    async (presetId: PresetId) => {
      try {
        const targetLearnerId = learnerId || profile?.learnerId;
        if (!targetLearnerId) {
          throw new Error("No learner ID available");
        }

        const response = await fetch(`${API_BASE}/apply-preset`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            learnerId: targetLearnerId,
            presetId,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to apply preset: ${response.statusText}`);
        }

        const data = await response.json();
        setProfile(data.profile);
        onProfileChange?.(data.profile);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"));
        throw err;
      }
    },
    [learnerId, profile?.learnerId, onProfileChange]
  );

  // Compute CSS variables from profile
  const cssVariables = useMemo(() => {
    if (!profile) return {};
    return sensoryProfileToCSSVariables(profile);
  }, [profile]);

  // Compute motion preferences
  const shouldReduceAnimations = profile?.visual?.reduceAnimations ?? false;
  const shouldReduceMotion = profile?.visual?.reduceMotion ?? false;

  // Compute Framer Motion variants
  const motionVariants = useMemo(() => {
    const duration = shouldReduceAnimations || shouldReduceMotion ? 0 : 0.3;
    const useTransforms = !shouldReduceMotion;

    return {
      hidden: {
        opacity: 0,
        ...(useTransforms && { y: 10, scale: 0.98 }),
      },
      visible: {
        opacity: 1,
        ...(useTransforms && { y: 0, scale: 1 }),
        transition: { duration },
      },
    };
  }, [shouldReduceAnimations, shouldReduceMotion]);

  // Apply CSS variables to document
  useEffect(() => {
    if (!autoApplyCSS || !profile) return;

    const root = document.documentElement;
    
    Object.entries(cssVariables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });

    // Apply color scheme
    if (profile.visual?.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply reduced motion class
    if (shouldReduceMotion) {
      root.classList.add("reduce-motion");
    } else {
      root.classList.remove("reduce-motion");
    }

    return () => {
      // Cleanup on unmount
      Object.keys(cssVariables).forEach((key) => {
        root.style.removeProperty(key);
      });
    };
  }, [autoApplyCSS, profile, cssVariables, shouldReduceMotion]);

  // Apply motion preferences to system
  useEffect(() => {
    if (!autoApplyMotion || !profile) return;

    // Set prefers-reduced-motion media query simulation
    // This helps with third-party animations
    const styleId = "sensory-motion-override";
    let style = document.getElementById(styleId) as HTMLStyleElement | null;

    if (shouldReduceMotion) {
      if (!style) {
        style = document.createElement("style");
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.001ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.001ms !important;
        }
      `;
    } else if (style) {
      style.remove();
    }

    return () => {
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();
    };
  }, [autoApplyMotion, profile, shouldReduceMotion]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    presets,
    isLoading,
    error,
    updateVisual,
    updateAuditory,
    updateMotor,
    updateCognitive,
    updateEnvironment,
    applyPreset: applyPresetFn,
    refresh: fetchProfile,
    cssVariables,
    shouldReduceAnimations,
    shouldReduceMotion,
    motionVariants,
  };
}

// =============================================================================
// Helper Hooks
// =============================================================================

/**
 * Hook for just checking if animations should be reduced
 * Useful for components that only need this one value
 */
export function useShouldReduceAnimations(learnerId?: string): boolean {
  const { shouldReduceAnimations } = useSensoryProfile({ learnerId, autoApplyCSS: false });
  return shouldReduceAnimations;
}

/**
 * Hook for getting motion variants for Framer Motion
 */
export function useSensoryMotionVariants(learnerId?: string) {
  const { motionVariants, shouldReduceMotion } = useSensoryProfile({
    learnerId,
    autoApplyCSS: false,
  });
  
  return { motionVariants, shouldReduceMotion };
}

export default useSensoryProfile;
