'use client';

import { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface BreakReminderBannerProps {
  /** Whether the banner is visible */
  isVisible: boolean;
  /** Called when user clicks "Take a Break" */
  onTakeBreak: () => void;
  /** Called when user dismisses the banner */
  onDismiss: () => void;
  /** Whether to reduce motion for accessibility */
  reduceMotion?: boolean;
  /** Custom break destination (default: /focus-break) */
  breakDestination?: string;
  /** Snooze duration in minutes to display (optional) */
  snoozeDurationMinutes?: number;
}

// ============================================================================
// Messages
// ============================================================================

const BREAK_MESSAGES = [
  {
    title: 'Time for a quick break! 🌟',
    subtitle: 'Taking short breaks helps your brain learn better.',
  },
  {
    title: 'Your brain deserves a rest! 🧠',
    subtitle: 'A short break now will help you focus better later.',
  },
  {
    title: 'Break time? 🎮',
    subtitle: 'Fun brain breaks help you remember what you learned!',
  },
  {
    title: 'How about a breather? 🌬️',
    subtitle: 'Stepping away for a moment can spark new ideas.',
  },
];

// Get a consistent message based on the hour (so it doesn't change rapidly)
function getBreakMessage() {
  const hour = new Date().getHours();
  const index = hour % BREAK_MESSAGES.length;
  return BREAK_MESSAGES[index];
}

// ============================================================================
// Component
// ============================================================================

export function BreakReminderBanner({
  isVisible,
  onTakeBreak,
  onDismiss,
  reduceMotion = false,
  breakDestination = '/focus-break',
  snoozeDurationMinutes = 10,
}: BreakReminderBannerProps) {
  const message = getBreakMessage();

  const handleTakeBreak = useCallback(() => {
    onTakeBreak();
  }, [onTakeBreak]);

  const handleDismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  // Animation variants
  const bannerVariants = {
    hidden: {
      y: -100,
      opacity: 0,
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: reduceMotion
        ? { duration: 0.1 }
        : { type: 'spring', damping: 20, stiffness: 300 },
    },
    exit: {
      y: -100,
      opacity: 0,
      transition: { duration: reduceMotion ? 0.1 : 0.2 },
    },
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.02, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    static: {
      scale: 1,
    },
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={bannerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className="w-full px-4 pt-4 pb-2"
        >
          <motion.div
            variants={pulseVariants}
            animate={reduceMotion ? 'static' : 'pulse'}
            className="relative overflow-hidden rounded-2xl shadow-lg"
          >
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-mint)] via-[#7DD3C0] to-[var(--color-sky)]" />

            {/* Decorative sparkles */}
            <div className="absolute top-2 right-12 opacity-30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-2 left-8 opacity-20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="relative px-4 py-4 sm:px-6">
              <div className="flex items-start gap-3">
                {/* Emoji icon */}
                <div className="flex-shrink-0 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧘</span>
                </div>

                {/* Message */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white">{message.title}</h3>
                  <p className="text-sm text-white/90 mt-0.5">{message.subtitle}</p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Link
                      href={breakDestination}
                      onClick={handleTakeBreak}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white rounded-full text-sm font-semibold text-[var(--color-primary)] hover:bg-white/90 transition-colors shadow-sm"
                    >
                      <span>🎮</span>
                      <span>Take a Break</span>
                    </Link>

                    <button
                      onClick={handleDismiss}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white hover:bg-white/30 transition-colors"
                    >
                      <span>⏰</span>
                      <span>Remind me in {snoozeDurationMinutes}m</span>
                    </button>
                  </div>
                </div>

                {/* Dismiss button */}
                <button
                  onClick={handleDismiss}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors"
                  aria-label="Dismiss reminder"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactBreakReminderProps {
  isVisible: boolean;
  onTakeBreak: () => void;
  onDismiss: () => void;
}

/**
 * A more compact break reminder for smaller spaces
 */
export function CompactBreakReminder({
  isVisible,
  onTakeBreak,
  onDismiss,
}: CompactBreakReminderProps) {
  if (!isVisible) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-[var(--color-mint)]/20 to-[var(--color-sky)]/20 rounded-xl border border-[var(--color-mint)]/30">
      <span className="text-xl">🧘</span>
      <p className="flex-1 text-sm text-gray-700">Ready for a quick brain break?</p>
      <Link
        href="/focus-break"
        onClick={onTakeBreak}
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        Take a break
      </Link>
      <button
        onClick={onDismiss}
        className="text-gray-400 hover:text-gray-600"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { BreakReminderBannerProps, CompactBreakReminderProps };
