'use client';

import { useEffect, useState, useCallback } from 'react';
import { Timer } from 'lucide-react';

interface GameTimerProps {
  /** Total duration in seconds */
  duration: number;
  /** Whether the timer is currently running */
  isRunning: boolean;
  /** Callback when timer reaches zero */
  onComplete: () => void;
  /** Optional callback for each tick */
  onTick?: (remaining: number) => void;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as circular progress */
  circular?: boolean;
}

/**
 * GameTimer component for focus break mini-games
 * Displays countdown timer with visual feedback
 */
export function GameTimer({
  duration,
  isRunning,
  onComplete,
  onTick,
  size = 'md',
  circular = false,
}: GameTimerProps) {
  const [remaining, setRemaining] = useState(duration);

  // Reset when duration changes
  useEffect(() => {
    setRemaining(duration);
  }, [duration]);

  // Timer logic
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        onTick?.(next);

        if (next <= 0) {
          clearInterval(interval);
          onComplete();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, onComplete, onTick]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress percentage
  const progress = (remaining / duration) * 100;

  // Determine color based on time remaining
  const getColor = () => {
    if (remaining <= 5) return 'text-theme-error';
    if (remaining <= 10) return 'text-theme-warning';
    return 'text-theme-primary';
  };

  const getBgColor = () => {
    if (remaining <= 5) return 'bg-theme-error/10';
    if (remaining <= 10) return 'bg-theme-warning/10';
    return 'bg-theme-primary/10';
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-1.5',
    lg: 'text-lg px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (circular) {
    const radius = size === 'lg' ? 45 : size === 'md' ? 35 : 25;
    const strokeWidth = size === 'lg' ? 6 : size === 'md' ? 5 : 4;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
      <div className="relative inline-flex items-center justify-center">
        <svg
          className="transform -rotate-90"
          width={(radius + strokeWidth) * 2}
          height={(radius + strokeWidth) * 2}
        >
          {/* Background circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-theme-surface-border"
          />
          {/* Progress circle */}
          <circle
            cx={radius + strokeWidth}
            cy={radius + strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`transition-all duration-1000 ease-linear ${getColor()}`}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={`font-bold ${getColor()} ${size === 'lg' ? 'text-xl' : size === 'md' ? 'text-lg' : 'text-base'}`}
          >
            {formatTime(remaining)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-full font-medium
        transition-colors duration-300
        ${getBgColor()} ${getColor()} ${sizeClasses[size]}
      `}
      role="timer"
      aria-live="polite"
      aria-label={`${remaining} seconds remaining`}
    >
      <Timer className={`${iconSizes[size]} ${remaining <= 10 ? 'animate-pulse' : ''}`} />
      <span className="font-bold tabular-nums">{formatTime(remaining)}</span>
    </div>
  );
}

export default GameTimer;
