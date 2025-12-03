'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Calendar, ChevronRight, Clock } from 'lucide-react';
import type { IEPGoal } from '../../types/iep';
import { CATEGORY_CONFIG, getDaysUntilReview, formatDate } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPUpcomingReviewsProps {
  goals: IEPGoal[];
  /** Number of days to look ahead (default: 14) */
  daysAhead?: number;
  /** Maximum number of reviews to show */
  maxItems?: number;
}

// ============================================================================
// Component
// ============================================================================

export function IEPUpcomingReviews({
  goals,
  daysAhead = 14,
  maxItems = 5,
}: IEPUpcomingReviewsProps) {
  // Get goals with upcoming reviews
  const upcomingReviews = useMemo(() => {
    const now = new Date();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + daysAhead);

    return goals
      .filter((goal) => {
        if (!goal.reviewDate) return false;
        const reviewDate = new Date(goal.reviewDate);
        return reviewDate > now && reviewDate <= cutoff;
      })
      .sort((a, b) => {
        const dateA = new Date(a.reviewDate!);
        const dateB = new Date(b.reviewDate!);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, maxItems);
  }, [goals, daysAhead, maxItems]);

  // Empty state
  if (upcomingReviews.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
          <Calendar className="w-4 h-4 text-amber-600" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900">Upcoming Reviews</h3>
          <p className="text-xs text-gray-500">Next {daysAhead} days</p>
        </div>
      </div>

      {/* Reviews list */}
      <div className="space-y-2">
        {upcomingReviews.map((goal) => {
          const daysUntil = getDaysUntilReview(goal);
          const category = CATEGORY_CONFIG[goal.category];

          return (
            <Link
              key={goal.id}
              href={`/iep/${goal.id}`}
              className="flex items-center gap-3 p-3 bg-white rounded-xl hover:shadow-md transition-all group"
            >
              {/* Category emoji */}
              <span className="text-lg">{category.emoji}</span>

              {/* Goal info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate group-hover:text-violet-600 transition-colors">
                  {goal.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{formatDate(goal.reviewDate!)}</span>
                </div>
              </div>

              {/* Days until */}
              <div className="flex-shrink-0 text-right">
                <span
                  className={`text-sm font-bold ${
                    daysUntil !== null && daysUntil <= 3
                      ? 'text-red-600'
                      : daysUntil !== null && daysUntil <= 7
                        ? 'text-amber-600'
                        : 'text-gray-600'
                  }`}
                >
                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                </span>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-violet-400 transition-colors flex-shrink-0" />
            </Link>
          );
        })}
      </div>

      {/* View all link */}
      {upcomingReviews.length >= maxItems && (
        <div className="mt-3 text-center">
          <Link
            href="/iep?filter=upcoming"
            className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
          >
            View all upcoming reviews →
          </Link>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPUpcomingReviewsSkeleton() {
  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-5 border border-amber-200 animate-pulse">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 bg-amber-100 rounded-lg" />
        <div className="space-y-1">
          <div className="h-4 w-32 bg-amber-100 rounded" />
          <div className="h-3 w-20 bg-amber-100 rounded" />
        </div>
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-xl">
            <div className="w-6 h-6 bg-gray-100 rounded" />
            <div className="flex-1 space-y-1.5">
              <div className="h-4 w-3/4 bg-gray-100 rounded" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
            <div className="h-4 w-12 bg-gray-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
