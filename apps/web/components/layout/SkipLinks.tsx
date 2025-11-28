'use client';

/**
 * SkipLinks Component
 * 
 * Provides keyboard-accessible skip links for navigating directly to main content.
 * Essential for WCAG 2.1 AA compliance - allows keyboard and screen reader users
 * to bypass repetitive navigation elements.
 * 
 * These links are visually hidden until focused, then appear prominently.
 */
export function SkipLinks() {
  return (
    <div className="skip-links">
      {/* Skip to main content */}
      <a
        href="#main-content"
        className="
          sr-only focus:not-sr-only
          fixed top-0 left-0 z-[100]
          px-4 py-3 m-2
          bg-indigo-600 text-white font-medium text-sm
          rounded-md shadow-lg
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600
          transition-transform duration-200
          -translate-y-full focus:translate-y-0
        "
      >
        Skip to main content
      </a>
      
      {/* Skip to navigation */}
      <a
        href="#main-navigation"
        className="
          sr-only focus:not-sr-only
          fixed top-0 left-48 z-[100]
          px-4 py-3 m-2
          bg-indigo-600 text-white font-medium text-sm
          rounded-md shadow-lg
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600
          transition-transform duration-200
          -translate-y-full focus:translate-y-0
        "
      >
        Skip to navigation
      </a>
      
      {/* Skip to footer - useful for long pages */}
      <a
        href="#footer"
        className="
          sr-only focus:not-sr-only
          fixed top-0 left-96 z-[100]
          px-4 py-3 m-2
          bg-indigo-600 text-white font-medium text-sm
          rounded-md shadow-lg
          focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-indigo-600
          transition-transform duration-200
          -translate-y-full focus:translate-y-0
        "
      >
        Skip to footer
      </a>
    </div>
  );
}

/**
 * MainContent wrapper component
 * Provides the target for "Skip to main content" link
 */
export function MainContent({ children }: { children: React.ReactNode }) {
  return (
    <main 
      id="main-content" 
      tabIndex={-1}
      className="outline-none focus:outline-none"
      role="main"
      aria-label="Main content"
    >
      {children}
    </main>
  );
}

/**
 * MainNavigation wrapper component
 * Provides the target for "Skip to navigation" link
 */
export function MainNavigation({ children }: { children: React.ReactNode }) {
  return (
    <nav 
      id="main-navigation" 
      tabIndex={-1}
      className="outline-none focus:outline-none"
      role="navigation"
      aria-label="Main navigation"
    >
      {children}
    </nav>
  );
}

/**
 * Footer wrapper component
 * Provides the target for "Skip to footer" link
 */
export function Footer({ children }: { children: React.ReactNode }) {
  return (
    <footer 
      id="footer" 
      tabIndex={-1}
      className="outline-none focus:outline-none"
      role="contentinfo"
      aria-label="Site footer"
    >
      {children}
    </footer>
  );
}

export default SkipLinks;
