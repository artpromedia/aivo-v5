'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// Types
// ============================================================================

interface ProgressCardProps {
  /** Completion percentage (0-100) */
  percentage: number;
  /** Whether data is still loading */
  loading?: boolean;
  /** Custom message (defaults to "You're X% through this week!") */
  message?: string;
  /** Streak count (days in a row) */
  streakDays?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

function getProgressColor(percentage: number): {
  stroke: string;
  bg: string;
  text: string;
} {
  if (percentage >= 75) {
    return {
      stroke: 'stroke-green-500',
      bg: 'bg-green-500',
      text: 'text-green-600',
    };
  }
  if (percentage >= 50) {
    return {
      stroke: 'stroke-[var(--color-sunshine)]',
      bg: 'bg-[var(--color-sunshine)]',
      text: 'text-amber-600',
    };
  }
  return {
    stroke: 'stroke-orange-500',
    bg: 'bg-orange-500',
    text: 'text-orange-600',
  };
}

function getProgressMessage(percentage: number): string {
  if (percentage >= 90) return 'Amazing work this week! 🌟';
  if (percentage >= 75) return "You're doing great! Keep it up!";
  if (percentage >= 50) return "Nice progress! You're halfway there!";
  if (percentage >= 25) return "Good start! Let's keep going!";
  return "Let's get started on this week's goals!";
}

// ============================================================================
// Animated Counter Component
// ============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
}

function AnimatedCounter({ value, duration = 1000, className = '' }: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return <span className={className}>{displayValue}</span>;
}

// Hook version for cases where we need just the value
function useAnimatedValue(value: number, duration: number = 1000): number {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
}

// ============================================================================
// Circular Progress Ring Component
// ============================================================================

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  loading?: boolean;
}

function CircularProgress({
  percentage,
  size = 120,
  strokeWidth = 12,
  loading = false,
}: CircularProgressProps) {
  const animatedPercentage = useAnimatedValue(loading ? 0 : percentage, 1200);
  const colors = getProgressColor(percentage);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  if (loading) {
    return (
      <div
        className="rounded-full bg-gray-100 animate-pulse"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-gray-200"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className={colors.stroke}
          style={{
            strokeDasharray: circumference,
            strokeDashoffset,
            transition: 'stroke-dashoffset 0.5s ease-out',
          }}
        />
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-3xl font-bold ${colors.text}`}>{animatedPercentage}%</span>
        <span className="text-xs text-gray-500">complete</span>
      </div>
    </div>
  );
}

// ============================================================================
// Main Progress Card Component
// ============================================================================

export function ProgressCard({
  percentage,
  loading = false,
  message,
  streakDays = 0,
}: ProgressCardProps) {
  const displayMessage = message ?? getProgressMessage(percentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="bg-white rounded-3xl p-6 shadow-lg"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Your Progress</h2>
          <p className="text-sm text-gray-500">This week</p>
        </div>
        {streakDays > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 rounded-full">
            <span className="text-orange-500">🔥</span>
            <span className="text-sm font-semibold text-orange-600">{streakDays} day streak!</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Progress Ring */}
        <CircularProgress percentage={percentage} loading={loading} />

        {/* Stats */}
        <div className="flex-1 space-y-3">
          {loading ? (
            <>
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-1/2" />
              <div className="h-4 bg-gray-100 rounded animate-pulse w-2/3" />
            </>
          ) : (
            <>
              <ProgressRow label="Activities Done" value="4/6" color="var(--color-primary)" />
              <ProgressRow label="Focus Time" value="25 min" color="var(--color-mint)" />
              <ProgressRow label="Points Earned" value="+120" color="var(--color-sunshine)" />
            </>
          )}
        </div>
      </div>

      {/* Message */}
      <p className="mt-4 text-center text-sm text-gray-600 bg-gray-50 rounded-xl py-3 px-4">
        {loading ? 'Loading your progress...' : displayMessage}
      </p>
    </motion.div>
  );
}

// ============================================================================
// Progress Row Component
// ============================================================================

interface ProgressRowProps {
  label: string;
  value: string;
  color: string;
}

function ProgressRow({ label, value, color }: ProgressRowProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 text-sm text-gray-600">{label}</span>
      <span className="text-sm font-semibold text-gray-900">{value}</span>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { ProgressCardProps };
export { CircularProgress, useAnimatedValue as useAnimatedCounter, AnimatedCounter };
