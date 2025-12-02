'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';
import { cn } from '@aivo/ui/src/utils';

export interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  /** Label text */
  label: string;
  /** Options for the select */
  options: Array<{ value: string; label: string }>;
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Helper text below the select */
  helperText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible select field with proper theming.
 * Uses violet focus states and rounded-2xl styling.
 */
export const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, options, value, onChange, helperText, className, id, ...props }, ref) => {
    const selectId = id || `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div className={className}>
        <label 
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full p-3 border border-gray-200 rounded-2xl bg-white',
            'text-slate-800 transition-all',
            'focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-violet-500'
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && (
          <p className="mt-1 text-sm text-slate-500">{helperText}</p>
        )}
      </div>
    );
  }
);

SelectField.displayName = 'SelectField';
