'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

interface Milestone {
  id: string;
  date: string;
  title: string;
  description: string;
  category: 'education' | 'employment' | 'assessment' | 'deadline' | 'meeting' | 'milestone';
  status: 'completed' | 'upcoming' | 'overdue' | 'in-progress';
  relatedRecordId?: string;
  relatedRecordType?: string;
}

interface TransitionTimelineProps {
  milestones: Milestone[];
  graduationDate: string;
  learnerName: string;
  onMilestoneClick?: (milestone: Milestone) => void;
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
  education: { bg: 'bg-blue-100', border: 'border-blue-500', text: 'text-blue-700' },
  employment: { bg: 'bg-green-100', border: 'border-green-500', text: 'text-green-700' },
  assessment: { bg: 'bg-theme-primary/10', border: 'border-theme-primary', text: 'text-theme-primary' },
  deadline: { bg: 'bg-red-100', border: 'border-red-500', text: 'text-red-700' },
  meeting: { bg: 'bg-yellow-100', border: 'border-yellow-500', text: 'text-yellow-700' },
  milestone: { bg: 'bg-indigo-100', border: 'border-indigo-500', text: 'text-indigo-700' },
};

const statusIcons: Record<string, string> = {
  completed: '✓',
  upcoming: '○',
  overdue: '!',
  'in-progress': '◐',
};

export function TransitionTimeline({
  milestones,
  graduationDate,
  learnerName,
  onMilestoneClick,
}: TransitionTimelineProps) {
  const today = new Date();
  const gradDate = new Date(graduationDate);
  const daysUntilGraduation = Math.ceil((gradDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = date.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    
    if (days < 0) return `${Math.abs(days)} days ago`;
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 7) return `In ${days} days`;
    if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
    if (days < 365) return `In ${Math.floor(days / 30)} months`;
    return `In ${Math.floor(days / 365)} years`;
  };

  // Sort milestones by date
  const sortedMilestones = [...milestones].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Split into past and future
  const pastMilestones = sortedMilestones.filter(m => new Date(m.date) < today);
  const futureMilestones = sortedMilestones.filter(m => new Date(m.date) >= today);

  return (
    <div className="space-y-6">
      {/* Graduation Countdown */}
      <Card className="bg-gradient-to-r from-indigo-500 to-theme-primary text-white">
        <CardContent className="p-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium opacity-90">Time Until Graduation</h3>
              <p className="text-3xl font-bold mt-1">
                {daysUntilGraduation > 0 ? `${daysUntilGraduation} days` : 'Graduated!'}
              </p>
              <p className="text-sm opacity-75 mt-1">{formatDate(graduationDate)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">{learnerName}'s</p>
              <p className="text-lg font-semibold">Transition Journey</p>
            </div>
          </div>
          
          {/* Progress bar */}
          {daysUntilGraduation > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(100, Math.max(0, ((1460 - daysUntilGraduation) / 1460) * 100))}%` }}
                />
              </div>
              <p className="text-xs opacity-75 mt-1">4-year transition plan progress</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        {Object.entries(categoryColors).map(([category, colors]) => (
          <div key={category} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${colors.bg} ${colors.border} border-2`} />
            <span className="capitalize">{category}</span>
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

        {/* Upcoming Milestones */}
        {futureMilestones.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 ml-10">Upcoming</h3>
            <div className="space-y-4">
              {futureMilestones.map((milestone) => {
                const colors = categoryColors[milestone.category] || categoryColors.milestone;
                return (
                  <div
                    key={milestone.id}
                    className={`relative pl-10 cursor-pointer hover:opacity-80 transition-opacity`}
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    {/* Timeline dot */}
                    <div 
                      className={`absolute left-2 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-xs`}
                    >
                      <span className={milestone.status === 'overdue' ? 'text-red-600' : ''}>
                        {statusIcons[milestone.status]}
                      </span>
                    </div>
                    
                    <Card className={`${milestone.status === 'overdue' ? 'border-red-300 bg-red-50' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{milestone.title}</h4>
                            <p className="text-sm text-gray-600">{milestone.description}</p>
                          </div>
                          <div className="text-right text-sm">
                            <p className="font-medium">{formatDate(milestone.date)}</p>
                            <p className={`text-xs ${milestone.status === 'overdue' ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                              {getRelativeTime(milestone.date)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                            {milestone.category}
                          </span>
                          {milestone.status === 'overdue' && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                              Overdue
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Today marker */}
        <div className="relative pl-10 py-4">
          <div className="absolute left-2 w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <div className="text-sm font-semibold text-blue-600">Today</div>
        </div>

        {/* Past Milestones */}
        {pastMilestones.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4 ml-10 text-gray-500">Completed</h3>
            <div className="space-y-4 opacity-75">
              {pastMilestones.slice(-5).reverse().map((milestone) => {
                const colors = categoryColors[milestone.category] || categoryColors.milestone;
                return (
                  <div
                    key={milestone.id}
                    className="relative pl-10 cursor-pointer hover:opacity-100 transition-opacity"
                    onClick={() => onMilestoneClick?.(milestone)}
                  >
                    <div 
                      className={`absolute left-2 w-5 h-5 rounded-full ${colors.bg} ${colors.border} border-2 flex items-center justify-center text-xs`}
                    >
                      ✓
                    </div>
                    
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-gray-700">{milestone.title}</h4>
                            <p className="text-sm text-gray-500">{milestone.description}</p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{formatDate(milestone.date)}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TransitionTimeline;
