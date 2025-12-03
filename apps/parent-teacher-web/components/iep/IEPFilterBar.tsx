'use client';

import { Search, X } from 'lucide-react';
import type { IEPCategory, IEPGoalStatus } from '../../types/iep';
import { CATEGORY_CONFIG, STATUS_CONFIG, ALL_CATEGORIES, ALL_STATUSES } from '../../types/iep';

// ============================================================================
// Types
// ============================================================================

interface IEPFilterBarProps {
  selectedCategory: IEPCategory | null;
  selectedStatus: IEPGoalStatus | null;
  searchQuery: string;
  onCategoryChange: (category: IEPCategory | null) => void;
  onStatusChange: (status: IEPGoalStatus | null) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
}

// ============================================================================
// Filter Dropdown Component
// ============================================================================

interface FilterDropdownProps<T extends string> {
  label: string;
  value: T | null;
  options: T[];
  getLabel: (option: T) => string;
  getEmoji?: (option: T) => string;
  onChange: (value: T | null) => void;
}

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  getLabel,
  getEmoji,
  onChange,
}: FilterDropdownProps<T>) {
  return (
    <div className="relative">
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : (e.target.value as T))}
        className={`appearance-none px-4 py-2 pr-8 rounded-full text-sm font-medium border transition-all cursor-pointer ${
          value
            ? 'bg-violet-100 border-violet-300 text-violet-700'
            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
        }`}
      >
        <option value="">All {label}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {getEmoji?.(option)} {getLabel(option)}
          </option>
        ))}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          className="w-4 h-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

// ============================================================================
// Main Filter Bar Component
// ============================================================================

export function IEPFilterBar({
  selectedCategory,
  selectedStatus,
  searchQuery,
  onCategoryChange,
  onStatusChange,
  onSearchChange,
  onClearFilters,
}: IEPFilterBarProps) {
  const hasActiveFilters =
    selectedCategory !== null || selectedStatus !== null || searchQuery.length > 0;

  return (
    <div className="space-y-3">
      {/* Search and filters row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search goals..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <FilterDropdown
          label="Categories"
          value={selectedCategory}
          options={ALL_CATEGORIES}
          getLabel={(cat) => CATEGORY_CONFIG[cat].label}
          getEmoji={(cat) => CATEGORY_CONFIG[cat].emoji}
          onChange={onCategoryChange}
        />

        {/* Status filter */}
        <FilterDropdown
          label="Statuses"
          value={selectedStatus}
          options={ALL_STATUSES}
          getLabel={(status) => STATUS_CONFIG[status].label}
          onChange={onStatusChange}
        />

        {/* Clear filters button */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Active filters chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategory && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${CATEGORY_CONFIG[selectedCategory].bgColor} ${CATEGORY_CONFIG[selectedCategory].color}`}
            >
              <span>{CATEGORY_CONFIG[selectedCategory].emoji}</span>
              <span>{CATEGORY_CONFIG[selectedCategory].label}</span>
              <button onClick={() => onCategoryChange(null)} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {selectedStatus && (
            <div
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${STATUS_CONFIG[selectedStatus].bgColor} ${STATUS_CONFIG[selectedStatus].color}`}
            >
              <span>{STATUS_CONFIG[selectedStatus].label}</span>
              <button onClick={() => onStatusChange(null)} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {searchQuery && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
              <span>Search: &quot;{searchQuery}&quot;</span>
              <button onClick={() => onSearchChange('')} className="ml-1 hover:opacity-70">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

export function IEPFilterBarSkeleton() {
  return (
    <div className="flex flex-wrap items-center gap-3 animate-pulse">
      <div className="flex-1 min-w-[200px] h-10 bg-gray-100 rounded-full" />
      <div className="h-10 w-32 bg-gray-100 rounded-full" />
      <div className="h-10 w-28 bg-gray-100 rounded-full" />
    </div>
  );
}
