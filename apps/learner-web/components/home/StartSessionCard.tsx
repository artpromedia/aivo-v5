'use client';

import { motion } from 'framer-motion';
import { Play, Clock, Sparkles, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface StartSessionCardProps {
  /** Whether a session is ready to start */
  ready?: boolean;
  /** Focus subject for the session */
  focusSubject?: string;
  /** Estimated session duration in minutes */
  estimatedMinutes?: number;
  /** Number of activities in the session */
  activitiesCount?: number;
  /** Whether the user has a streak going */
  hasStreak?: boolean;
  /** Click handler for starting session */
  onStart?: () => void;
  /** Whether data is loading */
  loading?: boolean;
  /** Custom CTA text */
  ctaText?: string;
  /** Session route (default: /session) */
  href?: string;
}

// ============================================================================
// Floating Particles Animation
// ============================================================================

// Pre-generated particle configurations to avoid Math.random during render
const PARTICLE_CONFIGS = [
  { x: '15%', scale: 0.7, duration: 3.5 },
  { x: '35%', scale: 0.9, duration: 4.2 },
  { x: '55%', scale: 0.6, duration: 3.8 },
  { x: '70%', scale: 0.8, duration: 4.5 },
  { x: '85%', scale: 0.5, duration: 3.2 },
  { x: '25%', scale: 0.75, duration: 4.0 },
];

function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {PARTICLE_CONFIGS.map((config, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white/20 rounded-full"
          initial={{
            x: config.x,
            y: '100%',
            scale: config.scale,
          }}
          animate={{
            y: '-20%',
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: config.duration,
            repeat: Infinity,
            delay: i * 0.5,
            ease: 'linear',
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// Main Start Session Card Component
// ============================================================================

export function StartSessionCard({
  ready = true,
  focusSubject,
  estimatedMinutes = 15,
  activitiesCount = 3,
  hasStreak = false,
  onStart,
  loading = false,
  ctaText,
  href = '/session',
}: StartSessionCardProps) {
  const displayCta = ctaText ?? (ready ? 'Start Learning' : 'Continue Session');

  if (loading) {
    return (
      <div className="bg-gray-100 rounded-3xl p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-3" />
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4" />
        <div className="h-14 bg-gray-200 rounded-2xl w-full" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden"
    >
      <div className="bg-gradient-to-br from-[var(--color-primary)] via-violet-600 to-purple-700 rounded-3xl p-6 shadow-xl">
        {/* Background decoration */}
        <FloatingParticles />

        {/* Streak badge */}
        {hasStreak && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring' }}
            className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-orange-400/90 rounded-full"
          >
            <Zap className="w-4 h-4 text-white" fill="currentColor" />
            <span className="text-sm font-semibold text-white">On Fire!</span>
          </motion.div>
        )}

        {/* Content */}
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-yellow-300" />
            <span className="text-yellow-200 text-sm font-medium">Ready to learn?</span>
          </div>

          {/* Main title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {focusSubject ? `Let's practice ${focusSubject}!` : 'Your next adventure awaits!'}
          </h2>

          {/* Session info */}
          <div className="flex items-center gap-4 mb-5">
            <div className="flex items-center gap-1.5 text-white/80">
              <Clock className="w-4 h-4" />
              <span className="text-sm">~{estimatedMinutes} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-white/80">
              <span className="text-sm">{activitiesCount} activities</span>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href={href}
            onClick={(e) => {
              if (onStart) {
                e.preventDefault();
                onStart();
              }
            }}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-white text-violet-600 font-bold py-4 px-6 rounded-2xl shadow-lg"
            >
              <Play className="w-5 h-5" fill="currentColor" />
              <span>{displayCta}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </Link>

          {/* Encouragement text */}
          <p className="text-center text-white/60 text-xs mt-3">
            {hasStreak ? 'Keep your streak going! 🔥' : 'Every session makes you stronger! 💪'}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// Compact Variant
// ============================================================================

interface CompactStartButtonProps {
  focusSubject?: string;
  onClick?: () => void;
  href?: string;
}

export function CompactStartButton({
  focusSubject,
  onClick,
  href = '/session',
}: CompactStartButtonProps) {
  return (
    <Link
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-between bg-gradient-to-r from-[var(--color-primary)] to-violet-600 text-white font-semibold py-3 px-5 rounded-2xl shadow-md"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Play className="w-5 h-5" fill="currentColor" />
          </div>
          <div className="text-left">
            <span className="text-sm text-white/80">Continue with</span>
            <p className="font-bold">{focusSubject ?? 'Next Lesson'}</p>
          </div>
        </div>
        <ArrowRight className="w-5 h-5" />
      </motion.button>
    </Link>
  );
}

// ============================================================================
// Exports
// ============================================================================

export type { StartSessionCardProps, CompactStartButtonProps };
