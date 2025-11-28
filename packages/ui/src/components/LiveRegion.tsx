'use client';

import { useEffect, useState, useCallback, createContext, useContext, ReactNode } from 'react';

// =============================================================================
// LiveRegion Component
// =============================================================================

export interface LiveRegionProps {
  /** Message to announce */
  message: string;
  /** Politeness level for screen readers */
  politeness?: 'polite' | 'assertive';
  /** Clear the message after this many milliseconds (0 = never) */
  clearAfter?: number;
  /** Whether to announce the same message again */
  atomic?: boolean;
}

/**
 * Accessible LiveRegion component for screen reader announcements.
 * 
 * Features:
 * - Supports polite and assertive announcements
 * - Auto-clears after specified time
 * - Hidden from visual display
 * - Compatible with all major screen readers
 */
export function LiveRegion({ 
  message, 
  politeness = 'polite', 
  clearAfter = 5000,
  atomic = true,
}: LiveRegionProps) {
  const [announcement, setAnnouncement] = useState(message);
  
  useEffect(() => {
    setAnnouncement(message);
    
    if (clearAfter > 0 && message) {
      const timer = setTimeout(() => setAnnouncement(''), clearAfter);
      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);
  
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant="additions text"
      className="sr-only"
    >
      {announcement}
    </div>
  );
}

// =============================================================================
// useAnnounce Hook
// =============================================================================

export interface UseAnnounceReturn {
  /** Current message being announced */
  message: string;
  /** Function to trigger an announcement */
  announce: (text: string, options?: AnnounceOptions) => void;
  /** Function to clear the current announcement */
  clear: () => void;
}

export interface AnnounceOptions {
  /** Politeness level */
  politeness?: 'polite' | 'assertive';
  /** Delay before announcement (ms) */
  delay?: number;
}

/**
 * Hook for triggering screen reader announcements.
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { message, announce } = useAnnounce();
 *   
 *   const handleSave = async () => {
 *     await save();
 *     announce('Changes saved successfully');
 *   };
 *   
 *   return (
 *     <>
 *       <button onClick={handleSave}>Save</button>
 *       <LiveRegion message={message} />
 *     </>
 *   );
 * }
 * ```
 */
export function useAnnounce(): UseAnnounceReturn {
  const [message, setMessage] = useState('');
  
  const announce = useCallback((text: string, options?: AnnounceOptions) => {
    const delay = options?.delay ?? 100;
    
    // Clear first to ensure re-announcement of same message works
    setMessage('');
    
    // Force re-render to trigger announcement
    setTimeout(() => setMessage(text), delay);
  }, []);
  
  const clear = useCallback(() => {
    setMessage('');
  }, []);
  
  return { message, announce, clear };
}

// =============================================================================
// Announcer Context
// =============================================================================

interface AnnouncerContextValue {
  announce: (message: string, options?: AnnounceOptions) => void;
  announcePolite: (message: string) => void;
  announceAssertive: (message: string) => void;
}

const AnnouncerContext = createContext<AnnouncerContextValue | null>(null);

export interface AnnouncerProviderProps {
  children: ReactNode;
}

/**
 * Provider for global announcements.
 * Wrap your app with this to enable useAnnouncer hook.
 */
export function AnnouncerProvider({ children }: AnnouncerProviderProps) {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');
  
  const announce = useCallback((message: string, options?: AnnounceOptions) => {
    const politeness = options?.politeness ?? 'polite';
    const delay = options?.delay ?? 100;
    
    if (politeness === 'assertive') {
      setAssertiveMessage('');
      setTimeout(() => setAssertiveMessage(message), delay);
    } else {
      setPoliteMessage('');
      setTimeout(() => setPoliteMessage(message), delay);
    }
  }, []);
  
  const announcePolite = useCallback((message: string) => {
    announce(message, { politeness: 'polite' });
  }, [announce]);
  
  const announceAssertive = useCallback((message: string) => {
    announce(message, { politeness: 'assertive' });
  }, [announce]);
  
  return (
    <AnnouncerContext.Provider value={{ announce, announcePolite, announceAssertive }}>
      {children}
      
      {/* Polite region */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {politeMessage}
      </div>
      
      {/* Assertive region */}
      <div
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        className="sr-only"
      >
        {assertiveMessage}
      </div>
    </AnnouncerContext.Provider>
  );
}

/**
 * Hook to access global announcer.
 * Must be used within AnnouncerProvider.
 */
export function useAnnouncer(): AnnouncerContextValue {
  const context = useContext(AnnouncerContext);
  
  if (!context) {
    throw new Error('useAnnouncer must be used within an AnnouncerProvider');
  }
  
  return context;
}

// =============================================================================
// Utility Components
// =============================================================================

export interface VisuallyHiddenProps {
  children: ReactNode;
  /** Element type to render */
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Component that visually hides content but keeps it accessible to screen readers.
 */
export function VisuallyHidden({ children, as: Component = 'span' }: VisuallyHiddenProps) {
  return (
    <Component className="sr-only">
      {children}
    </Component>
  );
}

export interface LoadingAnnouncementProps {
  /** Whether loading is in progress */
  isLoading: boolean;
  /** Message to announce when loading starts */
  loadingMessage?: string;
  /** Message to announce when loading completes */
  completedMessage?: string;
}

/**
 * Component that announces loading state changes to screen readers.
 */
export function LoadingAnnouncement({ 
  isLoading, 
  loadingMessage = 'Loading, please wait',
  completedMessage = 'Content loaded',
}: LoadingAnnouncementProps) {
  const [message, setMessage] = useState('');
  const prevLoadingRef = React.useRef(isLoading);
  
  useEffect(() => {
    if (isLoading && !prevLoadingRef.current) {
      setMessage(loadingMessage);
    } else if (!isLoading && prevLoadingRef.current) {
      setMessage(completedMessage);
    }
    
    prevLoadingRef.current = isLoading;
  }, [isLoading, loadingMessage, completedMessage]);
  
  return <LiveRegion message={message} politeness="polite" />;
}

// Import React for useRef
import * as React from 'react';

export default LiveRegion;
