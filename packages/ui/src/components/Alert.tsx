'use client';

import {
  forwardRef,
  HTMLAttributes,
  useState,
  useCallback,
  KeyboardEvent,
} from 'react';
import { cn } from '../utils';

export type AlertIntent = 'info' | 'success' | 'warning' | 'error';
export type AlertVariant = 'subtle' | 'solid' | 'outlined' | 'banner';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /** Visual intent/importance */
  intent?: AlertIntent;
  /** Style variant */
  variant?: 'subtle' | 'solid' | 'outlined' | 'banner';
  /** Alert title */
  title?: string;
  /** Custom icon (overrides default intent icon) */
  icon?: React.ReactNode;
  /** Hide the icon */
  hideIcon?: boolean;
  /** Make the alert dismissible */
  isDismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
  /** Accessible label for dismiss button */
  dismissLabel?: string;
  /** Actions to display (buttons, links) */
  actions?: React.ReactNode;
  /** 
   * Use role="alert" for important messages that need immediate attention
   * Use role="status" for non-critical updates
   */
  isImportant?: boolean;
}

// Default icons for each intent
const IntentIcons: Record<AlertIntent, React.ReactNode> = {
  info: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
        clipRule="evenodd"
      />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * Accessible Alert/Banner component with grade-themed styling.
 * 
 * Features:
 * - role="alert" for important messages
 * - role="status" for non-critical updates
 * - Clear visual distinction by type (success, warning, error, info)
 * - Dismissible variant with keyboard support
 * - Icon + text (never color alone)
 * - Respects reduced motion preferences
 * 
 * @example
 * ```tsx
 * // Important error alert
 * <Alert intent="error" isImportant title="Error">
 *   Something went wrong. Please try again.
 * </Alert>
 * 
 * // Dismissible success message
 * <Alert 
 *   intent="success" 
 *   isDismissible 
 *   onDismiss={() => setShowAlert(false)}
 * >
 *   Your changes have been saved.
 * </Alert>
 * 
 * // Info banner with actions
 * <Alert 
 *   intent="info" 
 *   variant="banner"
 *   actions={<Button size="sm">Learn More</Button>}
 * >
 *   New features are available!
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      intent = 'info',
      variant = 'subtle',
      title,
      icon,
      hideIcon = false,
      isDismissible = false,
      onDismiss,
      dismissLabel = 'Dismiss',
      actions,
      isImportant = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = useCallback(() => {
      setIsVisible(false);
      onDismiss?.();
    }, [onDismiss]);

    const handleDismissKeyDown = useCallback(
      (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handleDismiss();
        }
      },
      [handleDismiss]
    );

    if (!isVisible) {
      return null;
    }

    const displayIcon = icon ?? IntentIcons[intent];

    return (
      <div
        ref={ref}
        role={isImportant ? 'alert' : 'status'}
        aria-live={isImportant ? 'assertive' : 'polite'}
        aria-atomic="true"
        className={cn(
          'relative flex gap-3',
          'transition-all duration-[var(--transition-normal,200ms)]',
          'motion-reduce:transition-none',
          
          // Border radius (not for banner)
          variant !== 'banner' && 'rounded-[var(--radius-medium,0.75rem)]',
          
          // Padding
          variant === 'banner' ? 'px-4 py-3' : 'p-4',
          
          // Variant styles
          {
            // Subtle - light background
            'border': variant === 'subtle',
            
            // Solid - filled background
            'border-0': variant === 'solid',
            
            // Outlined - just border
            'border-2 bg-transparent': variant === 'outlined',
            
            // Banner - full width, no radius
            'w-full': variant === 'banner',
          },
          
          // Intent colors for subtle variant
          variant === 'subtle' && {
            'bg-[rgb(var(--color-info-light,224_242_254))] border-[rgb(var(--color-info,125_211_252))]': intent === 'info',
            'bg-[rgb(var(--color-success-light,167_243_208))] border-[rgb(var(--color-success,110_231_183))]': intent === 'success',
            'bg-[rgb(var(--color-warning-light,254_243_199))] border-[rgb(var(--color-warning,252_211_77))]': intent === 'warning',
            'bg-[rgb(var(--color-error-light,254_205_211))] border-[rgb(var(--color-error,239_68_68))]': intent === 'error',
          },
          
          // Intent colors for solid variant
          variant === 'solid' && {
            'bg-[rgb(var(--color-info,125_211_252))] text-[rgb(var(--color-info-dark,2_132_199))]': intent === 'info',
            'bg-[rgb(var(--color-success,110_231_183))] text-[rgb(var(--color-success-dark,5_150_105))]': intent === 'success',
            'bg-[rgb(var(--color-warning,252_211_77))] text-[rgb(var(--color-warning-dark,217_119_6))]': intent === 'warning',
            'bg-[rgb(var(--color-error,239_68_68))] text-white': intent === 'error',
          },
          
          // Intent colors for outlined variant
          variant === 'outlined' && {
            'border-[rgb(var(--color-info,125_211_252))]': intent === 'info',
            'border-[rgb(var(--color-success,110_231_183))]': intent === 'success',
            'border-[rgb(var(--color-warning,252_211_77))]': intent === 'warning',
            'border-[rgb(var(--color-error,239_68_68))]': intent === 'error',
          },
          
          // Intent colors for banner variant
          variant === 'banner' && {
            'bg-[rgb(var(--color-info-light,224_242_254))]': intent === 'info',
            'bg-[rgb(var(--color-success-light,167_243_208))]': intent === 'success',
            'bg-[rgb(var(--color-warning-light,254_243_199))]': intent === 'warning',
            'bg-[rgb(var(--color-error-light,254_205_211))]': intent === 'error',
          },
          
          className
        )}
        {...props}
      >
        {/* Icon */}
        {!hideIcon && displayIcon && (
          <span
            className={cn(
              'flex-shrink-0 mt-0.5',
              // Icon colors
              {
                'text-[rgb(var(--color-info-dark,2_132_199))]': intent === 'info',
                'text-[rgb(var(--color-success-dark,5_150_105))]': intent === 'success',
                'text-[rgb(var(--color-warning-dark,217_119_6))]': intent === 'warning',
                'text-[rgb(var(--color-error-dark,220_38_38))]': intent === 'error',
              },
              // Override for solid variant error (white text)
              variant === 'solid' && intent === 'error' && 'text-white'
            )}
            aria-hidden="true"
          >
            <>{displayIcon}</>
          </span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Title */}
          {title && (
            <h3
              className={cn(
                'font-semibold',
                {
                  'text-[rgb(var(--color-info-dark,2_132_199))]': intent === 'info',
                  'text-[rgb(var(--color-success-dark,5_150_105))]': intent === 'success',
                  'text-[rgb(var(--color-warning-dark,217_119_6))]': intent === 'warning',
                  'text-[rgb(var(--color-error-dark,220_38_38))]': intent === 'error',
                },
                variant === 'solid' && intent === 'error' && 'text-white',
                children && 'mb-1'
              )}
            >
              {title}
            </h3>
          )}

          {/* Description */}
          {children && (
            <div
              className={cn(
                'text-sm',
                {
                  'text-[rgb(var(--color-text,15_23_42))]': variant !== 'solid' || intent !== 'error',
                  'text-white/90': variant === 'solid' && intent === 'error',
                }
              )}
            >
              {children}
            </div>
          )}

          {/* Actions */}
          {actions && (
            <div className="mt-3 flex items-center gap-2">
              <>{actions}</>
            </div>
          )}
        </div>

        {/* Dismiss button */}
        {isDismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            onKeyDown={handleDismissKeyDown}
            aria-label={dismissLabel}
            className={cn(
              'flex-shrink-0',
              'inline-flex items-center justify-center',
              'w-8 h-8 -mr-2 -mt-1',
              'rounded-[var(--radius-small,0.375rem)]',
              'transition-colors duration-[var(--transition-fast,150ms)]',
              'focus:outline-none focus-visible:ring-2',
              'focus-visible:ring-[rgb(var(--color-primary,124_58_237))]',
              'focus-visible:ring-offset-2',
              
              // Hover states
              {
                'hover:bg-[rgb(var(--color-info,125_211_252))/0.2]': intent === 'info',
                'hover:bg-[rgb(var(--color-success,110_231_183))/0.2]': intent === 'success',
                'hover:bg-[rgb(var(--color-warning,252_211_77))/0.2]': intent === 'warning',
                'hover:bg-[rgb(var(--color-error,239_68_68))/0.2]': intent === 'error',
              },
              
              // Icon colors
              {
                'text-[rgb(var(--color-info-dark,2_132_199))]': intent === 'info',
                'text-[rgb(var(--color-success-dark,5_150_105))]': intent === 'success',
                'text-[rgb(var(--color-warning-dark,217_119_6))]': intent === 'warning',
                'text-[rgb(var(--color-error-dark,220_38_38))]': intent === 'error',
              },
              variant === 'solid' && intent === 'error' && 'text-white hover:bg-white/20'
            )}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

/**
 * AlertTitle for custom heading placement
 */
export interface AlertTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

export const AlertTitle = forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn('font-semibold mb-1', className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

AlertTitle.displayName = 'AlertTitle';

/**
 * AlertDescription for custom description placement
 */
export type AlertDescriptionProps = HTMLAttributes<HTMLDivElement>;

export const AlertDescription = forwardRef<HTMLDivElement, AlertDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn('text-sm', className)} {...props}>
        {children}
      </div>
    );
  }
);

AlertDescription.displayName = 'AlertDescription';

export default Alert;
