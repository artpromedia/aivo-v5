'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface CalmCornerFabProps {
  /** Whether a break is currently suggested based on focus monitoring */
  breakSuggested?: boolean;
  /** Current focus score (0-100) */
  focusScore?: number;
  /** Callback when user takes a break */
  onBreakTaken?: () => void;
  /** Whether to use compact mode (smaller screens) */
  compact?: boolean;
  /** Whether to disable animations (sensory profile preference) */
  reduceMotion?: boolean;
}

interface OptionTileProps {
  emoji: string;
  title: string;
  subtitle: string;
  href: string;
  colorClass: string;
  onClick?: () => void;
}

// ============================================================================
// Helper Components
// ============================================================================

function OptionTile({ emoji, title, subtitle, href, colorClass, onClick }: OptionTileProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:scale-[1.02] active:scale-[0.98] ${colorClass}`}
    >
      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
        <span className="text-2xl">{emoji}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-base text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 truncate">{subtitle}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </Link>
  );
}

function FocusScoreIndicator({ score }: { score: number }) {
  const getScoreColor = useCallback(() => {
    if (score >= 80) return { ring: 'stroke-green-500', text: 'text-green-500' };
    if (score >= 60)
      return { ring: 'stroke-[var(--color-mint)]', text: 'text-[var(--color-mint)]' };
    if (score >= 40)
      return { ring: 'stroke-[var(--color-sunshine)]', text: 'text-[var(--color-sunshine)]' };
    return { ring: 'stroke-[var(--color-coral)]', text: 'text-[var(--color-coral)]' };
  }, [score]);

  const getFocusMessage = useCallback(() => {
    if (score >= 80) return 'Great focus! Keep it up! 🌟';
    if (score >= 60) return 'Doing well! A short break might help.';
    if (score >= 40) return 'Time for a brain break! 🧠';
    return "Let's recharge with a fun activity!";
  }, [score]);

  const colors = getScoreColor();
  const circumference = 2 * Math.PI * 24;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
      <div className="relative w-14 h-14 flex-shrink-0">
        <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
          <circle cx="28" cy="28" r="24" fill="none" strokeWidth="6" className="stroke-gray-200" />
          <circle
            cx="28"
            cy="28"
            r="24"
            fill="none"
            strokeWidth="6"
            strokeLinecap="round"
            className={colors.ring}
            style={{
              strokeDasharray: circumference,
              strokeDashoffset,
              transition: 'stroke-dashoffset 0.5s ease-out',
            }}
          />
        </svg>
        <div
          className={`absolute inset-0 flex items-center justify-center font-bold ${colors.text}`}
        >
          {Math.round(score)}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">Focus Level</p>
        <p className="text-sm text-gray-600">{getFocusMessage()}</p>
      </div>
    </div>
  );
}

// ============================================================================
// Bottom Sheet Component
// ============================================================================

interface CalmCornerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  focusScore?: number;
  onBreakTaken?: () => void;
}

function CalmCornerSheet({ isOpen, onClose, focusScore, onBreakTaken }: CalmCornerSheetProps) {
  const handleOptionClick = useCallback(() => {
    onClose();
    onBreakTaken?.();
  }, [onClose, onBreakTaken]);

  // Lock body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Content */}
            <div className="px-5 pb-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">🧘</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Calm Corner</h2>
                    <p className="text-sm text-gray-600">Take a moment for yourself</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Options */}
              <div className="space-y-3 mb-6">
                <OptionTile
                  emoji="🎮"
                  title="Play a Game"
                  subtitle="Fun brain breaks to refresh your mind"
                  href="/focus-break"
                  colorClass="bg-[var(--color-primary)]/10 border-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/15"
                  onClick={handleOptionClick}
                />

                <OptionTile
                  emoji="🌬️"
                  title="Breathing Exercise"
                  subtitle="Calm breathing to relax"
                  href="/regulation?activity=breathing"
                  colorClass="bg-[var(--color-sky)]/10 border-[var(--color-sky)]/20 hover:bg-[var(--color-sky)]/15"
                  onClick={handleOptionClick}
                />

                <OptionTile
                  emoji="🎨"
                  title="Full Calm Corner"
                  subtitle="All tools and activities"
                  href="/regulation"
                  colorClass="bg-[var(--color-mint)]/10 border-[var(--color-mint)]/20 hover:bg-[var(--color-mint)]/15"
                  onClick={handleOptionClick}
                />
              </div>

              {/* Focus Score (if available) */}
              {focusScore !== undefined && <FocusScoreIndicator score={focusScore} />}
            </div>

            {/* Safe area padding for mobile */}
            <div className="h-safe-area-inset-bottom" />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================================================
// Main FAB Component
// ============================================================================

export function CalmCornerFab({
  breakSuggested = false,
  focusScore,
  onBreakTaken,
  compact = false,
  reduceMotion = false,
}: CalmCornerFabProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleFabClick = useCallback(() => {
    setIsSheetOpen(true);
  }, []);

  const handleCloseSheet = useCallback(() => {
    setIsSheetOpen(false);
  }, []);

  // Animation variants
  const pulseVariants = {
    idle: {
      scale: [1, 1.05, 1],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    suggesting: {
      scale: [1, 1.12, 1],
      transition: {
        duration: 1.2,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
    static: {
      scale: 1,
    },
  };

  const glowVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: [0.4, 0.7, 0.4],
      scale: [1, 1.3, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  };

  const getAnimationState = () => {
    if (reduceMotion) return 'static';
    if (breakSuggested) return 'suggesting';
    return 'idle';
  };

  // Compact version for smaller screens
  if (compact) {
    return (
      <>
        <motion.button
          onClick={handleFabClick}
          className={`
            fixed bottom-20 right-4 z-30
            w-12 h-12 rounded-full shadow-lg
            flex items-center justify-center
            transition-colors
            ${breakSuggested ? 'bg-[var(--color-coral)]' : 'bg-[var(--color-mint)]'}
          `}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Open Calm Corner"
        >
          {breakSuggested ? (
            <span className="text-white text-lg">❗</span>
          ) : (
            <span className="text-xl">🧘</span>
          )}
        </motion.button>

        <CalmCornerSheet
          isOpen={isSheetOpen}
          onClose={handleCloseSheet}
          focusScore={focusScore}
          onBreakTaken={onBreakTaken}
        />
      </>
    );
  }

  // Full version
  return (
    <>
      <div className="fixed bottom-20 right-4 z-30 sm:bottom-24 sm:right-6">
        {/* Glow effect when break suggested */}
        <AnimatePresence>
          {breakSuggested && !reduceMotion && (
            <motion.div
              variants={glowVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="absolute inset-0 rounded-full bg-[var(--color-mint)] blur-md"
            />
          )}
        </AnimatePresence>

        {/* Main FAB button */}
        <motion.button
          onClick={handleFabClick}
          variants={pulseVariants}
          animate={getAnimationState()}
          whileHover={{ scale: reduceMotion ? 1.02 : 1.08 }}
          whileTap={{ scale: 0.95 }}
          className={`
            relative flex items-center gap-2 px-4 py-3 rounded-full
            font-semibold shadow-lg
            transition-colors
            ${
              breakSuggested
                ? 'bg-[var(--color-mint)] text-gray-900 shadow-[var(--color-mint)]/30'
                : 'bg-[var(--color-mint)]/90 text-gray-800'
            }
          `}
          aria-label={breakSuggested ? 'Take a break' : 'Open Calm Corner'}
        >
          <span className="text-xl">🧘</span>
          <span className="hidden sm:inline">
            {breakSuggested ? 'Take a Break' : 'Calm Corner'}
          </span>

          {/* Notification badge when break is suggested */}
          {breakSuggested && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[var(--color-coral)] border-2 border-white flex items-center justify-center"
            >
              <span className="text-white text-xs font-bold">!</span>
            </motion.div>
          )}

          {/* Focus score badge (when not suggesting break) */}
          {!breakSuggested && focusScore !== undefined && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={`
                absolute -top-1 -right-1 w-6 h-6 rounded-full border-2 border-white
                flex items-center justify-center text-xs font-bold text-white
                ${focusScore >= 60 ? 'bg-green-500' : 'bg-[var(--color-sunshine)]'}
              `}
            >
              {Math.round(focusScore / 10)}
            </motion.div>
          )}
        </motion.button>
      </div>

      <CalmCornerSheet
        isOpen={isSheetOpen}
        onClose={handleCloseSheet}
        focusScore={focusScore}
        onBreakTaken={onBreakTaken}
      />
    </>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { CalmCornerFabProps };
