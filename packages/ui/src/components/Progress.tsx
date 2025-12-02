'use client';

import { forwardRef, HTMLAttributes, useEffect, useRef } from 'react';
import { cn } from '../utils';

export type ProgressSize = 'sm' | 'md' | 'lg';
export type ProgressIntent = 'default' | 'primary' | 'success' | 'warning' | 'error';

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether progress is indeterminate (loading) */
  isIndeterminate?: boolean;
  /** Size variant - adapts to grade theme */
  size?: ProgressSize;
  /** Color intent */
  intent?: ProgressIntent;
  /** Show percentage label */
  showLabel?: boolean;
  /** Custom label format */
  formatLabel?: (value: number, max: number) => string;
  /** Accessible label */
  'aria-label'?: string;
  /** Announce completion to screen readers */
  announceCompletion?: boolean;
  /** Custom completion message */
  completionMessage?: string;
  /** Show animated stripes */
  isStriped?: boolean;
  /** Animate the stripes */
  isAnimated?: boolean;
}

/**
 * Accessible Progress indicator with grade-themed styling.
 * 
 * Features:
 * - role="progressbar" with aria-valuenow, aria-valuemin, aria-valuemax
 * - Both determinate and indeterminate states
 * - Size variants appropriate to grade
 * - Color that communicates progress stage
 * - Screen reader announcements for completion
 * 
 * @example
 * ```tsx
 * // Determinate progress
 * <Progress value={75} aria-label="Loading content" />
 * 
 * // Indeterminate loading
 * <Progress isIndeterminate aria-label="Loading..." />
 * 
 * // With label
 * <Progress value={45} showLabel aria-label="Download progress" />
 * 
 * // Success state
 * <Progress value={100} intent="success" announceCompletion />
 * ```
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      isIndeterminate = false,
      size = 'md',
      intent = 'primary',
      showLabel = false,
      formatLabel,
      'aria-label': ariaLabel,
      announceCompletion = false,
      completionMessage = 'Complete',
      isStriped = false,
      isAnimated = false,
      className,
      ...props
    },
    ref
  ) => {
    // Clamp value between 0 and max
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = (clampedValue / max) * 100;
    const isComplete = percentage >= 100;
    
    // Ref for completion announcement
    const announcerRef = useRef<HTMLDivElement>(null);
    const hasAnnouncedRef = useRef(false);

    // Announce completion
    useEffect(() => {
      if (announceCompletion && isComplete && !hasAnnouncedRef.current) {
        hasAnnouncedRef.current = true;
        // Announcement is handled by aria-live region
      }
      
      // Reset when going back from complete
      if (!isComplete) {
        hasAnnouncedRef.current = false;
      }
    }, [isComplete, announceCompletion]);

    // Format label
    const label = formatLabel
      ? formatLabel(clampedValue, max)
      : `${Math.round(percentage)}%`;

    // Determine effective intent based on progress
    const effectiveIntent: ProgressIntent = isComplete && intent === 'primary' 
      ? 'success' 
      : intent;

    return (
      <div
        ref={ref}
        className={cn('w-full', className)}
        {...props}
      >
        {/* Progress bar container */}
        <div
          role="progressbar"
          aria-valuenow={isIndeterminate ? undefined : clampedValue}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={ariaLabel}
          aria-busy={isIndeterminate || (!isComplete && value > 0)}
          className={cn(
            'relative w-full overflow-hidden',
            'bg-[rgb(var(--color-background-sunken,248_250_252))]',
            'rounded-full',
            
            // Size variants
            {
              'h-1.5': size === 'sm',
              'h-2.5': size === 'md',
              'h-4': size === 'lg',
            }
          )}
        >
          {/* Progress fill */}
          <div
            className={cn(
              'h-full rounded-full',
              'transition-all duration-[var(--transition-slow,300ms)]',
              'motion-reduce:transition-none',
              
              // Intent colors
              {
                'bg-[rgb(var(--color-primary,124_58_237))]': effectiveIntent === 'default' || effectiveIntent === 'primary',
                'bg-[rgb(var(--color-success,110_231_183))]': effectiveIntent === 'success',
                'bg-[rgb(var(--color-warning,252_211_77))]': effectiveIntent === 'warning',
                'bg-[rgb(var(--color-error,239_68_68))]': effectiveIntent === 'error',
              },
              
              // Indeterminate animation
              isIndeterminate && 'animate-progress-indeterminate',
              
              // Striped pattern
              isStriped && [
                'bg-gradient-to-r',
                'from-transparent via-white/20 to-transparent',
                'bg-[length:1rem_100%]',
              ],
              
              // Animated stripes
              isStriped && isAnimated && 'animate-progress-stripes'
            )}
            style={{
              width: isIndeterminate ? '30%' : `${percentage}%`,
            }}
          />
        </div>

        {/* Label */}
        {showLabel && !isIndeterminate && (
          <div
            className={cn(
              'mt-1 text-right',
              'text-[rgb(var(--color-text-muted,148_163_184))]',
              {
                'text-xs': size === 'sm',
                'text-sm': size === 'md',
                'text-base': size === 'lg',
              }
            )}
            aria-hidden="true"
          >
            {label}
          </div>
        )}

        {/* Completion announcer for screen readers */}
        {announceCompletion && (
          <div
            ref={announcerRef}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {isComplete ? completionMessage : null}
          </div>
        )}
      </div>
    );
  }
);

