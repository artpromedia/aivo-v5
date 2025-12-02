'use client';

import { forwardRef, InputHTMLAttributes } from 'react';
import { cn } from '@aivo/ui/src/utils';

export interface SliderFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Label text */
  label: string;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment */
  step?: number;
  /** Change handler */
  onChange: (value: number) => void;
  /** Display suffix (e.g., '%', 'x') */
  valueSuffix?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Accessible range slider with proper theming.
 * Uses violet accent color.
 */
export const SliderField = forwardRef<HTMLInputElement, SliderFieldProps>(
  ({ label, value, min, max, step = 1, onChange, valueSuffix = '', className, id, ...props }, ref) => {
    const sliderId = id || `slider-${label.toLowerCase().replace(/\s+/g, '-')}`;
    
    return (
      <div className={className}>
        <label 
          htmlFor={sliderId}
          className="block text-sm font-medium text-slate-700 mb-2"
        >
          {label}: <span className="text-violet-600 font-semibold">{value}{valueSuffix}</span>
        </label>
        <input
          ref={ref}
          id={sliderId}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className={cn(
            'w-full h-2 rounded-full appearance-none cursor-pointer',
            'bg-gray-200',
            '[&::-webkit-slider-thumb]:appearance-none',
            '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
            '[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600',
            '[&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer',
            '[&::-webkit-slider-thumb]:transition-all',
            '[&::-webkit-slider-thumb]:hover:bg-violet-700',
            '[&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5',
            '[&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-violet-600',
            '[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
          )}
          {...props}
        />
      </div>
    );
  }
);

SliderField.displayName = 'SliderField';
