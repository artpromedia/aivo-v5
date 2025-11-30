'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  ArrowLeft, Plus, Target, TrendingUp, Calendar, 
  CheckCircle2, AlertCircle, Clock, Trash2, Edit2
} from 'lucide-react';

/**
 * ILS Goals Page
 * Set and track Independent Living Skills goals
 */

// Mock goals data - replace with API calls
const mockGoals = [
  {
    id: 'goal-1',
    skillId: 'skill-1',
    skillName: 'Identifying Coins',
    domain: 'MONEY_MANAGEMENT',
    targetMasteryLevel: 'MASTERED',
    currentMasteryLevel: 'PROFICIENT',
    targetDate: '2024-06-30',
    startDate: '2024-03-01',
    status: 'on-track' as const,
    baselinePercent: 45,
    currentPercent: 85,
    targetPercent: 95,
    progressNotes: 'Student has shown steady improvement. Recently demonstrated consistent identification in classroom setting.',
    objectiveCriteria: '95% accuracy across 3 consecutive sessions in 2 different settings',
    iepAligned: true,
    lastUpdated: '2024-05-15',
  },
  {
    id: 'goal-2',
    skillId: 'skill-2',
    skillName: 'Counting Coins to $1.00',
    domain: 'MONEY_MANAGEMENT',
    targetMasteryLevel: 'PROFICIENT',
    currentMasteryLevel: 'DEVELOPING',
    targetDate: '2024-08-15',
    startDate: '2024-04-01',
    status: 'on-track' as const,
    baselinePercent: 25,
    currentPercent: 55,
    targetPercent: 85,
    progressNotes: 'Making good progress with quarters and dimes. Needs more practice with nickels and pennies combined.',
    objectiveCriteria: '85% accuracy with mixed coins, independently sorting and counting',
    iepAligned: true,
    lastUpdated: '2024-05-14',
  },
  {
    id: 'goal-3',
    skillId: 'skill-3',
    skillName: 'Making a Sandwich',
    domain: 'COOKING_NUTRITION',
    targetMasteryLevel: 'INDEPENDENT',
    currentMasteryLevel: 'EMERGING',
    targetDate: '2024-09-30',
    startDate: '2024-05-01',
    status: 'at-risk' as const,
    baselinePercent: 20,
    currentPercent: 35,
    targetPercent: 90,
    progressNotes: 'Slow start due to sensory sensitivities. Trying different bread types and utensils.',
    objectiveCriteria: 'Complete 8-step task analysis with no more than verbal prompts',
    iepAligned: true,
    lastUpdated: '2024-05-13',
  },
  {
    id: 'goal-4',
    skillId: 'skill-4',
    skillName: 'Sorting Laundry',
    domain: 'HOUSING_HOME_CARE',
    targetMasteryLevel: 'GENERALIZED',
    currentMasteryLevel: 'MASTERED',
    targetDate: '2024-06-01',
    startDate: '2024-01-15',
    status: 'achieved' as const,
    baselinePercent: 60,
    currentPercent: 95,
    targetPercent: 90,
    progressNotes: 'Goal achieved! Student now sorts laundry independently at home, school, and laundromat.',
    objectiveCriteria: '90% accuracy in 3 different settings (home, school, laundromat)',
    iepAligned: true,
    achievedDate: '2024-05-10',
    lastUpdated: '2024-05-10',
  },
];

