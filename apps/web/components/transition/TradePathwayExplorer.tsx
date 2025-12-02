'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface TradeProgram {
  id: string;
  name: string;
  trade: string;
  provider: string;
  providerType: string;
  city?: string;
  state?: string;
  isOnline: boolean;
  duration: number; // weeks
  tuition: number;
  jobPlacementRate?: number;
  averageStartingSalary?: number;
  medianSalary?: number;
  certificationsEarned: string[];
  disabilityServicesAvailable: boolean;
  accommodationsOffered: string[];
}

interface TradeSummary {
  trade: string;
  programCount: number;
  avgPlacementRate: number;
  avgStartingSalary: number;
  tuitionRange: { min: number; max: number };
}

interface TradePathwayExplorerProps {
  programs: TradeProgram[];
  tradeSummaries: TradeSummary[];
  onProgramSelect?: (program: TradeProgram) => void;
  onApply?: (program: TradeProgram) => void;
}

const TRADE_INFO: Record<string, { icon: string; description: string; growth: string }> = {
  CNA: { icon: '🏥', description: 'Certified Nursing Assistant', growth: '+8%' },
  HVAC: { icon: '❄️', description: 'Heating, Ventilation & AC', growth: '+13%' },
  AUTOMOTIVE: { icon: '🚗', description: 'Auto Mechanic/Technician', growth: '+4%' },
  WELDING: { icon: '🔥', description: 'Welding & Fabrication', growth: '+6%' },
  COSMETOLOGY: { icon: '💇', description: 'Beauty & Hair', growth: '+11%' },
  ELECTRICAL: { icon: '⚡', description: 'Electrician', growth: '+9%' },
  CULINARY: { icon: '👨‍🍳', description: 'Culinary Arts', growth: '+6%' },
  CDL: { icon: '🚛', description: 'Commercial Driving', growth: '+12%' },
  PLUMBING: { icon: '🔧', description: 'Plumbing', growth: '+15%' },
  IT_SUPPORT: { icon: '💻', description: 'IT Support/Help Desk', growth: '+9%' },
  MEDICAL_ASSISTANT: { icon: '⚕️', description: 'Medical Assistant', growth: '+18%' },
  PHLEBOTOMY: { icon: '💉', description: 'Phlebotomy Technician', growth: '+17%' },
  PHARMACY_TECH: { icon: '💊', description: 'Pharmacy Technician', growth: '+5%' },
  DENTAL_ASSISTANT: { icon: '🦷', description: 'Dental Assistant', growth: '+11%' },
  EMT: { icon: '🚑', description: 'Emergency Medical Tech', growth: '+7%' },
  CARPENTRY: { icon: '🪚', description: 'Carpentry/Construction', growth: '+8%' },
  MACHINIST: { icon: '⚙️', description: 'CNC Machinist', growth: '+7%' },
  WEB_DEVELOPMENT: { icon: '🌐', description: 'Web Development', growth: '+23%' },
  CYBERSECURITY: { icon: '🔐', description: 'Cybersecurity', growth: '+35%' },
  SOLAR_TECH: { icon: '☀️', description: 'Solar Installation', growth: '+52%' },
};

