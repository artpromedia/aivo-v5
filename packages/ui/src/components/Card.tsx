import { forwardRef, HTMLAttributes, KeyboardEvent } from 'react';
import { cn } from '../utils';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /** Semantic HTML element to render */
  as?: 'article' | 'section' | 'div';
  /** Visual variant */
  variant?: 'elevated' | 'outlined' | 'filled';
  /** Whether the card is interactive (clickable) */
  isInteractive?: boolean;
  /** Padding size - adapts to grade theme */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** Whether to show hover effects */
  showHover?: boolean;
  /** Custom border radius override */
  rounded?: 'sm' | 'md' | 'lg' | 'full' | 'none';
}

/**
 * Accessible Card component with grade-themed styling.
 * 
 * Features:
 * - Semantic HTML (article for content, section for grouping)
 * - Proper heading hierarchy support
 * - Focus management for interactive cards
 * - Hover/focus states that respect reduced motion
 * - Border radius that adapts to grade theme
 * - WCAG 2.1 AA compliant
 * 
 * @example
 * ```tsx
 * <Card as="article" variant="elevated" padding="md">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 * 
 * <Card isInteractive onClick={() => navigate('/detail')}>
 *   <span>Click to view details</span>
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLElement, CardProps>(
  (
    {
      as: Component = 'div',
      variant = 'elevated',
      isInteractive = false,
      padding = 'md',
      showHover = true,
      rounded,
      className,
      onClick,
      onKeyDown,
      children,
      ...props
    },
    ref
  ) => {
    // Handle keyboard interaction for interactive cards
    const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
      if (isInteractive && onClick) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick(event as unknown as React.MouseEvent<HTMLElement>);
        }
      }
      onKeyDown?.(event);
    };

    // Determine border radius class
    const radiusClass = rounded
      ? {
          none: 'rounded-none',
          sm: 'rounded-sm',
          md: 'rounded-md',
          lg: 'rounded-lg',
          full: 'rounded-full',
        }[rounded]
      : 'rounded-[var(--radius-medium,0.75rem)]';

    return (
      <Component
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ref={ref as any}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        onClick={isInteractive ? onClick : undefined}
        onKeyDown={handleKeyDown}
        aria-disabled={props['aria-disabled']}
        className={cn(
          // Base styles
          'relative block',
          radiusClass,
          
          // Transition respecting reduced motion
          'transition-all duration-[var(--transition-normal,200ms)]',
          'motion-reduce:transition-none',
          
          // Padding variants
          {
            'p-0': padding === 'none',
            'p-3 sm:p-4': padding === 'sm',
            'p-4 sm:p-6': padding === 'md',
            'p-6 sm:p-8': padding === 'lg',
          },
          
          // Variant styles using CSS variables
          {
            // Elevated - shadow with surface background
            'bg-[rgb(var(--color-surface,255_255_255))]': variant === 'elevated',
            'shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)]': variant === 'elevated',
            
            // Outlined - border with transparent background
            'bg-transparent': variant === 'outlined',
            'border border-[rgb(var(--color-border,203_213_225))]': variant === 'outlined',
            
            // Filled - solid surface background
            'bg-[rgb(var(--color-surface,248_250_252))]': variant === 'filled',
          },
          
          // Interactive styles
          isInteractive && [
            'cursor-pointer',
            'select-none',
            // Focus styles
            'focus:outline-none focus-visible:outline-none',
            'focus-visible:ring-[var(--focus-ring-width,2px)]',
            'focus-visible:ring-[rgb(var(--color-primary,124_58_237))]',
            'focus-visible:ring-offset-[var(--focus-ring-offset,2px)]',
            'focus-visible:ring-offset-[rgb(var(--color-background,255_255_255))]',
          ],
          
          // Hover effects (when enabled and interactive)
          isInteractive && showHover && [
            'hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)]',
            'hover:-translate-y-0.5',
            'active:translate-y-0',
            'active:shadow-[0_1px_3px_rgba(0,0,0,0.1)]',
          ],
          
          // Non-interactive hover for elevated variant
          !isInteractive && showHover && variant === 'elevated' && [
            'hover:shadow-[0_2px_6px_rgba(0,0,0,0.1)]',
          ],
          
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';

// ============================================
// Card Sub-components
// ============================================

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Enforce a specific heading level for accessibility */
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Card header with proper heading hierarchy support
 */
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          'pb-4 border-b border-[rgb(var(--color-border,203_213_225))]',
          'mb-4',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Heading level for semantic hierarchy */
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}

/**
 * Card title with proper heading semantics
 */
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>(
  ({ as: Component = 'h3', className, children, ...props }, ref) => {
    return (
      <Component
        ref={ref}
        className={cn(
          'text-lg font-semibold leading-tight',
          'text-[rgb(var(--color-text,15_23_42))]',
          className
        )}
        {...props}
      >
        {children}
      </Component>
    );
  }
);

CardTitle.displayName = 'CardTitle';

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * Card description text
 */
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <p
        ref={ref}
        className={cn(
          'text-sm',
          'text-[rgb(var(--color-text-muted,148_163_184))]',
          className
        )}
        {...props}
      >
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

/**
 * Card content area
 */
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('', className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardContent.displayName = 'CardContent';

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

/**
 * Card footer for actions
 */
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-2',
          'pt-4 mt-4',
          'border-t border-[rgb(var(--color-border,203_213_225))]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardFooter.displayName = 'CardFooter';

export default Card;
