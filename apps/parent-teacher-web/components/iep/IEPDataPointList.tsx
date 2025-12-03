'use client';

import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Calendar, MessageSquare } from 'lucide-react';
import type { IEPDataPoint, IEPMeasurementContext } from '../../types/iep';
import { formatDate, formatRelativeDate } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPDataPointListProps {
  dataPoints: IEPDataPoint[];
  unit: string;
  showContext?: boolean;
  maxItems?: number;
}

// ============================================================================
// Context Configuration
// ============================================================================

const CONTEXT_CONFIG: Record<
  IEPMeasurementContext,
  { label: string; emoji: string; color: string }
> = {
  classroom: { label: 'Classroom', emoji: '🏫', color: 'text-blue-600 bg-blue-50' },
  therapy: { label: 'Therapy', emoji: '💚', color: 'text-emerald-600 bg-emerald-50' },
  home: { label: 'Home', emoji: '🏠', color: 'text-amber-600 bg-amber-50' },
  assessment: { label: 'Assessment', emoji: '📝', color: 'text-purple-600 bg-purple-50' },
  other: { label: 'Other', emoji: '📌', color: 'text-gray-600 bg-gray-50' },
};

// ============================================================================
// Single Data Point Item
// ============================================================================

interface DataPointItemProps {
  dataPoint: IEPDataPoint;
  unit: string;
  showContext: boolean;
}

function DataPointItem({ dataPoint, unit, showContext }: DataPointItemProps) {
  const [expanded, setExpanded] = useState(false);
  const context = CONTEXT_CONFIG[dataPoint.context];
  const hasDetails = dataPoint.notes || dataPoint.recordedBy;

  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-colors">
      {/* Main row */}
      <button
        className="w-full flex items-center gap-4 p-4 text-left"
        onClick={() => hasDetails && setExpanded(!expanded)}
        disabled={!hasDetails}
      >
        {/* Date */}
        <div className="flex-shrink-0 w-20">
          <p className="text-sm font-medium text-gray-900">
            {formatDate(dataPoint.measurementDate)}
          </p>
          <p className="text-xs text-gray-400">{formatRelativeDate(dataPoint.measurementDate)}</p>
        </div>

        {/* Value */}
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-3 py-1.5 bg-violet-100 text-violet-700 rounded-lg font-bold">
            {dataPoint.value.toFixed(1)}{' '}
            <span className="text-xs font-normal ml-1 text-violet-500">{unit}</span>
          </span>
        </div>

        {/* Context badge */}
        {showContext && (
          <div
            className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${context.color}`}
          >
            <span>{context.emoji}</span>
            <span>{context.label}</span>
          </div>
        )}

        {/* Notes indicator */}
        {dataPoint.notes && (
          <div className="flex-shrink-0 flex items-center gap-1 text-gray-400">
            <MessageSquare className="w-4 h-4" />
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Expand button */}
        {hasDetails && (
          <div className="flex-shrink-0 text-gray-300">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        )}
      </button>

      {/* Expanded details */}
      {expanded && hasDetails && (
        <div className="px-4 pb-4 pt-0 border-t border-gray-100 bg-gray-50">
          <div className="pt-3 space-y-2">
            {dataPoint.notes && (
              <div className="flex gap-2">
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">{dataPoint.notes}</p>
              </div>
            )}
            {dataPoint.recordedBy && (
              <div className="flex gap-2 items-center">
                <span className="text-gray-400 text-xs">Recorded by:</span>
                <span className="text-sm text-gray-600">{dataPoint.recordedBy}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Main Data Point List Component
// ============================================================================

export function IEPDataPointList({
  dataPoints,
  unit,
  showContext = true,
  maxItems,
}: IEPDataPointListProps) {
  const [showAll, setShowAll] = useState(false);

  // Sort data points by date (newest first)
  const sortedDataPoints = useMemo(() => {
    return [...dataPoints].sort(
      (a, b) => new Date(b.measurementDate).getTime() - new Date(a.measurementDate).getTime(),
    );
  }, [dataPoints]);

  // Apply max items limit
  const displayedDataPoints = useMemo(() => {
    if (!maxItems || showAll) return sortedDataPoints;
    return sortedDataPoints.slice(0, maxItems);
  }, [sortedDataPoints, maxItems, showAll]);

  const hasMore = maxItems && sortedDataPoints.length > maxItems;

  // Empty state
  if (dataPoints.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-900 mb-1">No data points yet</h3>
        <p className="text-sm text-gray-500">Add a measurement to start tracking progress</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Data points list */}
      {displayedDataPoints.map((dp) => (
        <DataPointItem key={dp.id} dataPoint={dp} unit={unit} showContext={showContext} />
      ))}

      {/* Show more/less button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-3 text-sm font-medium text-violet-600 hover:text-violet-700 hover:bg-violet-50 rounded-xl transition-colors"
        >
          {showAll ? 'Show less' : `Show ${sortedDataPoints.length - maxItems} more`}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPDataPointListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-gray-100 rounded-xl p-4">
          <div className="flex items-center gap-4">
            <div className="w-20 space-y-1">
              <div className="h-4 bg-gray-100 rounded w-16" />
              <div className="h-3 bg-gray-100 rounded w-12" />
            </div>
            <div className="h-8 w-20 bg-gray-100 rounded-lg" />
            <div className="h-6 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
