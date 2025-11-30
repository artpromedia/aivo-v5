'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { ArrowLeft, Target } from 'lucide-react';
import { SLPGoalTracker } from '@/components/slp/SLPGoalTracker';

/**
 * SLP Goals Page
 * IEP goal management and progress tracking for speech-language therapy
 */

// Mock data - replace with API calls
const mockGoals = [
  {
    id: 'goal-1',
    slpProfileId: 'profile-1',
    goalArea: 'ARTICULATION' as const,
    shortTermObjective:
      'Student will produce the /r/ sound in the initial position of words with 80% accuracy.',
    longTermGoal:
      'By the end of the IEP year, student will produce the /r/ sound in all positions of words at the conversational level with 80% accuracy.',
    baseline: '20% accuracy at word level',
    targetCriteria: '80% accuracy across 3 consecutive sessions',
    targetDate: '2026-05-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 65,
    progressHistory: [
      { date: '2025-09-15', progress: 20, notes: 'Baseline data collected' },
      { date: '2025-10-01', progress: 35, notes: 'Improving with visual cues' },
      { date: '2025-10-15', progress: 45, notes: 'Consistent at word level' },
      { date: '2025-11-01', progress: 55, notes: 'Moving to phrase level' },
      { date: '2025-11-15', progress: 60, notes: 'Good progress' },
      { date: '2025-11-28', progress: 65, notes: 'Maintaining accuracy' },
    ],
    iepGoalNumber: '1.1',
    strategies: ['Visual cues', 'Tactile feedback', 'Minimal pairs'],
    accommodations: ['Extended time', 'Frequent breaks'],
    notes: 'Student responds well to visual feedback and modeling.',
    createdAt: '2025-09-01',
    updatedAt: '2025-11-28',
  },
  {
    id: 'goal-2',
    slpProfileId: 'profile-1',
    goalArea: 'ARTICULATION' as const,
    shortTermObjective:
      'Student will produce the /s/ sound in initial position with 80% accuracy.',
    longTermGoal:
      'By the end of the IEP year, student will produce the /s/ sound correctly in conversation.',
    baseline: '60% accuracy at word level',
    targetCriteria: '80% accuracy across 3 consecutive sessions',
    targetDate: '2026-03-15',
    status: 'MASTERED' as const,
    currentProgress: 85,
    progressHistory: [
      { date: '2025-09-15', progress: 60, notes: 'Baseline' },
      { date: '2025-10-15', progress: 75, notes: 'Good improvement' },
      { date: '2025-11-01', progress: 80, notes: 'Target met' },
      { date: '2025-11-15', progress: 85, notes: 'Mastered' },
    ],
    iepGoalNumber: '1.2',
    strategies: ['Mirror work', 'Tongue placement cues'],
    accommodations: [],
    notes: 'Excellent progress - ready to move to conversational level.',
    createdAt: '2025-09-01',
    updatedAt: '2025-11-15',
  },
  {
    id: 'goal-3',
    slpProfileId: 'profile-1',
    goalArea: 'FLUENCY' as const,
    shortTermObjective:
      'Student will use easy onset technique in structured conversation with 70% success.',
    longTermGoal:
      'By the end of the IEP year, student will demonstrate fluent speech in classroom settings with less than 5% stuttering.',
    baseline: '12% stuttering in conversation',
    targetCriteria: 'Less than 5% stuttering across 3 sessions',
    targetDate: '2026-05-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 45,
    progressHistory: [
      { date: '2025-09-15', progress: 20, notes: 'Learning easy onset' },
      { date: '2025-10-15', progress: 35, notes: 'Using in therapy room' },
      { date: '2025-11-15', progress: 45, notes: 'Generalizing to classroom' },
    ],
    iepGoalNumber: '2.1',
    strategies: ['Easy onset', 'Light contacts', 'Slow rate'],
    accommodations: ['Extended response time', 'Reduced pressure'],
    notes: 'Student making steady progress. Focus on reducing secondary behaviors.',
    createdAt: '2025-09-01',
    updatedAt: '2025-11-15',
  },
  {
    id: 'goal-4',
    slpProfileId: 'profile-1',
    goalArea: 'RECEPTIVE_LANGUAGE' as const,
    shortTermObjective:
      'Student will follow 2-step directions with 80% accuracy in the therapy room.',
    longTermGoal:
      'By the end of the IEP year, student will follow multi-step directions in classroom settings.',
    baseline: '50% accuracy with 2-step directions',
    targetCriteria: '80% accuracy across 3 sessions',
    targetDate: '2026-02-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 70,
    progressHistory: [
      { date: '2025-09-15', progress: 50, notes: 'Baseline' },
      { date: '2025-10-15', progress: 60, notes: 'Improving with repetition' },
      { date: '2025-11-15', progress: 70, notes: 'Good progress' },
    ],
    iepGoalNumber: '3.1',
    strategies: ['Visual supports', 'Chunking', 'Repetition'],
    accommodations: ['Preferential seating', 'Repeated directions'],
    notes: 'Responds well to visual supports and chunked directions.',
    createdAt: '2025-09-01',
    updatedAt: '2025-11-15',
  },
];

export default function GoalsPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/teacher/learners/${learnerId}/speech`}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-slate-500" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-slate-900">IEP Goals</h1>
          <p className="text-slate-500">Speech-language therapy goal tracking</p>
        </div>
      </div>

      {/* Goal Tracker */}
      <SLPGoalTracker
        learnerId={learnerId}
        profileId="profile-1"
        goals={mockGoals}
        onGoalCreate={async (goal) => {
          console.log('Creating goal:', goal);
        }}
        onGoalUpdate={async (goalId, updates) => {
          console.log('Updating goal:', goalId, updates);
        }}
        onGoalDelete={async (goalId) => {
          console.log('Deleting goal:', goalId);
        }}
        onProgressUpdate={async (goalId, entry) => {
          console.log('Adding progress:', goalId, entry);
        }}
      />
    </div>
  );
}