Progress.displayName = 'Progress';

/**
 * Circular Progress variant
 */
export interface CircularProgressProps extends Omit<ProgressProps, 'isStriped' | 'isAnimated'> {
  /** Stroke width */
  strokeWidth?: number;
  /** Size in pixels */
  sizePx?: number;
}

export const CircularProgress = forwardRef<HTMLDivElement, CircularProgressProps>(
  (
    {
      value = 0,
      max = 100,
      isIndeterminate = false,
      size = 'md',
      intent = 'primary',
      showLabel = false,
      formatLabel,
      'aria-label': ariaLabel,
      strokeWidth: customStrokeWidth,
      sizePx: customSize,
      className,
      ...props
    },
    ref
  ) => {
    // Size mappings
    const sizeMap = {
      sm: { size: 32, stroke: 3 },
      md: { size: 48, stroke: 4 },
      lg: { size: 64, stroke: 5 },
    };
    
    const dimensions = sizeMap[size];
    const circleSizePx = customSize || dimensions.size;
    const strokeWidth = customStrokeWidth || dimensions.stroke;
    
    // Calculate circle properties
    const radius = (circleSizePx - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    
    // Clamp value
    const clampedValue = Math.min(Math.max(value, 0), max);
    const percentage = (clampedValue / max) * 100;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;
    
    // Determine effective intent
    const isComplete = percentage >= 100;
    const effectiveIntent: ProgressIntent = isComplete && intent === 'primary' 
      ? 'success' 
      : intent;

    // Format label
    const label = formatLabel
      ? formatLabel(clampedValue, max)
      : `${Math.round(percentage)}%`;

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={ariaLabel}
        className={cn('relative inline-flex items-center justify-center', className)}
        style={{ width: circleSizePx, height: circleSizePx }}
        {...props}
      >
        <svg
          className={cn(
            '-rotate-90',
            isIndeterminate && 'animate-spin'
          )}
          width={circleSizePx}
          height={circleSizePx}
        >
          {/* Background circle */}
          <circle
            cx={circleSizePx / 2}
            cy={circleSizePx / 2}
            r={radius}
            fill="none"
            stroke="rgb(var(--color-background-sunken, 248 250 252))"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle */}
          <circle
            cx={circleSizePx / 2}
            cy={circleSizePx / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={isIndeterminate ? circumference * 0.75 : strokeDashoffset}
            className={cn(
              'transition-all duration-[var(--transition-slow,300ms)]',
              'motion-reduce:transition-none',
              {
                'stroke-[rgb(var(--color-primary,124_58_237))]': effectiveIntent === 'default' || effectiveIntent === 'primary',
                'stroke-[rgb(var(--color-success,110_231_183))]': effectiveIntent === 'success',
                'stroke-[rgb(var(--color-warning,252_211_77))]': effectiveIntent === 'warning',
                'stroke-[rgb(var(--color-error,239_68_68))]': effectiveIntent === 'error',
              }
            )}
          />
        </svg>
        
        {/* Center label */}
        {showLabel && !isIndeterminate && (
          <span
            className={cn(
              'absolute inset-0 flex items-center justify-center',
              'text-[rgb(var(--color-text,15_23_42))]',
              'font-medium',
              {
                'text-[10px]': size === 'sm',
                'text-xs': size === 'md',
                'text-sm': size === 'lg',
              }
            )}
            aria-hidden="true"
          >
            {label}
          </span>
        )}
      </div>
    );
  }
);

CircularProgress.displayName = 'CircularProgress';

export default Progress;
