import { forwardRef, InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '../utils';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Label text for the input (required for accessibility) */
  label: string;
  /** Error message to display */
  error?: string;
  /** Hint text to display below the label */
  hint?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Icon to display at the start of the input */
  startIcon?: ReactNode;
  /** Icon to display at the end of the input */
  endIcon?: ReactNode;
  /** Whether to visually hide the label (still accessible to screen readers) */
  hideLabel?: boolean;
}

/**
 * Accessible FormField component with WCAG 2.1 AA compliance.
 * 
 * Features:
 * - Proper label association
 * - Error announcements
 * - Hint text support
 * - Required field indication (visual and screen reader)
 * - Sufficient color contrast
 * - Focus indicators
 */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  ({ 
    label, 
    error, 
    hint, 
    required, 
    id,
    startIcon,
    endIcon,
    hideLabel = false,
    className,
    type = 'text',
    disabled,
    ...props 
  }, ref) => {
    // Generate unique IDs for accessibility associations
    const inputId = id || `field-${label.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substr(2, 9)}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    
    // Build aria-describedby value
    const describedBy = [
      error ? errorId : null,
      hint ? hintId : null,
    ].filter(Boolean).join(' ') || undefined;
    
    return (
      <div className="space-y-1.5">
        {/* Label */}
        <label 
          htmlFor={inputId}
          className={cn(
            'block text-sm font-medium text-gray-700',
            hideLabel && 'sr-only'
          )}
        >
          {label}
          {required && (
            <>
              <span className="text-red-500 ml-1" aria-hidden="true">*</span>
              <span className="sr-only">(required)</span>
            </>
          )}
        </label>
        
        {/* Hint text */}
        {hint && (
          <p 
            id={hintId} 
            className="text-sm text-gray-500"
          >
            {hint}
          </p>
        )}
        
        {/* Input wrapper */}
        <div className="relative">
          {/* Start icon */}
          {startIcon && (
            <div 
              className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400"
              aria-hidden="true"
            >
              {startIcon}
            </div>
          )}
          
          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={type}
            disabled={disabled}
            aria-required={required}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            className={cn(
              'block w-full rounded-md border shadow-sm transition-colors',
              'min-h-[44px] px-3 py-2',
              // Focus styles
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              // Error state
              error 
                ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500',
              // Disabled state
              disabled && 'bg-gray-100 text-gray-500 cursor-not-allowed',
              // Icon padding
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              className
            )}
            {...props}
          />
          
          {/* End icon */}
          {endIcon && (
            <div 
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400"
              aria-hidden="true"
            >
              {endIcon}
            </div>
          )}
          
          {/* Error icon */}
          {error && !endIcon && (
            <div 
              className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"
              aria-hidden="true"
            >
              <svg 
                className="h-5 w-5 text-red-500" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                  clipRule="evenodd" 
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Error message */}
        {error && (
          <p 
            id={errorId} 
            className="text-sm text-red-600 flex items-center gap-1"
            role="alert"
            aria-live="polite"
          >
            <svg 
              className="h-4 w-4 flex-shrink-0" 
              viewBox="0 0 20 20" 
              fill="currentColor"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
                clipRule="evenodd" 
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

export default FormField;
