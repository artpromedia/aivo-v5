'use client';

import {
  forwardRef,
  InputHTMLAttributes,
  useId,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { cn } from '../utils';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size' | 'prefix'> {
  /** Label text (required for accessibility) */
  label: string;
  /** Hide the visual label (still accessible to screen readers) */
  hideLabel?: boolean;
  /** Error message to display */
  error?: string;
  /** Hint/helper text */
  hint?: string;
  /** Mark field as required */
  isRequired?: boolean;
  /** Disable the input */
  isDisabled?: boolean;
  /** Make the input read-only */
  isReadOnly?: boolean;
  /** Show character count (requires maxLength) */
  showCharacterCount?: boolean;
  /** Content to show before the input */
  prefixElement?: React.ReactNode;
  /** Content to show after the input */
  suffixElement?: React.ReactNode;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Full width input */
  fullWidth?: boolean;
}

/**
 * Accessible Input component with WCAG 2.1 AA compliance.
 * Automatically adapts to grade-based themes.
 * 
 * Features:
 * - Proper label association (never floating labels without backup)
 * - Error messages with role="alert"
 * - Helper text linked via aria-describedby
 * - Clear visual states (focus, error, disabled, readonly)
 * - Support for prefixes/suffixes
 * - Character count with aria-live
 * - Grade-themed styling via CSS variables
 * 
 * @example
 * ```tsx
 * <Input
 *   label="Email Address"
 *   type="email"
 *   hint="We'll never share your email"
 *   isRequired
 * />
 * 
 * <Input
 *   label="Username"
 *   error="Username is already taken"
 *   prefixElement={<UserIcon />}
 * />
 * 
 * <Input
 *   label="Bio"
 *   maxLength={200}
 *   showCharacterCount
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hideLabel = false,
      error,
      hint,
      isRequired = false,
      isDisabled = false,
      isReadOnly = false,
      showCharacterCount = false,
      prefixElement,
      suffixElement,
      size = 'md',
      fullWidth = true,
      className,
      id: providedId,
      maxLength,
      value,
      defaultValue,
      onChange,
      ...props
    },
    ref
  ) => {
    // Generate stable IDs for accessibility
    const generatedId = useId();
    const inputId = providedId || generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const countId = `${inputId}-count`;

    // Track character count
    const [charCount, setCharCount] = useState(() => {
      const initialValue = value || defaultValue || '';
      return String(initialValue).length;
    });

    // Update char count when value prop changes
    useEffect(() => {
      if (value !== undefined) {
        setCharCount(String(value).length);
      }
    }, [value]);

    // Handle input changes
    const handleChange = useCallback(
      (event: React.ChangeEvent<HTMLInputElement>) => {
        setCharCount(event.target.value.length);
        onChange?.(event);
      },
      [onChange]
    );

    // Build aria-describedby
    const describedByIds: string[] = [];
    if (hint) describedByIds.push(hintId);
    if (error) describedByIds.push(errorId);
    if (showCharacterCount && maxLength) describedByIds.push(countId);
    const ariaDescribedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined;

    const hasError = Boolean(error);
    const isAtLimit = maxLength ? charCount >= maxLength : false;

    return (
      <div className={cn('flex flex-col gap-1.5', fullWidth && 'w-full')}>
        {/* Label */}
        <label
          htmlFor={inputId}
          className={cn(
            'text-sm font-medium',
            'text-[rgb(var(--color-text,15_23_42))]',
            hideLabel && 'sr-only',
            isDisabled && 'opacity-50'
          )}
        >
          {label}
          {isRequired && (
            <span
              className="text-[rgb(var(--color-error,239_68_68))] ml-0.5"
              aria-hidden="true"
            >
              *
            </span>
          )}
          {isRequired && <span className="sr-only">(required)</span>}
        </label>

        {/* Input wrapper */}
        <div
          className={cn(
            'relative flex items-center',
            'rounded-[var(--radius-small,0.375rem)]',
            'border transition-all duration-[var(--transition-normal,200ms)]',
            'motion-reduce:transition-none',
            
            // Border colors
            hasError
              ? 'border-[rgb(var(--color-error,239_68_68))]'
              : 'border-[rgb(var(--color-border,203_213_225))]',
            
            // Background
            'bg-[rgb(var(--color-surface,255_255_255))]',
            
            // Focus-within styles
            !hasError && 'focus-within:border-[rgb(var(--color-primary,124_58_237))]',
            'focus-within:ring-[var(--focus-ring-width,2px)]',
            hasError
              ? 'focus-within:ring-[rgb(var(--color-error,239_68_68))/0.2]'
              : 'focus-within:ring-[rgb(var(--color-primary,124_58_237))/0.2]',
            
            // Disabled state
            isDisabled && 'opacity-50 cursor-not-allowed bg-[rgb(var(--color-background-sunken,248_250_252))]',
            
            // Read-only state
            isReadOnly && 'bg-[rgb(var(--color-background-sunken,248_250_252))]',
            
            // Size variants
            {
              'min-h-[40px]': size === 'sm',
              'min-h-[44px]': size === 'md',
              'min-h-[52px]': size === 'lg',
            }
          )}
        >
          {/* Prefix */}
          {prefixElement && (
            <span
              className={cn(
                'flex items-center justify-center shrink-0',
                'text-[rgb(var(--color-text-muted,148_163_184))]',
                {
                  'pl-2.5 pr-1': size === 'sm',
                  'pl-3 pr-1.5': size === 'md',
                  'pl-4 pr-2': size === 'lg',
                }
              )}
              aria-hidden="true"
            >
              <>{prefixElement}</>
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            disabled={isDisabled}
            readOnly={isReadOnly}
            required={isRequired}
            aria-invalid={hasError || undefined}
            aria-describedby={ariaDescribedBy}
            aria-required={isRequired || undefined}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            className={cn(
              'flex-1 w-full bg-transparent',
              'text-[rgb(var(--color-text,15_23_42))]',
              'placeholder:text-[rgb(var(--color-text-muted,148_163_184))]',
              'focus:outline-none',
              'disabled:cursor-not-allowed',
              
              // Size variants
              {
                'px-2.5 py-1.5 text-sm': size === 'sm',
                'px-3 py-2 text-base': size === 'md',
                'px-4 py-3 text-lg': size === 'lg',
              },
              
              // Adjust padding if prefix/suffix exists
              prefixElement && 'pl-0',
              suffixElement && 'pr-0',
              
              className
            )}
            {...props}
          />

          {/* Suffix */}
          {suffixElement && (
            <span
              className={cn(
                'flex items-center justify-center shrink-0',
                'text-[rgb(var(--color-text-muted,148_163_184))]',
                {
                  'pr-2.5 pl-1': size === 'sm',
                  'pr-3 pl-1.5': size === 'md',
                  'pr-4 pl-2': size === 'lg',
                }
              )}
              aria-hidden="true"
            >
              <>{suffixElement}</>
            </span>
          )}
        </div>

        {/* Helper text / Error / Character count */}
        <div className="flex items-start justify-between gap-2 min-h-[1.25rem]">
          <div className="flex-1">
            {/* Error message */}
            {error && (
              <p
                id={errorId}
                role="alert"
                aria-live="assertive"
                className={cn(
                  'text-sm',
                  'text-[rgb(var(--color-error,239_68_68))]',
                  'flex items-center gap-1'
                )}
              >
                {/* Error icon */}
                <svg
                  className="w-4 h-4 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{error}</span>
              </p>
            )}

            {/* Hint text (only show if no error) */}
            {hint && !error && (
              <p
                id={hintId}
                className={cn(
                  'text-sm',
                  'text-[rgb(var(--color-text-muted,148_163_184))]'
                )}
              >
                {hint}
              </p>
            )}
          </div>

          {/* Character count */}
          {showCharacterCount && maxLength && (
            <p
              id={countId}
              aria-live="polite"
              aria-atomic="true"
              className={cn(
                'text-xs tabular-nums',
                isAtLimit
                  ? 'text-[rgb(var(--color-error,239_68_68))]'
                  : 'text-[rgb(var(--color-text-muted,148_163_184))]'
              )}
            >
              <span className="sr-only">
                {charCount} of {maxLength} characters used
              </span>
              <span aria-hidden="true">
                {charCount}/{maxLength}
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
