'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface CollegeSearchFiltersProps {
  onFilterChange: (filters: CollegeFilters) => void;
  initialFilters?: Partial<CollegeFilters>;
}

export interface CollegeFilters {
  state: string;
  collegeType: string;
  hasDisabilityServices: boolean;
  minDisabilityRating: number | null;
  maxTuition: number | null;
  minAcceptanceRate: number | null;
  programs: string[];
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const COLLEGE_TYPES = [
  { value: '2-year', label: '2-Year Community College' },
  { value: '4-year-public', label: '4-Year Public University' },
  { value: '4-year-private', label: '4-Year Private University' },
  { value: 'trade-school', label: 'Trade/Vocational School' },
  { value: 'online', label: 'Online University' },
];

const PROGRAM_AREAS = [
  'Business', 'Computer Science', 'Education', 'Engineering',
  'Healthcare', 'Liberal Arts', 'Science', 'Social Work',
  'Vocational', 'Art & Design', 'Communications'
];

const TUITION_RANGES = [
  { value: 5000, label: 'Under $5,000' },
  { value: 10000, label: 'Under $10,000' },
  { value: 20000, label: 'Under $20,000' },
  { value: 30000, label: 'Under $30,000' },
  { value: 50000, label: 'Under $50,000' },
  { value: null, label: 'Any tuition' },
];

export function CollegeSearchFilters({ onFilterChange, initialFilters }: CollegeSearchFiltersProps) {
  const [filters, setFilters] = useState<CollegeFilters>({
    state: initialFilters?.state || '',
    collegeType: initialFilters?.collegeType || '',
    hasDisabilityServices: initialFilters?.hasDisabilityServices ?? true,
    minDisabilityRating: initialFilters?.minDisabilityRating || null,
    maxTuition: initialFilters?.maxTuition || null,
    minAcceptanceRate: initialFilters?.minAcceptanceRate || null,
    programs: initialFilters?.programs || [],
  });

  const updateFilter = <K extends keyof CollegeFilters>(key: K, value: CollegeFilters[K]) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const toggleProgram = (program: string) => {
    const newPrograms = filters.programs.includes(program)
      ? filters.programs.filter(p => p !== program)
      : [...filters.programs, program];
    updateFilter('programs', newPrograms);
  };

  const resetFilters = () => {
    const defaultFilters: CollegeFilters = {
      state: '',
      collegeType: '',
      hasDisabilityServices: true,
      minDisabilityRating: null,
      maxTuition: null,
      minAcceptanceRate: null,
      programs: [],
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Search Filters</h3>
          <button
            onClick={resetFilters}
            className="text-sm text-blue-600 hover:underline"
          >
            Reset All
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Disability Services - Highlighted */}
        <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
          <h4 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
            <span className="text-lg">♿</span>
            Disability Services
          </h4>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasDisabilityServices}
                onChange={(e) => updateFilter('hasDisabilityServices', e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
              />
              <span className="text-sm">Has Disability Services Office</span>
            </label>
            
            <div>
              <label className="block text-sm mb-1">Minimum Disability Services Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => updateFilter('minDisabilityRating', 
                      filters.minDisabilityRating === rating ? null : rating
                    )}
                    className={`w-8 h-8 rounded ${
                      filters.minDisabilityRating !== null && rating <= filters.minDisabilityRating
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    ★
                  </button>
                ))}
                <span className="text-sm text-gray-500 ml-2 self-center">
                  {filters.minDisabilityRating ? `${filters.minDisabilityRating}+ stars` : 'Any'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <select
            value={filters.state}
            onChange={(e) => updateFilter('state', e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All States</option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* College Type */}
        <div>
          <label className="block text-sm font-medium mb-1">College Type</label>
          <select
            value={filters.collegeType}
            onChange={(e) => updateFilter('collegeType', e.target.value)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            {COLLEGE_TYPES.map((type) => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
        </div>

        {/* Tuition */}
        <div>
          <label className="block text-sm font-medium mb-1">Maximum Tuition (In-State)</label>
          <select
            value={filters.maxTuition ?? ''}
            onChange={(e) => updateFilter('maxTuition', e.target.value ? Number(e.target.value) : null)}
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {TUITION_RANGES.map((range) => (
              <option key={range.label} value={range.value ?? ''}>
                {range.label}
              </option>
            ))}
          </select>
        </div>

        {/* Acceptance Rate */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Minimum Acceptance Rate: {filters.minAcceptanceRate ? `${filters.minAcceptanceRate}%` : 'Any'}
          </label>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minAcceptanceRate ?? 0}
            onChange={(e) => updateFilter('minAcceptanceRate', 
              Number(e.target.value) === 0 ? null : Number(e.target.value)
            )}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Any</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Programs */}
        <div>
          <label className="block text-sm font-medium mb-2">Programs of Interest</label>
          <div className="flex flex-wrap gap-2">
            {PROGRAM_AREAS.map((program) => (
              <button
                key={program}
                onClick={() => toggleProgram(program)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  filters.programs.includes(program)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {program}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters Summary */}
        {(filters.state || filters.collegeType || filters.maxTuition || 
          filters.minDisabilityRating || filters.programs.length > 0) && (
          <div className="pt-4 border-t">
            <p className="text-sm text-gray-600 mb-2">Active Filters:</p>
            <div className="flex flex-wrap gap-2">
              {filters.state && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  State: {filters.state}
                </span>
              )}
              {filters.collegeType && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  Type: {filters.collegeType}
                </span>
              )}
              {filters.maxTuition && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                  Max: ${filters.maxTuition.toLocaleString()}
                </span>
              )}
              {filters.minDisabilityRating && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                  {filters.minDisabilityRating}+ ★ Disability Services
                </span>
              )}
              {filters.programs.map((p) => (
                <span key={p} className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CollegeSearchFilters;
