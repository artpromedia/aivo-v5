'use client';

import { useMemo } from 'react';
import { Calendar, Flag, Clock, CheckCircle } from 'lucide-react';
import type { IEPGoal } from '../../types/iep';
import { formatDate, getDaysUntilTarget, getDaysUntilReview } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPTimelineProps {
  goal: IEPGoal;
  showProgress?: boolean;
}

interface TimelinePoint {
  date: string;
  label: string;
  sublabel?: string;
  type: 'start' | 'review' | 'target' | 'now';
  isPast: boolean;
  isNow: boolean;
  icon: typeof Calendar;
  color: string;
  bgColor: string;
}

// ============================================================================
// Main Timeline Component
// ============================================================================

export function IEPTimeline({ goal, showProgress = true }: IEPTimelineProps) {
  // Memoize 'now' to prevent recalculation on every render
  const now = useMemo(() => new Date(), []);

  // Calculate timeline points
  const timelinePoints = useMemo<TimelinePoint[]>(() => {
    const points: TimelinePoint[] = [];
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);
    const reviewDate = goal.reviewDate ? new Date(goal.reviewDate) : null;

    // Start point
    points.push({
      date: goal.startDate,
      label: 'Start Date',
      sublabel: formatDate(goal.startDate),
      type: 'start',
      isPast: startDate < now,
      isNow: false,
      icon: Flag,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
    });

    // Review point (if exists and is between start and target)
    if (reviewDate && reviewDate > startDate && reviewDate < targetDate) {
      const daysUntil = getDaysUntilReview(goal);
      points.push({
        date: goal.reviewDate!,
        label: 'Review Date',
        sublabel:
          daysUntil !== null
            ? daysUntil === 0
              ? 'Today'
              : daysUntil > 0
                ? `${daysUntil} days away`
                : `${-daysUntil} days ago`
            : formatDate(goal.reviewDate!),
        type: 'review',
        isPast: reviewDate < now,
        isNow: daysUntil === 0,
        icon: Clock,
        color: 'text-amber-600',
        bgColor: 'bg-amber-100',
      });
    }

    // Target point
    const daysUntilTarget = getDaysUntilTarget(goal);
    points.push({
      date: goal.targetDate,
      label: 'Target Date',
      sublabel:
        daysUntilTarget === 0
          ? 'Today'
          : daysUntilTarget > 0
            ? `${daysUntilTarget} days left`
            : `${-daysUntilTarget} days overdue`,
      type: 'target',
      isPast: targetDate < now,
      isNow: daysUntilTarget === 0,
      icon: goal.status === 'achieved' ? CheckCircle : Calendar,
      color: goal.status === 'achieved' ? 'text-emerald-600' : 'text-blue-600',
      bgColor: goal.status === 'achieved' ? 'bg-emerald-100' : 'bg-blue-100',
    });

    return points;
  }, [goal, now]);

  // Calculate progress percentage on timeline
  const progressPercent = useMemo(() => {
    const startDate = new Date(goal.startDate);
    const targetDate = new Date(goal.targetDate);
    const totalDuration = targetDate.getTime() - startDate.getTime();
    const elapsed = now.getTime() - startDate.getTime();

    if (elapsed <= 0) return 0;
    if (elapsed >= totalDuration) return 100;

    return (elapsed / totalDuration) * 100;
  }, [goal.startDate, goal.targetDate, now]);

  return (
    <div className="space-y-4">
      {/* Visual timeline bar */}
      <div className="relative">
        {/* Background bar */}
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          {/* Progress fill */}
          {showProgress && (
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercent)}%` }}
            />
          )}
        </div>

        {/* Timeline points markers */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between">
          {timelinePoints.map((point, index) => {
            const position =
              index === 0
                ? 0
                : index === timelinePoints.length - 1
                  ? 100
                  : (index / (timelinePoints.length - 1)) * 100;

            return (
              <div
                key={point.type}
                className="absolute -translate-x-1/2"
                style={{ left: `${position}%` }}
              >
                <div
                  className={`w-4 h-4 rounded-full border-2 border-white shadow-sm ${
                    point.isPast || point.isNow ? point.bgColor : 'bg-gray-200'
                  }`}
                />
              </div>
            );
          })}

          {/* Current position marker */}
          {showProgress && progressPercent > 0 && progressPercent < 100 && (
            <div className="absolute -translate-x-1/2" style={{ left: `${progressPercent}%` }}>
              <div className="w-3 h-3 bg-white border-2 border-violet-500 rounded-full shadow-md animate-pulse" />
            </div>
          )}
        </div>
      </div>

      {/* Timeline details */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {timelinePoints.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.type}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                point.isNow
                  ? `${point.bgColor} border-2 ${point.color.replace('text-', 'border-')}`
                  : 'bg-gray-50'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${point.bgColor}`}
              >
                <Icon className={`w-5 h-5 ${point.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${point.isPast ? 'text-gray-500' : 'text-gray-900'}`}
                >
                  {point.label}
                </p>
                <p className={`text-xs ${point.isNow ? point.color : 'text-gray-400'}`}>
                  {point.sublabel}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Compact Timeline (for cards)
// ============================================================================

interface IEPTimelineCompactProps {
  goal: IEPGoal;
}

export function IEPTimelineCompact({ goal }: IEPTimelineCompactProps) {
  const now = new Date();
  const startDate = new Date(goal.startDate);
  const targetDate = new Date(goal.targetDate);
  const totalDuration = targetDate.getTime() - startDate.getTime();
  const elapsed = now.getTime() - startDate.getTime();

  const progressPercent = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));
  const daysLeft = getDaysUntilTarget(goal);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{formatDate(goal.startDate)}</span>
        <span
          className={`font-medium ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 7 ? 'text-amber-600' : 'text-gray-600'}`}
        >
          {daysLeft > 0 ? `${daysLeft} days left` : daysLeft === 0 ? 'Due today' : 'Overdue'}
        </span>
        <span className="text-gray-500">{formatDate(goal.targetDate)}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPTimelineSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-2 bg-gray-100 rounded-full" />
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
            <div className="w-10 h-10 bg-gray-100 rounded-lg" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 bg-gray-100 rounded" />
              <div className="h-3 w-16 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
