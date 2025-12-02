'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';

/**
 * Transition Goals Page
 * Track and manage transition goals across all areas
 */

type GoalCategory = 'education' | 'employment' | 'independent-living' | 'self-determination';
type GoalStatus = 'not-started' | 'in-progress' | 'achieved' | 'discontinued';

interface TransitionGoal {
  id: string;
  category: GoalCategory;
  title: string;
  description: string;
  targetDate: string;
  status: GoalStatus;
  progress: number;
  steps: Array<{
    id: string;
    description: string;
    completed: boolean;
    completedDate?: string;
  }>;
  assessments?: string[];
  notes?: string;
  relatedServices?: string[];
}

// Mock goals data
const mockGoals: TransitionGoal[] = [
  {
    id: 'g1',
    category: 'education',
    title: 'Complete automotive technology program application',
    description: 'Apply to Metro Technical College automotive technology certificate program',
    targetDate: '2024-06-01',
    status: 'in-progress',
    progress: 75,
    steps: [
      { id: 's1', description: 'Research programs', completed: true, completedDate: '2024-02-01' },
      { id: 's2', description: 'Visit campus', completed: true, completedDate: '2024-02-15' },
      { id: 's3', description: 'Complete application form', completed: true, completedDate: '2024-03-01' },
      { id: 's4', description: 'Submit accommodations request', completed: false },
    ],
    relatedServices: ['Transition Coordinator', 'School Counselor'],
  },
  {
    id: 'g2',
    category: 'employment',
    title: 'Complete 100 hours of work-based learning',
    description: 'Gain hands-on experience through job shadows, internships, and work experience',
    targetDate: '2024-08-01',
    status: 'in-progress',
    progress: 24,
    steps: [
      { id: 's1', description: 'Complete 2 job shadows', completed: true, completedDate: '2024-03-15' },
      { id: 's2', description: 'Begin internship', completed: false },
      { id: 's3', description: 'Complete 80 internship hours', completed: false },
    ],
    relatedServices: ['Job Coach', 'Vocational Rehabilitation'],
  },
  {
    id: 'g3',
    category: 'employment',
    title: 'Earn ASE Student Certification - Brakes',
    description: 'Pass ASE student certification exam for automotive brakes',
    targetDate: '2024-05-15',
    status: 'achieved',
    progress: 100,
    steps: [
      { id: 's1', description: 'Complete study guide', completed: true, completedDate: '2024-01-20' },
      { id: 's2', description: 'Take practice tests', completed: true, completedDate: '2024-02-01' },
      { id: 's3', description: 'Pass certification exam', completed: true, completedDate: '2024-02-15' },
    ],
    notes: 'Passed with 82%! Student showed strong understanding of brake systems.',
    relatedServices: ['CTE Teacher'],
  },
  {
    id: 'g4',
    category: 'self-determination',
    title: 'Lead transition portion of IEP meeting',
    description: 'Independently present transition goals and progress at annual IEP meeting',
    targetDate: '2024-04-15',
    status: 'in-progress',
    progress: 50,
    steps: [
      { id: 's1', description: 'Complete IEP meeting prep worksheet', completed: true, completedDate: '2024-03-20' },
      { id: 's2', description: 'Practice presentation with teacher', completed: true, completedDate: '2024-04-01' },
      { id: 's3', description: 'Present at IEP meeting', completed: false },
    ],
    relatedServices: ['Special Education Teacher'],
  },
  {
    id: 'g5',
    category: 'independent-living',
    title: 'Independently use public transportation',
    description: 'Travel independently using bus system to job site and community locations',
    targetDate: '2024-07-01',
    status: 'not-started',
    progress: 0,
    steps: [
      { id: 's1', description: 'Learn to read bus schedule', completed: false },
      { id: 's2', description: 'Practice route with support', completed: false },
      { id: 's3', description: 'Travel independently 3 times', completed: false },
    ],
    relatedServices: ['Transition Coordinator', 'Travel Trainer'],
  },
];

const categoryConfig: Record<GoalCategory, { label: string; icon: string; color: string }> = {
  education: { label: 'Education/Training', icon: '🎓', color: 'bg-blue-100 text-blue-700' },
  employment: { label: 'Employment', icon: '💼', color: 'bg-green-100 text-green-700' },
  'independent-living': { label: 'Independent Living', icon: '🏠', color: 'bg-theme-primary/10 text-theme-primary' },
  'self-determination': { label: 'Self-Determination', icon: '🎯', color: 'bg-amber-100 text-amber-700' },
};

const statusConfig: Record<GoalStatus, { label: string; color: string; icon: string }> = {
  'not-started': { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: '○' },
  'in-progress': { label: 'In Progress', color: 'bg-blue-100 text-blue-700', icon: '◐' },
  achieved: { label: 'Achieved', color: 'bg-green-100 text-green-700', icon: '✓' },
  discontinued: { label: 'Discontinued', color: 'bg-red-100 text-red-600', icon: '×' },
};

