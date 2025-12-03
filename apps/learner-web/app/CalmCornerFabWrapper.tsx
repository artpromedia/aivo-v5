'use client';

import { usePathname } from 'next/navigation';
import { CalmCornerFab } from '../components';
import { useBreakHandler } from '../components/providers';

/**
 * Routes where the Calm Corner FAB should be displayed.
 * These are pages where learners might benefit from quick access to regulation tools.
 */
const FAB_ENABLED_ROUTES = [
  '/session',
  '/homework',
  '/lesson',
  '/practice',
  '/assessment',
  '/quiz',
];

/**
 * Routes where the FAB should NOT appear (even if they start with an enabled route).
 */
const FAB_DISABLED_ROUTES = [
  '/focus-break', // Already in a break activity
  '/regulation', // Already in calm corner
  '/calm-corner', // Already in calm corner
];

/**
 * Wrapper component that conditionally renders the CalmCornerFab
 * based on the current route. Only shows on learning activity pages
 * where a break might be beneficial.
 */
export function CalmCornerFabWrapper() {
  const pathname = usePathname();
  const { breakSuggested, focusScore, startBreak } = useBreakHandler();

  // Check if current route is explicitly disabled
  const isDisabledRoute = FAB_DISABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (isDisabledRoute) {
    return null;
  }

  // Check if current route matches any enabled route
  const isEnabledRoute = FAB_ENABLED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  if (!isEnabledRoute) {
    return null;
  }

  const handleBreakTaken = () => {
    startBreak();
    // completeBreak will be called when user finishes their break activity
    // For now, we'll call it after a short delay as a placeholder
    // In production, this would be called by the break activity component
  };

  return (
    <CalmCornerFab
      breakSuggested={breakSuggested}
      focusScore={focusScore}
      onBreakTaken={handleBreakTaken}
    />
  );
}
