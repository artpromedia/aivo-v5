'use client';

import { motion } from 'framer-motion';
import {
  Calculator,
  BookText,
  FlaskConical,
  Globe,
  Palette,
  Music,
  Languages,
  History,
  Code,
  Atom,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Types
// ============================================================================

interface Subject {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Icon to display */
  icon: LucideIcon;
  /** Background gradient classes */
  gradient: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of lessons available */
  lessonsCount?: number;
  /** Number of lessons completed */
  lessonsCompleted?: number;
  /** Next up lesson title */
  nextLesson?: string;
  /** Whether this subject is currently active/in-focus */
  isFocus?: boolean;
}

interface SubjectCardProps {
  /** Subject data */
  subject: Subject;
  /** Animation index for stagger effect */
  index: number;
  /** Click handler */
  onClick?: () => void;
  /** Size variant */
  size?: 'default' | 'compact';
}

interface SubjectCardsProps {
  /** List of subjects */
  subjects: Subject[];
  /** Whether data is loading */
  loading?: boolean;
  /** Click handler */
  onSubjectClick?: (subjectId: string) => void;
  /** Layout mode */
  layout?: 'scroll' | 'grid';
}

// ============================================================================
// Subject Icon Map
// ============================================================================

export const subjectIcons: Record<string, LucideIcon> = {
  math: Calculator,
  reading: BookText,
  science: FlaskConical,
  geography: Globe,
  art: Palette,
  music: Music,
  language: Languages,
  history: History,
  coding: Code,
  physics: Atom,
};

export const subjectGradients: Record<string, string> = {
  math: 'from-violet-500 to-purple-600',
  reading: 'from-emerald-500 to-teal-600',
  science: 'from-blue-500 to-indigo-600',
  geography: 'from-amber-500 to-orange-600',
  art: 'from-pink-500 to-rose-600',
  music: 'from-cyan-500 to-blue-600',
  language: 'from-red-500 to-rose-600',
  history: 'from-yellow-600 to-amber-700',
  coding: 'from-gray-700 to-gray-900',
  physics: 'from-indigo-500 to-purple-600',
};

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  progress: number;
  height?: number;
}

function ProgressBar({ progress, height = 6 }: ProgressBarProps) {
  return (
    <div className="w-full bg-white/30 rounded-full overflow-hidden" style={{ height }}>
      <motion.div
        className="h-full bg-white rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
    </div>
  );
}

// ============================================================================
// Single Subject Card Component
// ============================================================================

function SubjectCard({ subject, index, onClick, size = 'default' }: SubjectCardProps) {
  const Icon = subject.icon;
  const isCompact = size === 'compact';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="flex-shrink-0"
    >
      <Link
        href={`/subjects/${subject.id}`}
        onClick={(e) => {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }}
        className={`
          block bg-gradient-to-br ${subject.gradient} rounded-2xl shadow-lg 
          overflow-hidden relative
          ${isCompact ? 'w-36 p-3' : 'w-44 p-4'}
        `}
      >
        {/* Focus indicator */}
        {subject.isFocus && (
          <div className="absolute top-2 right-2 px-2 py-0.5 bg-white/30 rounded-full">
            <span className="text-xs text-white font-medium">Focus</span>
          </div>
        )}

        {/* Icon */}
        <div
          className={`
          bg-white/20 rounded-xl flex items-center justify-center mb-3
          ${isCompact ? 'w-10 h-10' : 'w-12 h-12'}
        `}
        >
          <Icon className={`text-white ${isCompact ? 'w-5 h-5' : 'w-6 h-6'}`} />
        </div>

        {/* Subject name */}
        <h3 className={`text-white font-bold mb-1 ${isCompact ? 'text-sm' : 'text-base'}`}>
          {subject.name}
        </h3>

        {/* Next lesson preview */}
        {subject.nextLesson && !isCompact && (
          <p className="text-white/75 text-xs mb-3 line-clamp-1">Next: {subject.nextLesson}</p>
        )}

        {/* Lessons count */}
        {subject.lessonsCount !== undefined && (
          <p className={`text-white/75 mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            {subject.lessonsCompleted ?? 0}/{subject.lessonsCount} lessons
          </p>
        )}

        {/* Progress bar */}
        <ProgressBar progress={subject.progress} height={isCompact ? 4 : 6} />

        {/* Progress text */}
        <p className={`text-white/90 mt-2 font-medium ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {subject.progress}% complete
        </p>
      </Link>
    </motion.div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function SubjectCardSkeleton({ index }: { index: number }) {
  return (
    <div
      className="flex-shrink-0 w-44 p-4 bg-gray-100 rounded-2xl animate-pulse"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      <div className="w-12 h-12 bg-gray-200 rounded-xl mb-3" />
      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-2 bg-gray-200 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

// ============================================================================
// Main Subject Cards Component
// ============================================================================

export function SubjectCards({
  subjects,
  loading = false,
  onSubjectClick,
  layout = 'scroll',
}: SubjectCardsProps) {
  if (layout === 'grid') {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 px-1">My Subjects</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SubjectCardSkeleton key={i} index={i} />)
            : subjects.map((subject, index) => (
                <SubjectCard
                  key={subject.id}
                  subject={subject}
                  index={index}
                  onClick={() => onSubjectClick?.(subject.id)}
                  size="compact"
                />
              ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-900 px-1">My Subjects</h3>
      <div
        className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SubjectCardSkeleton key={i} index={i} />)
          : subjects.map((subject, index) => (
              <SubjectCard
                key={subject.id}
                subject={subject}
                index={index}
                onClick={() => onSubjectClick?.(subject.id)}
              />
            ))}
      </div>
    </div>
  );
}

// ============================================================================
// Helper to Create Subject from ID
// ============================================================================

export function createSubject(
  id: string,
  name: string,
  progress: number,
  options?: Partial<Subject>,
): Subject {
  const normalizedId = id.toLowerCase();
  return {
    id,
    name,
    icon: subjectIcons[normalizedId] ?? BookText,
    gradient: `from-${normalizedId}-500 to-${normalizedId}-600`,
    progress,
    ...options,
    // Override gradient if we have a preset
    ...(subjectGradients[normalizedId] && {
      gradient: subjectGradients[normalizedId],
    }),
  };
}

// ============================================================================
// Sample Data for Testing
// ============================================================================

export const sampleSubjects: Subject[] = [
  {
    id: 'math',
    name: 'Math',
    icon: Calculator,
    gradient: subjectGradients.math,
    progress: 75,
    lessonsCount: 12,
    lessonsCompleted: 9,
    nextLesson: 'Fractions Intro',
    isFocus: true,
  },
  {
    id: 'reading',
    name: 'Reading',
    icon: BookText,
    gradient: subjectGradients.reading,
    progress: 45,
    lessonsCount: 8,
    lessonsCompleted: 4,
    nextLesson: 'Story Elements',
  },
  {
    id: 'science',
    name: 'Science',
    icon: FlaskConical,
    gradient: subjectGradients.science,
    progress: 30,
    lessonsCount: 10,
    lessonsCompleted: 3,
    nextLesson: 'Plant Life Cycle',
  },
  {
    id: 'art',
    name: 'Art',
    icon: Palette,
    gradient: subjectGradients.art,
    progress: 60,
    lessonsCount: 6,
    lessonsCompleted: 4,
    nextLesson: 'Color Theory',
  },
];

// ============================================================================
// Exports
// ============================================================================

export type { SubjectCardsProps, Subject, SubjectCardProps };
