'use client';

import { motion } from 'framer-motion';
import { Award, BookOpen, Flame, Trophy, Star, Clock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface StatData {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Numeric value */
  value: number;
  /** Optional suffix (e.g., "pts", "min") */
  suffix?: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Background color class */
  bgColor: string;
  /** Icon color class */
  iconColor: string;
}

interface QuickStatsRowProps {
  /** Total score/XP earned */
  score?: number;
  /** Number of lessons completed */
  lessonsCompleted?: number;
  /** Current streak (days) */
  streak?: number;
  /** Whether data is loading */
  loading?: boolean;
  /** Custom stats to display (overrides defaults) */
  customStats?: StatData[];
}

// ============================================================================
// Default Stats Configuration
// ============================================================================

function getDefaultStats(score: number, lessonsCompleted: number, streak: number): StatData[] {
  return [
    {
      id: 'score',
      label: 'Score',
      value: score,
      suffix: 'pts',
      icon: Trophy,
      bgColor: 'bg-gradient-to-br from-amber-100 to-amber-50',
      iconColor: 'text-amber-500',
    },
    {
      id: 'lessons',
      label: 'Lessons',
      value: lessonsCompleted,
      icon: BookOpen,
      bgColor: 'bg-gradient-to-br from-blue-100 to-blue-50',
      iconColor: 'text-blue-500',
    },
    {
      id: 'streak',
      label: 'Streak',
      value: streak,
      suffix: 'days',
      icon: Flame,
      bgColor: 'bg-gradient-to-br from-orange-100 to-orange-50',
      iconColor: 'text-orange-500',
    },
  ];
}

// ============================================================================
// Animated Counter Hook
// ============================================================================

import { useEffect, useState, useRef } from 'react';

function useAnimatedValue(value: number, duration: number = 800): number {
  const [displayValue, setDisplayValue] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    startTimeRef.current = null;

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(eased * value));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [value, duration]);

  return displayValue;
}

// ============================================================================
// Single Stat Card Component
// ============================================================================

interface StatCardProps {
  stat: StatData;
  index: number;
  loading?: boolean;
}

function StatCard({ stat, index, loading = false }: StatCardProps) {
  const animatedValue = useAnimatedValue(loading ? 0 : stat.value, 800 + index * 100);
  const Icon = stat.icon;

  if (loading) {
    return (
      <div className="flex-1 min-w-0 bg-gray-100 rounded-2xl p-4 animate-pulse">
        <div className="w-10 h-10 rounded-xl bg-gray-200 mb-3" />
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-1" />
        <div className="h-4 bg-gray-200 rounded w-2/3" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`flex-1 min-w-0 ${stat.bgColor} rounded-2xl p-4 shadow-sm cursor-pointer`}
    >
      {/* Icon */}
      <div
        className={`w-10 h-10 rounded-xl bg-white/60 flex items-center justify-center mb-3 ${stat.iconColor}`}
      >
        <Icon className="w-5 h-5" />
      </div>

      {/* Value */}
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900">{animatedValue}</span>
        {stat.suffix && <span className="text-sm text-gray-500">{stat.suffix}</span>}
      </div>

      {/* Label */}
      <span className="text-sm text-gray-600">{stat.label}</span>
    </motion.div>
  );
}

// ============================================================================
// Main Quick Stats Row Component
// ============================================================================

export function QuickStatsRow({
  score = 0,
  lessonsCompleted = 0,
  streak = 0,
  loading = false,
  customStats,
}: QuickStatsRowProps) {
  const stats = customStats ?? getDefaultStats(score, lessonsCompleted, streak);

  return (
    <div className="flex gap-3">
      {stats.map((stat, index) => (
        <StatCard key={stat.id} stat={stat} index={index} loading={loading} />
      ))}
    </div>
  );
}

// ============================================================================
// Preset Stat Configurations
// ============================================================================

export const presetIcons = {
  score: Trophy,
  lessons: BookOpen,
  streak: Flame,
  award: Award,
  star: Star,
  time: Clock,
};

// ============================================================================
// Exports
// ============================================================================

export type { QuickStatsRowProps, StatData };
