import { forwardRef, HTMLAttributes, KeyboardEvent, MouseEvent } from 'react';
import { cn } from '../utils';

export type BadgeIntent = 
  | 'default' 
  | 'primary' 
  | 'secondary' 
  | 'success' 
  | 'warning' 
  | 'error' 
  | 'info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Visual intent/color scheme */
  intent?: BadgeIntent;
  /** Size variant */
  size?: BadgeSize;
  /** Icon to display before text */
  icon?: React.ReactNode;
  /** Make the badge removable */
  isRemovable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
  /** Accessible label for remove button */
  removeLabel?: string;
  /** Whether this is a pill-shaped badge */
  isPill?: boolean;
  /** Whether this badge represents a status (uses dot indicator) */
  hasStatusDot?: boolean;
}

/**
 * Accessible Badge/Tag component with grade-themed styling.
 * 
 * Features:
 * - Sufficient color contrast for text inside (WCAG AA)
 * - Not relying on color alone (uses icons or text patterns)
 * - Appropriate styling for all grade themes
 * - Removable variant with accessible close button
 * - Status dot indicator option
 * 
 * @example
 * ```tsx
 * <Badge intent="success" icon={<CheckIcon />}>Completed</Badge>
 * 
 * <Badge intent="warning" hasStatusDot>Pending</Badge>
 * 
 * <Badge 
 *   intent="info" 
 *   isRemovable 
 *   onRemove={() => handleRemove()}
 *   removeLabel="Remove tag"
 * >
 *   React
 * </Badge>
 * ```
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      intent = 'default',
      size = 'md',
      icon,
      isRemovable = false,
      onRemove,
      removeLabel = 'Remove',
      isPill = false,
      hasStatusDot = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // Handle remove button click
    const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onRemove?.();
    };

    // Handle remove button keyboard
    const handleRemoveKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        onRemove?.();
      }
    };

    return (
      <span
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center font-medium',
          'transition-colors duration-[var(--transition-fast,150ms)]',
          
          // Border radius
          isPill
            ? 'rounded-full'
            : 'rounded-[var(--radius-small,0.375rem)]',
          
          // Size variants
          {
            'px-2 py-0.5 text-xs gap-1': size === 'sm',
            'px-2.5 py-1 text-sm gap-1.5': size === 'md',
            'px-3 py-1.5 text-base gap-2': size === 'lg',
          },
          
          // Intent color variants using CSS variables
          // Each has background + text with sufficient contrast
          {
            // Default - neutral gray
            'bg-[rgb(var(--color-border,203_213_225))]': intent === 'default',
            'text-[rgb(var(--color-text,15_23_42))]': intent === 'default',
            
            // Primary
            'bg-[rgb(var(--color-primary-light,167_139_250))/0.2]': intent === 'primary',
            'text-[rgb(var(--color-primary-dark,109_40_217))]': intent === 'primary',
            
            // Secondary
            'bg-[rgb(var(--color-secondary-light,225_190_231))/0.3]': intent === 'secondary',
            'text-[rgb(var(--color-secondary-dark,126_87_194))]': intent === 'secondary',
            
            // Success
            'bg-[rgb(var(--color-success-light,167_243_208))]': intent === 'success',
            'text-[rgb(var(--color-success-dark,5_150_105))]': intent === 'success',
            
            // Warning
            'bg-[rgb(var(--color-warning-light,254_243_199))]': intent === 'warning',
            'text-[rgb(var(--color-warning-dark,217_119_6))]': intent === 'warning',
            
            // Error
            'bg-[rgb(var(--color-error-light,254_205_211))]': intent === 'error',
            'text-[rgb(var(--color-error-dark,220_38_38))]': intent === 'error',
            
            // Info
            'bg-[rgb(var(--color-info-light,224_242_254))]': intent === 'info',
            'text-[rgb(var(--color-info-dark,2_132_199))]': intent === 'info',
          },
          
          className
        )}
        {...props}
      >
        {/* Status dot indicator */}
        {hasStatusDot && (
          <span
            className={cn(
              'w-2 h-2 rounded-full shrink-0',
              {
                'bg-[rgb(var(--color-text-muted,148_163_184))]': intent === 'default',
                'bg-[rgb(var(--color-primary,124_58_237))]': intent === 'primary',
                'bg-[rgb(var(--color-secondary,179_157_219))]': intent === 'secondary',
                'bg-[rgb(var(--color-success,110_231_183))]': intent === 'success',
                'bg-[rgb(var(--color-warning,252_211_77))]': intent === 'warning',
                'bg-[rgb(var(--color-error,239_68_68))]': intent === 'error',
                'bg-[rgb(var(--color-info,125_211_252))]': intent === 'info',
              }
            )}
            aria-hidden="true"
          />
        )}

        {/* Icon */}
        {icon && !hasStatusDot && (
          <span className="shrink-0" aria-hidden="true">
            <>{icon}</>
          </span>
        )}

        {/* Text content */}
        <span>{children}</span>

        {/* Remove button */}
        {isRemovable && (
          <button
            type="button"
            onClick={handleRemoveClick}
            onKeyDown={handleRemoveKeyDown}
            aria-label={`${removeLabel} ${children}`}
            className={cn(
              'inline-flex items-center justify-center shrink-0',
              'rounded-full ml-0.5 -mr-1',
              'transition-colors duration-[var(--transition-fast,150ms)]',
              'focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-[rgb(var(--color-primary,124_58_237))]',
              
              // Size
              {
                'w-3.5 h-3.5': size === 'sm',
                'w-4 h-4': size === 'md',
                'w-5 h-5': size === 'lg',
              },
              
              // Hover state
              'hover:bg-black/10',
              'active:bg-black/20'
            )}
          >
            {/* X icon */}
            <svg
              className={cn({
                'w-2.5 h-2.5': size === 'sm',
                'w-3 h-3': size === 'md',
                'w-3.5 h-3.5': size === 'lg',
              })}
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

/**
 * BadgeGroup for displaying multiple badges together
 */
export interface BadgeGroupProps extends HTMLAttributes<HTMLDivElement> {
  /** Spacing between badges */
  gap?: 'sm' | 'md' | 'lg';
  /** Label for screen readers */
  'aria-label'?: string;
}

export const BadgeGroup = forwardRef<HTMLDivElement, BadgeGroupProps>(
  ({ gap = 'sm', className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="group"
        className={cn(
          'flex flex-wrap items-center',
          {
            'gap-1': gap === 'sm',
            'gap-2': gap === 'md',
            'gap-3': gap === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

BadgeGroup.displayName = 'BadgeGroup';

export default Badge;
