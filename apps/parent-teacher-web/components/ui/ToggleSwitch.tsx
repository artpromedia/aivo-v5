'use client';

import { forwardRef } from 'react';
import { cn } from '@aivo/ui/src/utils';

export interface ToggleSwitchProps {
  /** Whether the toggle is checked */
  checked: boolean;
  /** Change handler */
  onChange: (checked: boolean) => void;
  /** Label text */
  label: string;
  /** Description text */
  description?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible toggle switch component with proper theming.
 * Uses violet colors consistently and rounded-2xl styling.
 */
export const ToggleSwitch = forwardRef<HTMLButtonElement, ToggleSwitchProps>(
  ({ checked, onChange, label, description, disabled = false, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={description ? `${label}-desc` : undefined}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={cn(
          'flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all w-full',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2',
          checked 
            ? 'border-violet-500 bg-violet-50' 
            : 'border-gray-200 hover:border-violet-200',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
      >
        <div>
          <div className="font-medium text-slate-800">{label}</div>
          {description && (
            <div id={`${label}-desc`} className="text-sm text-slate-500">
              {description}
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-12 h-7 rounded-full p-1 transition-colors flex-shrink-0',
            checked ? 'bg-violet-600' : 'bg-gray-300'
          )}
          aria-hidden="true"
        >
          <div
            className={cn(
              'w-5 h-5 rounded-full bg-white shadow transition-transform',
              checked ? 'translate-x-5' : 'translate-x-0'
            )}
          />
        </div>
      </button>
    );
  }
);

ToggleSwitch.displayName = 'ToggleSwitch';
