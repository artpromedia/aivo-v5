'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, BookOpen, MessageCircle, User, Sparkles } from 'lucide-react';

/**
 * Navigation item configuration
 */
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  emoji: string;
  /** Whether this is the center FAB-style button */
  isCenter?: boolean;
}

const navItems: NavItem[] = [
  {
    href: '/',
    label: 'Home',
    icon: Home,
    emoji: '🏠',
  },
  {
    href: '/session',
    label: 'Learn',
    icon: BookOpen,
    emoji: '📚',
  },
  {
    href: '/regulation',
    label: 'Calm',
    icon: Sparkles,
    emoji: '🧘',
    isCenter: true,
  },
  {
    href: '/tutor',
    label: 'Chat',
    icon: MessageCircle,
    emoji: '💬',
  },
  {
    href: '/sensory',
    label: 'Settings',
    icon: User,
    emoji: '👤',
  },
];

/**
 * Bottom Navigation Bar Component
 *
 * A persistent bottom navigation bar for the learner-web app that matches
 * the Flutter learner app's navigation pattern. Features:
 * - 5 tabs: Home, Learn, Calm Corner (centered FAB), Chat, Settings
 * - Active tab highlighting with theme colors
 * - Elevated center button for Calm Corner
 * - Grade-aware theming support
 * - Responsive design with smooth transitions
 */
export function BottomNavigation() {
  const pathname = usePathname();

  /**
   * Check if a nav item is currently active
   */
  const isActive = (href: string): boolean => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20 sm:h-24" aria-hidden="true" />

      {/* Fixed Bottom Navigation */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-theme-surface-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)]"
        role="navigation"
        aria-label="Main navigation"
      >
        {/* Safe area padding for mobile devices */}
        <div className="pb-safe">
          <div className="flex items-center justify-around px-2 py-2 max-w-lg mx-auto">
            {navItems.map((item) => (
              <NavButton key={item.href} item={item} isActive={isActive(item.href)} />
            ))}
          </div>
        </div>
      </nav>
    </>
  );
}

/**
 * Individual navigation button component
 */
interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
}

function NavButton({ item, isActive }: NavButtonProps) {
  const Icon = item.icon;

  // Center Calm Corner button - elevated FAB style
  if (item.isCenter) {
    return (
      <Link
        href={item.href}
        className={`
          relative -mt-8 flex flex-col items-center justify-center
          w-16 h-16 rounded-2xl
          bg-gradient-to-br from-mint to-mint-dark
          shadow-lg shadow-mint/40
          transition-all duration-300 ease-out
          hover:scale-105 hover:shadow-xl hover:shadow-mint/50
          active:scale-95
          focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint focus-visible:ring-offset-2
          group
        `}
        aria-label={item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Animated glow effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-mint-light/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Icon/Emoji */}
        <span className="text-2xl relative z-10" aria-hidden="true">
          {item.emoji}
        </span>

        {/* Label */}
        <span className="text-[10px] font-semibold text-white relative z-10 mt-0.5">
          {item.label}
        </span>
      </Link>
    );
  }

  // Regular navigation buttons
  return (
    <Link
      href={item.href}
      className={`
        flex flex-col items-center justify-center
        min-w-[56px] min-h-[56px] px-2 py-1.5
        rounded-xl
        transition-all duration-200 ease-out
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-theme-primary focus-visible:ring-offset-2
        ${
          isActive
            ? 'bg-theme-primary/10'
            : 'hover:bg-theme-surface active:bg-theme-surface-border/50'
        }
      `}
      aria-label={item.label}
      aria-current={isActive ? 'page' : undefined}
    >
      {/* Icon container */}
      <div
        className={`
          flex items-center justify-center w-7 h-7 rounded-lg
          transition-all duration-200
          ${isActive ? 'scale-110' : ''}
        `}
      >
        {/* Show emoji when active, icon when inactive for visual variety */}
        {isActive ? (
          <span className="text-xl" aria-hidden="true">
            {item.emoji}
          </span>
        ) : (
          <Icon
            className={`
              w-5 h-5 transition-colors duration-200
              ${isActive ? 'text-theme-primary' : 'text-theme-text-muted'}
            `}
            strokeWidth={isActive ? 2.5 : 2}
            aria-hidden="true"
          />
        )}
      </div>

      {/* Label */}
      <span
        className={`
          text-[10px] font-medium mt-0.5
          transition-colors duration-200
          ${isActive ? 'text-theme-primary font-semibold' : 'text-theme-text-muted'}
        `}
      >
        {item.label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-theme-primary animate-in fade-in duration-200" />
      )}
    </Link>
  );
}

export default BottomNavigation;
