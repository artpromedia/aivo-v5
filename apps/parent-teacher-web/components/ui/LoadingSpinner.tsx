'use client';

import { Loader2 } from 'lucide-react';
import { cn } from '@aivo/ui/src/utils';

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Text to display below spinner */
  text?: string;
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
};

/**
 * Accessible loading spinner with proper ARIA attributes.
 * Replaces emoji spinners throughout the app.
 */
export function LoadingSpinner({ 
  size = 'md', 
  text,
  className 
}: LoadingSpinnerProps) {
  return (
    <div 
      className={cn('flex flex-col items-center justify-center gap-3', className)}
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2 
        className={cn(
          'animate-spin text-violet-600',
          sizeClasses[size]
        )} 
        aria-hidden="true"
      />
      {text && (
        <p className="text-slate-600 text-sm">{text}</p>
      )}
      <span className="sr-only">{text || 'Loading...'}</span>
    </div>
  );
}

/**
 * Full page loading state
 */
export function PageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center">
      <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
        <LoadingSpinner size="lg" text={text} />
      </div>
    </div>
  );
}
