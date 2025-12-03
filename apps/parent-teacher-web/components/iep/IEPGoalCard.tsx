'use client';

import Link from 'next/link';
import type { IEPGoal } from '../../types/iep';
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  calculateProgress,
  needsAttention,
  getDaysUntilTarget,
  getLatestDataPoint,
  formatRelativeDate,
} from '../../types/iep';
import { ChevronRight, TrendingUp, Calendar, FileText } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface IEPGoalCardProps {
  goal: IEPGoal;
  showDetails?: boolean;
  onClick?: () => void;
}

// ============================================================================
// Progress Bar Component
// ============================================================================

function ProgressBar({ progress, isOnTrack }: { progress: number; isOnTrack: boolean }) {
  const colorClass = isOnTrack ? 'bg-emerald-500' : 'bg-amber-500';

  return (
    <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`absolute left-0 top-0 h-full ${colorClass} rounded-full transition-all duration-300`}
        style={{ width: `${Math.min(100, progress)}%` }}
      />
      {/* Target marker */}
      <div className="absolute top-0 w-0.5 h-3 bg-gray-800 -mt-0.5" style={{ right: 0 }} />
    </div>
  );
}

// ============================================================================
// Main Goal Card Component
// ============================================================================

export function IEPGoalCard({ goal, showDetails = true, onClick }: IEPGoalCardProps) {
  const category = CATEGORY_CONFIG[goal.category];
  const status = STATUS_CONFIG[goal.status];
  const progress = calculateProgress(goal);
  const attention = needsAttention(goal);
  const daysUntil = getDaysUntilTarget(goal);
  const latestData = getLatestDataPoint(goal);
  const isOnTrack = goal.status === 'on_track' || goal.status === 'achieved';

  const cardClasses = `bg-white rounded-2xl shadow-lg overflow-hidden transition-all hover:shadow-xl ${
    onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
  }`;

  const cardInner = (
    <>
      {/* Header with category and status */}
      <div className={`px-4 py-3 ${category.bgColor}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
              <span className="text-lg">{category.emoji}</span>
            </div>
            <div>
              <p className={`text-xs font-semibold ${category.color} uppercase tracking-wide`}>
                {category.label}
              </p>
              {goal.subject && <p className="text-xs text-gray-500">{goal.subject}</p>}
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
              attention && goal.status === 'on_track'
                ? 'bg-amber-200 text-amber-800 border border-amber-300'
                : `${status.bgColor} ${status.color}`
            }`}
          >
            {attention && goal.status === 'on_track' ? (
              <>
                <span>⚠️</span>
                <span>Needs Attention</span>
              </>
            ) : (
              <>
                {goal.status === 'achieved' && <span>✓</span>}
                <span>{status.label}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Goal content */}
      <div className="p-4">
        {/* Goal name */}
        <h3 className="text-base font-bold text-gray-900 mb-1">{goal.name}</h3>

        {showDetails && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">{goal.description}</p>
        )}

        {/* Progress section */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-gray-500">Progress</span>
            <span
              className={`text-xs font-bold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}
            >
              {progress.toFixed(0)}%
            </span>
          </div>
          <ProgressBar progress={progress} isOnTrack={isOnTrack} />
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              Current: {goal.currentValue.toFixed(1)} {goal.unit}
            </span>
            <span>
              Target: {goal.targetValue.toFixed(1)} {goal.unit}
            </span>
          </div>
        </div>

        {/* Footer stats */}
        {showDetails && (
          <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
            {/* Days until target */}
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-gray-400" />
              <span
                className={`text-xs ${
                  daysUntil < 0
                    ? 'text-red-600'
                    : daysUntil <= 7
                      ? 'text-amber-600'
                      : 'text-gray-500'
                }`}
              >
                {daysUntil > 0
                  ? `${daysUntil} days left`
                  : daysUntil === 0
                    ? 'Due today'
                    : `${-daysUntil} days overdue`}
              </span>
            </div>

            {/* Last updated */}
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-400" />
              <span className="text-xs text-gray-500">
                {latestData
                  ? `Updated ${formatRelativeDate(latestData.measurementDate)}`
                  : 'No data yet'}
              </span>
            </div>

            {/* Data points count */}
            <div className="ml-auto flex items-center gap-1.5 px-2 py-1 bg-violet-50 rounded-lg">
              <TrendingUp className="w-3.5 h-3.5 text-violet-600" />
              <span className="text-xs font-semibold text-violet-600">
                {goal.dataPoints.length}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Chevron indicator if clickable */}
      {onClick && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <ChevronRight className="w-5 h-5 text-gray-300" />
        </div>
      )}
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

export function IEPGoalCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden animate-pulse">
      {/* Header skeleton */}
      <div className="px-4 py-3 bg-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gray-200 rounded-lg" />
            <div className="space-y-1.5">
              <div className="h-3 w-16 bg-gray-200 rounded" />
              <div className="h-2.5 w-12 bg-gray-200 rounded" />
            </div>
          </div>
          <div className="h-5 w-20 bg-gray-200 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-4">
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
        <div className="space-y-1.5">
          <div className="h-3 w-full bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
        <div className="h-2 w-full bg-gray-100 rounded" />
        <div className="flex justify-between">
          <div className="h-2.5 w-24 bg-gray-100 rounded" />
          <div className="h-2.5 w-24 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}