export function TradePathwayExplorer({
  programs,
  tradeSummaries,
  onProgramSelect,
  onApply,
}: TradePathwayExplorerProps) {
  const [selectedTrade, setSelectedTrade] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'salary' | 'placement' | 'tuition' | 'duration'>('placement');
  const [showDisabilityOnly, setShowDisabilityOnly] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDuration = (weeks: number) => {
    if (weeks < 8) return `${weeks} weeks`;
    if (weeks < 52) return `${Math.round(weeks / 4)} months`;
    return `${(weeks / 52).toFixed(1)} years`;
  };

  const filteredPrograms = programs
    .filter(p => !selectedTrade || p.trade === selectedTrade)
    .filter(p => !showDisabilityOnly || p.disabilityServicesAvailable)
    .sort((a, b) => {
      switch (sortBy) {
        case 'salary':
          return (b.averageStartingSalary || 0) - (a.averageStartingSalary || 0);
        case 'placement':
          return (b.jobPlacementRate || 0) - (a.jobPlacementRate || 0);
        case 'tuition':
          return a.tuition - b.tuition;
        case 'duration':
          return a.duration - b.duration;
        default:
          return 0;
      }
    });

  return (
    <div className="space-y-6">
      {/* Trade Overview Cards */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Explore Trade Careers</h3>
          <button
            onClick={() => setSelectedTrade(null)}
            className={`text-sm px-3 py-1 rounded ${
              !selectedTrade ? 'bg-blue-500 text-white' : 'text-blue-600 hover:bg-blue-50'
            }`}
          >
            View All
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {tradeSummaries.map((summary) => {
            const info = TRADE_INFO[summary.trade] || { icon: '🔧', description: summary.trade, growth: '' };
            const isSelected = selectedTrade === summary.trade;
            
            return (
              <button
                key={summary.trade}
                onClick={() => setSelectedTrade(isSelected ? null : summary.trade)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-2xl mb-2">{info.icon}</div>
                <h4 className="font-medium text-sm">{info.description}</h4>
                <div className="mt-2 space-y-1 text-xs text-gray-600">
                  <p>{summary.programCount} programs</p>
                  <p className="text-green-600 font-medium">
                    {formatCurrency(summary.avgStartingSalary)} avg
                  </p>
                  {summary.avgPlacementRate > 0 && (
                    <p>{summary.avgPlacementRate}% placement</p>
                  )}
                  {info.growth && (
                    <p className="text-blue-600">Growth: {info.growth}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-wrap gap-4 items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showDisabilityOnly}
              onChange={(e) => setShowDisabilityOnly(e.target.checked)}
              className="w-4 h-4 text-theme-primary rounded"
            />
            <span className="text-sm">♿ Disability Services Available</span>
          </label>
        </div>

        <div className="flex items-center gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="text-sm p-2 border rounded"
          >
            <option value="placement">Sort by Placement Rate</option>
            <option value="salary">Sort by Salary</option>
            <option value="tuition">Sort by Tuition (Low to High)</option>
            <option value="duration">Sort by Duration (Shortest)</option>
          </select>

          <div className="flex border rounded overflow-hidden">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-sm ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white'}`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-600">
        Showing {filteredPrograms.length} programs
        {selectedTrade && ` in ${TRADE_INFO[selectedTrade]?.description || selectedTrade}`}
      </p>

      {/* Programs Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPrograms.map((program) => (
            <div 
              key={program.id} 
              className="cursor-pointer"
              onClick={() => onProgramSelect?.(program)}
            >
              <Card className="hover:shadow-lg transition-shadow h-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">{program.name}</h4>
                    <p className="text-sm text-gray-600">{program.provider}</p>
                  </div>
                  <span className="text-2xl">{TRADE_INFO[program.trade]?.icon || '🔧'}</span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location</span>
                    <span>{program.isOnline ? '🌐 Online' : `${program.city}, ${program.state}`}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duration</span>
                    <span>{formatDuration(program.duration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuition</span>
                    <span className="font-medium">{formatCurrency(program.tuition)}</span>
                  </div>
                  {program.jobPlacementRate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Job Placement</span>
                      <span className="text-green-600 font-medium">{program.jobPlacementRate}%</span>
                    </div>
                  )}
                  {program.averageStartingSalary && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Starting Salary</span>
                      <span className="text-green-600 font-medium">
                        {formatCurrency(program.averageStartingSalary)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Certifications */}
                {program.certificationsEarned.length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-gray-500 mb-1">Certifications Earned:</p>
                    <div className="flex flex-wrap gap-1">
                      {program.certificationsEarned.slice(0, 3).map((cert) => (
                        <span key={cert} className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          {cert}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Accessibility */}
                {program.disabilityServicesAvailable && (
                  <div className="mt-3 pt-3 border-t">
                    <span className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded inline-flex items-center gap-1">
                      ♿ Disability Services Available
                    </span>
                  </div>
                )}

                {/* Apply Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onApply?.(program);
                  }}
                  className="mt-4 w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Learn More & Apply
                </button>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPrograms.map((program) => (
            <div 
              key={program.id}
              className="cursor-pointer"
              onClick={() => onProgramSelect?.(program)}
            >
              <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{TRADE_INFO[program.trade]?.icon || '🔧'}</span>
                    <div>
                      <h4 className="font-semibold">{program.name}</h4>
                      <p className="text-sm text-gray-600">
                        {program.provider} • {program.isOnline ? 'Online' : `${program.city}, ${program.state}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <p className="text-gray-500">Duration</p>
                      <p className="font-medium">{formatDuration(program.duration)}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-gray-500">Tuition</p>
                      <p className="font-medium">{formatCurrency(program.tuition)}</p>
                    </div>
                    {program.jobPlacementRate && (
                      <div className="text-center">
                        <p className="text-gray-500">Placement</p>
                        <p className="font-medium text-green-600">{program.jobPlacementRate}%</p>
                      </div>
                    )}
                    {program.averageStartingSalary && (
                      <div className="text-center">
                        <p className="text-gray-500">Salary</p>
                        <p className="font-medium text-green-600">{formatCurrency(program.averageStartingSalary)}</p>
                      </div>
                    )}
                    
                    {program.disabilityServicesAvailable && (
                      <span className="text-theme-primary" title="Disability Services Available">♿</span>
                    )}
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onApply?.(program);
                      }}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>
      )}

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No programs found matching your criteria</p>
          <p className="text-sm mt-2">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}

export default TradePathwayExplorer;
