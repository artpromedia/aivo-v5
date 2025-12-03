'use client';

import Link from 'next/link';
import type { IEPGoal } from '../../types/iep';
import { CATEGORY_CONFIG, calculateProgress, needsAttention } from '../../types/iep';
import { ChevronRight } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface IEPGoalCardCompactProps {
  goal: IEPGoal;
  onClick?: () => void;
}

// ============================================================================
// Compact Goal Card Component
// ============================================================================

export function IEPGoalCardCompact({ goal, onClick }: IEPGoalCardCompactProps) {
  const category = CATEGORY_CONFIG[goal.category];
  const progress = calculateProgress(goal);
  const attention = needsAttention(goal);
  const isOnTrack = goal.status === 'on_track' || goal.status === 'achieved';

  const cardClasses = `flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 transition-all hover:shadow-md ${
    onClick ? 'cursor-pointer' : ''
  }`;

  const cardInner = (
    <>
      {/* Category emoji */}
      <div
        className={`w-10 h-10 ${category.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
      >
        <span className="text-lg">{category.emoji}</span>
      </div>

      {/* Goal info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-gray-900 truncate">{goal.name}</h4>
        <div className="flex items-center gap-2 mt-1">
          {/* Mini progress bar */}
          <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
          <span
            className={`text-xs font-semibold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {progress.toFixed(0)}%
          </span>
          {attention && <span className="text-xs text-amber-500">⚠️</span>}
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
    </>
  );

  // Wrap in button if onClick handler is provided
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cardClasses} w-full text-left`}>
        {cardInner}
      </button>
    );
  }

  // Wrap in Link if no onClick handler
  return (
    <Link href={`/iep/${goal.id}`} className={`block ${cardClasses}`}>
      {cardInner}
    </Link>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPGoalCardCompactSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100 animate-pulse">
      <div className="w-10 h-10 bg-gray-100 rounded-lg flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full" />
          <div className="h-3 w-8 bg-gray-100 rounded" />
        </div>
      </div>
      <div className="w-5 h-5 bg-gray-100 rounded flex-shrink-0" />
    </div>
  );
}
