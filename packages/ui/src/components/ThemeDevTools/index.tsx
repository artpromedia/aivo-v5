'use client';

/**
 * ThemeDevTools - Development-only theme preview and testing tools
 * 
 * Features:
 * - Theme preview panel with all grade themes
 * - Accessibility testing controls
 * - Color contrast checker
 * - Component gallery
 * - CSS variable inspector
 * 
 * IMPORTANT: This component only renders in development mode.
 * It has zero bundle size impact in production.
 * 
 * @example
 * ```tsx
 * // Add to your app layout (dev only)
 * import { ThemeDevTools } from '@aivo/ui/components/ThemeDevTools';
 * 
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <ThemeDevTools />
 *     </>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../utils';

// Sub-components (lazy loaded for code splitting)
import { ThemePreviewPanel } from './ThemePreviewPanel';
import { AccessibilityPanel } from './AccessibilityPanel';
import { ContrastChecker } from './ContrastChecker';
import { ComponentGallery } from './ComponentGallery';
import { CSSVariableInspector } from './CSSVariableInspector';

// =============================================================================
// Types
// =============================================================================

export type DevToolsTab = 
  | 'themes' 
  | 'accessibility' 
  | 'contrast' 
  | 'components' 
  | 'variables';

export interface ThemeDevToolsProps {
  /** Initial open state */
  defaultOpen?: boolean;
  /** Initial active tab */
  defaultTab?: DevToolsTab;
  /** Position of the panel */
  position?: 'left' | 'right' | 'bottom';
  /** Keyboard shortcut to toggle (default: Ctrl+Shift+T) */
  shortcut?: string;
  /** Custom z-index */
  zIndex?: number;
}

interface DevToolsContextValue {
  isOpen: boolean;
  activeTab: DevToolsTab;
  setActiveTab: (tab: DevToolsTab) => void;
  position: 'left' | 'right' | 'bottom';
}

// =============================================================================
// Context
// =============================================================================

const DevToolsContext = createContext<DevToolsContextValue | null>(null);

export function useDevTools() {
  const context = useContext(DevToolsContext);
  if (!context) {
    throw new Error('useDevTools must be used within ThemeDevTools');
  }
  return context;
}

// =============================================================================
// Tab Configuration
// =============================================================================

const TABS: Array<{ id: DevToolsTab; label: string; icon: string; description: string }> = [
  { 
    id: 'themes', 
    label: 'Themes', 
    icon: '🎨',
    description: 'Preview and switch grade themes'
  },
  { 
    id: 'accessibility', 
    label: 'A11y', 
    icon: '♿',
    description: 'Test accessibility settings'
  },
  { 
    id: 'contrast', 
    label: 'Contrast', 
    icon: '🔍',
    description: 'Check color contrast ratios'
  },
  { 
    id: 'components', 
    label: 'Components', 
    icon: '🧩',
    description: 'View component gallery'
  },
  { 
    id: 'variables', 
    label: 'CSS Vars', 
    icon: '📋',
    description: 'Inspect CSS variables'
  },
];

// =============================================================================
// Main Component
// =============================================================================

function ThemeDevToolsImpl({
  defaultOpen = false,
  defaultTab = 'themes',
  position = 'right',
  shortcut = 'ctrl+shift+t',
  zIndex = 99999,
}: ThemeDevToolsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<DevToolsTab>(defaultTab);
  const [mounted, setMounted] = useState(false);

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Keyboard shortcut handler
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const keys = shortcut.toLowerCase().split('+');
    const ctrlRequired = keys.includes('ctrl');
    const shiftRequired = keys.includes('shift');
    const altRequired = keys.includes('alt');
    const key = keys.find(k => !['ctrl', 'shift', 'alt'].includes(k));

    if (
      event.ctrlKey === ctrlRequired &&
      event.shiftKey === shiftRequired &&
      event.altKey === altRequired &&
      event.key.toLowerCase() === key
    ) {
      event.preventDefault();
      setIsOpen(prev => !prev);
    }
  }, [shortcut]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Context value
  const contextValue: DevToolsContextValue = {
    isOpen,
    activeTab,
    setActiveTab,
    position,
  };

  // Don't render on server
  if (!mounted) return null;

  // Position classes
  const positionClasses = {
    left: 'left-0 top-0 h-full w-[420px] border-r',
    right: 'right-0 top-0 h-full w-[420px] border-l',
    bottom: 'bottom-0 left-0 right-0 h-[400px] border-t',
  };

  const slideClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full',
  };

  return createPortal(
    <DevToolsContext.Provider value={contextValue}>
      {/* Toggle Button (always visible) */}
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className={cn(
          'fixed flex items-center justify-center',
          'w-12 h-12 rounded-full',
          'bg-purple-600 text-white shadow-lg',
          'hover:bg-purple-700 active:bg-purple-800',
          'transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          position === 'right' && 'right-4 bottom-4',
          position === 'left' && 'left-4 bottom-4',
          position === 'bottom' && 'right-4 bottom-4',
          isOpen && 'rotate-45'
        )}
        style={{ zIndex }}
        aria-label={isOpen ? 'Close theme dev tools' : 'Open theme dev tools'}
        title={`Theme Dev Tools (${shortcut})`}
      >
        <span className="text-xl">⚙️</span>
      </button>

      {/* Panel */}
      <div
        className={cn(
          'fixed bg-gray-900 text-white shadow-2xl',
          'transform transition-transform duration-300 ease-in-out',
          positionClasses[position],
          slideClasses[position]
        )}
        style={{ zIndex: zIndex - 1 }}
        role="dialog"
        aria-label="Theme Development Tools"
        aria-hidden={!isOpen}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <span className="text-lg">🎨</span>
            <h2 className="font-semibold text-sm">Theme Dev Tools</h2>
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-yellow-500/20 text-yellow-400 rounded">
              DEV
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded hover:bg-gray-800 transition-colors"
            aria-label="Close panel"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap',
                'transition-colors duration-150',
                'hover:bg-gray-800',
                'focus:outline-none focus:bg-gray-800',
                activeTab === tab.id
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-800/50'
                  : 'text-gray-400'
              )}
              title={tab.description}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="overflow-auto" style={{ height: 'calc(100% - 100px)' }}>
          {activeTab === 'themes' && <ThemePreviewPanel />}
          {activeTab === 'accessibility' && <AccessibilityPanel />}
          {activeTab === 'contrast' && <ContrastChecker />}
          {activeTab === 'components' && <ComponentGallery />}
          {activeTab === 'variables' && <CSSVariableInspector />}
        </div>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm"
          style={{ zIndex: zIndex - 2 }}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}
    </DevToolsContext.Provider>,
    document.body
  );
}

// =============================================================================
// Production-Safe Export
// =============================================================================

/**
 * ThemeDevTools - Only renders in development mode.
 * In production, this is a no-op component with zero bundle size impact.
 */
export function ThemeDevTools(props: ThemeDevToolsProps) {
  // Check for development environment
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return <ThemeDevToolsImpl {...props} />;
}

// Named exports for sub-components (also dev-only)
export { ThemePreviewPanel } from './ThemePreviewPanel';
export { AccessibilityPanel } from './AccessibilityPanel';
export { ContrastChecker } from './ContrastChecker';
export { ComponentGallery } from './ComponentGallery';
export { CSSVariableInspector } from './CSSVariableInspector';