export default function TransitionGoalsPage() {
  const params = useParams();
  const [categoryFilter, setCategoryFilter] = useState<GoalCategory | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<GoalStatus | 'all'>('all');
  const [expandedGoal, setExpandedGoal] = useState<string | null>(null);

  const filteredGoals = mockGoals.filter((goal) => {
    if (categoryFilter !== 'all' && goal.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && goal.status !== statusFilter) return false;
    return true;
  });

  const goalsByCategory = (category: GoalCategory) => 
    mockGoals.filter((g) => g.category === category);

  const progressByCategory = (category: GoalCategory) => {
    const goals = goalsByCategory(category);
    if (goals.length === 0) return 0;
    return Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <nav className="text-sm text-gray-500 mb-2">
            <a href="../transition" className="hover:text-indigo-600">Transition</a>
            <span className="mx-2">/</span>
            <span className="text-gray-900">Goals</span>
          </nav>
          <h1 className="text-2xl font-bold text-gray-900">Transition Goals</h1>
          <p className="text-gray-600">Track progress toward post-secondary outcomes</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          + Add Goal
        </button>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-4 gap-4">
        {(Object.keys(categoryConfig) as GoalCategory[]).map((category) => (
          <Card key={category}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{categoryConfig[category].icon}</span>
                <span className="text-sm font-medium">{categoryConfig[category].label}</span>
              </div>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl font-bold">{progressByCategory(category)}%</div>
                  <div className="text-xs text-gray-500">{goalsByCategory(category).length} goals</div>
                </div>
                <div className="w-16 h-16">
                  {/* Simple progress ring */}
                  <svg viewBox="0 0 36 36" className="transform -rotate-90">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#e5e7eb"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3"
                      strokeDasharray={`${progressByCategory(category)}, 100`}
                    />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div>
          <label className="text-sm text-gray-600 mr-2">Category:</label>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as GoalCategory | 'all')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Categories</option>
            {(Object.keys(categoryConfig) as GoalCategory[]).map((cat) => (
              <option key={cat} value={cat}>{categoryConfig[cat].label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600 mr-2">Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as GoalStatus | 'all')}
            className="px-3 py-1 border rounded text-sm"
          >
            <option value="all">All Statuses</option>
            {(Object.keys(statusConfig) as GoalStatus[]).map((status) => (
              <option key={status} value={status}>{statusConfig[status].label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => (
          <Card key={goal.id}>
            <CardContent className="p-4">
              <div 
                className="cursor-pointer"
                onClick={() => setExpandedGoal(expandedGoal === goal.id ? null : goal.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-xs ${categoryConfig[goal.category].color}`}>
                        {categoryConfig[goal.category].icon} {categoryConfig[goal.category].label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs ${statusConfig[goal.status].color}`}>
                        {statusConfig[goal.status].icon} {statusConfig[goal.status].label}
                      </span>
                    </div>
                    <h3 className="font-semibold">{goal.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                    <p className="text-xs text-gray-500 mt-2">Target: {goal.targetDate}</p>
                  </div>
                  
                  <div className="ml-4 text-right">
                    <div className="text-2xl font-bold text-indigo-600">{goal.progress}%</div>
                    <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className={`h-2 rounded-full ${goal.status === 'achieved' ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedGoal === goal.id && (
                  <div className="mt-4 pt-4 border-t" onClick={(e) => e.stopPropagation()}>
                    {/* Steps */}
                    <div className="mb-4">
                      <h4 className="font-medium text-sm mb-2">Steps to Complete</h4>
                      <div className="space-y-2">
                        {goal.steps.map((step) => (
                          <div key={step.id} className="flex items-center gap-2 text-sm">
                            <span className={step.completed ? 'text-green-600' : 'text-gray-400'}>
                              {step.completed ? '✓' : '○'}
                            </span>
                            <span className={step.completed ? 'line-through text-gray-500' : ''}>
                              {step.description}
                            </span>
                            {step.completedDate && (
                              <span className="text-xs text-gray-400 ml-auto">
                                {step.completedDate}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Related Services */}
                    {goal.relatedServices && goal.relatedServices.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Related Services</h4>
                        <div className="flex flex-wrap gap-2">
                          {goal.relatedServices.map((service, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {service}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {goal.notes && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 italic">"{goal.notes}"</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4">
                      <button className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                        Update Progress
                      </button>
                      <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                        Edit Goal
                      </button>
                      <button className="px-3 py-1 border rounded text-sm hover:bg-gray-50">
                        Add Note
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <span className="text-4xl block mb-4">🎯</span>
            <h3 className="font-semibold text-lg mb-2">No goals match your filters</h3>
            <p className="text-gray-600">Try adjusting your filters or add a new goal</p>
          </CardContent>
        </Card>
      )}

      {/* IDEA Compliance Reminder */}
      <Card>
        <CardHeader title="IDEA Compliance Reminder" />
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-1">📋 Required Goals</h4>
              <p className="text-blue-700">
                Transition plans must address education/training, employment, and independent living (where appropriate).
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-800 mb-1">📊 Assessment-Based</h4>
              <p className="text-green-700">
                Goals must be based on age-appropriate transition assessments.
              </p>
            </div>
            <div className="p-3 bg-theme-primary/5 rounded-lg">
              <h4 className="font-medium text-theme-primary mb-1">🎤 Student Voice</h4>
              <p className="text-theme-primary">
                Students must be invited to IEP meetings where transition is discussed.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
