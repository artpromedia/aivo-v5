'use client';

import { ReactNode } from 'react';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@aivo/ui/src/utils';

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message */
  message: string;
  /** Retry handler */
  onRetry?: () => void;
  /** Retry button text */
  retryText?: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Error state display with retry option.
 * Uses violet theme for consistency.
 */
export function ErrorState({ 
  title = 'Unable to Load',
  message, 
  onRetry,
  retryText = 'Try Again',
  className 
}: ErrorStateProps) {
  return (
    <div 
      className={cn(
        'bg-white rounded-3xl shadow-xl p-8 max-w-md text-center',
        className
      )}
      role="alert"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <XCircle className="w-8 h-8 text-red-600" aria-hidden="true" />
      </div>
      <h1 className="text-xl font-bold text-slate-800 mb-2">{title}</h1>
      <p className="text-slate-600 mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            'px-6 py-2.5 bg-violet-600 text-white rounded-2xl font-medium',
            'hover:bg-violet-700 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2'
          )}
        >
          {retryText}
        </button>
      )}
    </div>
  );
}

/**
 * Full page error state
 */
export function PageError(props: ErrorStateProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 flex items-center justify-center p-4">
      <ErrorState {...props} />
    </div>
  );
}

export interface InlineErrorProps {
  /** Error message */
  message: string;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Inline error message for forms and smaller contexts.
 */
export function InlineError({ message, className }: InlineErrorProps) {
  return (
    <div 
      className={cn(
        'bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3',
        className
      )}
      role="alert"
    >
      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
      <p className="text-red-600 text-sm">{message}</p>
    </div>
  );
}