const statusConfig = {
  'on-track': { label: 'On Track', color: 'bg-green-100 text-green-800', icon: TrendingUp },
  'at-risk': { label: 'At Risk', color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle },
  'achieved': { label: 'Achieved', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  'not-achieved': { label: 'Not Achieved', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const domainColors: Record<string, string> = {
  MONEY_MANAGEMENT: 'bg-green-100 text-green-800',
  COOKING_NUTRITION: 'bg-orange-100 text-orange-800',
  TRANSPORTATION: 'bg-blue-100 text-blue-800',
  HOUSING_HOME_CARE: 'bg-purple-100 text-purple-800',
  HEALTH_SAFETY: 'bg-red-100 text-red-800',
  COMMUNITY_RESOURCES: 'bg-yellow-100 text-yellow-800',
};

const domainLabels: Record<string, string> = {
  MONEY_MANAGEMENT: 'Money Management',
  COOKING_NUTRITION: 'Cooking & Nutrition',
  TRANSPORTATION: 'Transportation',
  HOUSING_HOME_CARE: 'Housing & Home Care',
  HEALTH_SAFETY: 'Health & Safety',
  COMMUNITY_RESOURCES: 'Community Resources',
};

export default function GoalsPage() {
  const params = useParams();
  const learnerId = params?.learnerId as string;
  const [filter, setFilter] = useState<'all' | 'active' | 'achieved'>('all');
  const [showAddGoal, setShowAddGoal] = useState(false);

  const basePath = `/teacher/learners/${learnerId}/independent-living`;

  const filteredGoals = mockGoals.filter((goal) => {
    if (filter === 'all') return true;
    if (filter === 'active') return goal.status !== 'achieved';
    return goal.status === 'achieved';
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDaysRemaining = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = new Date();
    const diff = target.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={basePath}
            className="p-2 hover:bg-muted rounded-md"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">ILS Goals</h1>
            <p className="text-muted-foreground">
              Set and track Independent Living Skills goals
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddGoal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold">{mockGoals.length}</p>
            <p className="text-sm text-muted-foreground">Total Goals</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-600">
              {mockGoals.filter((g) => g.status === 'on-track').length}
            </p>
            <p className="text-sm text-muted-foreground">On Track</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">
              {mockGoals.filter((g) => g.status === 'at-risk').length}
            </p>
            <p className="text-sm text-muted-foreground">At Risk</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">
              {mockGoals.filter((g) => g.status === 'achieved').length}
            </p>
            <p className="text-sm text-muted-foreground">Achieved</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b pb-2">
        {(['all', 'active', 'achieved'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-t-md text-sm capitalize ${
              filter === tab
                ? 'bg-primary text-primary-foreground'
                : 'hover:bg-muted'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {filteredGoals.map((goal) => {
          const status = statusConfig[goal.status];
          const StatusIcon = status.icon;
          const daysRemaining = getDaysRemaining(goal.targetDate);
          const progressPercent = ((goal.currentPercent - goal.baselinePercent) / (goal.targetPercent - goal.baselinePercent)) * 100;

          return (
            <Card key={goal.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Target className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{goal.skillName}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge className={domainColors[goal.domain]}>
                          {domainLabels[goal.domain]}
                        </Badge>
                        {goal.iepAligned && (
                          <Badge variant="outline" className="text-xs">
                            IEP Aligned
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={status.color}>
                      <StatusIcon className="h-3.5 w-3.5 mr-1" />
                      {status.label}
                    </Badge>
                    <button className="p-1 hover:bg-muted rounded">
                      <Edit2 className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Target Info */}
                <div className="flex flex-wrap gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    Target: {goal.targetMasteryLevel.replace('_', ' ')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Due: {formatDate(goal.targetDate)}
                    {goal.status !== 'achieved' && daysRemaining > 0 && (
                      <span className="text-muted-foreground">
                        ({daysRemaining} days)
                      </span>
                    )}
                  </span>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">
                      Progress toward goal
                    </span>
                    <span className="font-medium">
                      {goal.currentPercent}% / {goal.targetPercent}%
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        goal.status === 'achieved'
                          ? 'bg-blue-500'
                          : goal.status === 'at-risk'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progressPercent, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Baseline: {goal.baselinePercent}%</span>
                    <span>Current: {goal.currentPercent}%</span>
                    <span>Target: {goal.targetPercent}%</span>
                  </div>
                </div>

                {/* Objective Criteria */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium mb-1">Objective Criteria:</p>
                  <p className="text-sm text-muted-foreground">{goal.objectiveCriteria}</p>
                </div>

                {/* Progress Notes */}
                {goal.progressNotes && (
                  <div>
                    <p className="text-sm font-medium mb-1">Progress Notes:</p>
                    <p className="text-sm text-muted-foreground">{goal.progressNotes}</p>
                  </div>
                )}

                {/* Achievement Date */}
                {goal.status === 'achieved' && goal.achievedDate && (
                  <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <span className="text-sm">
                      Goal achieved on {formatDate(goal.achievedDate)}
                    </span>
                  </div>
                )}

                {/* Footer */}
                <div className="flex justify-between items-center text-xs text-muted-foreground pt-2 border-t">
                  <span>Started: {formatDate(goal.startDate)}</span>
                  <span>Last updated: {formatDate(goal.lastUpdated)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredGoals.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No goals found.</p>
            <button
              onClick={() => setShowAddGoal(true)}
              className="mt-4 px-4 py-2 text-primary hover:underline"
            >
              Create your first goal
            </button>
          </CardContent>
        </Card>
      )}

      {/* Add Goal Modal (placeholder) */}
      {showAddGoal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <h2 className="text-lg font-semibold">Add ILS Goal</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Goal creation form coming soon. This will allow setting mastery targets,
                due dates, and criteria for ILS skills.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowAddGoal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-muted"
                >
                  Close
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
