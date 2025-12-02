/**
 * Error Boundary Component
 * 
 * Provides error boundary functionality for React components using Sentry.
 * Catches JavaScript errors anywhere in the child component tree.
 */

'use client';

import * as Sentry from '@sentry/nextjs';
import { ReactNode } from 'react';

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-6xl">😔</div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900 dark:text-gray-100">
        Oops! Something went wrong
      </h2>
      <p className="mb-6 max-w-md text-gray-600 dark:text-gray-400">
        We&apos;re sorry, but something unexpected happened. Our team has been notified.
      </p>
      <div className="flex gap-4">
        <button
          onClick={resetError}
          className="rounded-lg bg-indigo-600 px-6 py-2 text-white transition-colors hover:bg-indigo-700"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Refresh Page
        </button>
      </div>
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-8 max-w-lg text-left">
          <summary className="cursor-pointer text-sm text-gray-500">
            Error Details (Development Only)
          </summary>
          <pre className="mt-2 overflow-auto rounded bg-gray-100 p-4 text-xs text-red-600 dark:bg-gray-800 dark:text-red-400">
            {error.message}
            {'\n\n'}
            {error.stack}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Child-friendly error fallback for learner-facing pages
 */
export function ChildFriendlyErrorFallback({ error, resetError }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <div className="mb-6 text-8xl">🤖💫</div>
      <h2 className="mb-2 text-2xl font-bold text-indigo-900">
        Whoops! Let&apos;s try that again!
      </h2>
      <p className="mb-6 max-w-md text-lg text-indigo-700">
        Something didn&apos;t work quite right, but that&apos;s okay! 
        Click the button below to give it another go.
      </p>
      <button
        onClick={resetError}
        className="rounded-full bg-gradient-to-r from-indigo-500 to-theme-primary px-8 py-3 text-lg font-semibold text-white shadow-lg transition-transform hover:scale-105"
      >
        🔄 Try Again!
      </button>
    </div>
  );
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((props: ErrorFallbackProps) => ReactNode);
  onError?: (error: Error, componentStack: string) => void;
  showDialog?: boolean;
}

/**
 * Error Boundary wrapper using Sentry
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With custom fallback
 * <ErrorBoundary fallback={<CustomError />}>
 *   <MyComponent />
 * </ErrorBoundary>
 * 
 * // With render prop fallback
 * <ErrorBoundary fallback={({ error, resetError }) => (
 *   <div>
 *     <p>Error: {error.message}</p>
 *     <button onClick={resetError}>Retry</button>
 *   </div>
 * )}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export function ErrorBoundary({
  children,
  fallback,
  onError,
  showDialog = false,
}: ErrorBoundaryProps) {
  const handleError = (error: unknown, componentStack: string | undefined, eventId: string) => {
    // Log to console in development
    console.error('Error caught by boundary:', error);
    console.error('Component stack:', componentStack);
    console.error('Sentry event ID:', eventId);
    
    // Call custom error handler if provided
    if (error instanceof Error) {
      onError?.(error, componentStack ?? '');
    }
  };

  // Render fallback based on type
  const renderFallback = ({ error, resetError }: { error: unknown; resetError: () => void }): React.ReactElement => {
    const errorInstance = error instanceof Error ? error : new Error(String(error));
    if (typeof fallback === 'function') {
      return <>{fallback({ error: errorInstance, resetError })}</>;
    }
    if (fallback) {
      return <>{fallback}</>;
    }
    return <DefaultErrorFallback error={errorInstance} resetError={resetError} />;
  };

  return (
    <Sentry.ErrorBoundary
      fallback={renderFallback}
      onError={handleError}
      showDialog={showDialog}
      dialogOptions={{
        title: "We're sorry!",
        subtitle: "Our team has been notified about this issue.",
        subtitle2: "If you'd like to help, tell us what happened below.",
        labelSubmit: "Send Feedback",
        labelClose: "Close",
      }}
    >
      <>{children}</>
    </Sentry.ErrorBoundary>
  );
}

/**
 * Error boundary specifically for learner-facing pages
 * Uses child-friendly messaging and visuals
 */
export function LearnerErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      fallback={(props) => <ChildFriendlyErrorFallback {...props} />}
      onError={(error, componentStack) => {
        // Add learner context breadcrumb
        Sentry.addBreadcrumb({
          category: 'learner-error',
          message: 'Error in learner-facing component',
          level: 'error',
          data: {
            errorMessage: error.message,
          },
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Hook to manually capture errors with context
 */
export function useCaptureError() {
  return {
    captureError: (error: Error, context?: Record<string, unknown>) => {
      Sentry.captureException(error, {
        extra: context,
      });
    },
    captureMessage: (message: string, level: Sentry.SeverityLevel = 'info') => {
      Sentry.captureMessage(message, level);
    },
  };
}

export default ErrorBoundary;
