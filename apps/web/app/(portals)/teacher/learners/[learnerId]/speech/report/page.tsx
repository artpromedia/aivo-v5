'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';
import { SLPProgressReport } from '@/components/slp/SLPProgressReport';

/**
 * SLP Progress Report Page
 * Generate comprehensive progress reports for IEP meetings and parent communication
 */

// Mock data - replace with API calls
const mockProfile = {
  id: 'profile-1',
  primaryDiagnosis: 'Speech Sound Disorder, Fluency Disorder',
  secondaryDiagnoses: ['Mild Receptive Language Delay'],
  iepStartDate: '2025-09-01',
  iepEndDate: '2026-08-31',
  serviceMinutesPerWeek: 60,
  sessionFrequency: '2x weekly, 30 minutes each',
};

const mockGoals = [
  {
    id: 'goal-1',
    goalArea: 'ARTICULATION' as const,
    shortTermObjective: 'Produce /r/ in initial position with 80% accuracy',
    longTermGoal:
      'By the end of the IEP year, student will produce the /r/ sound in all positions at the conversational level with 80% accuracy.',
    baseline: '20% accuracy',
    targetCriteria: '80% across 3 sessions',
    targetDate: '2026-05-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 65,
    progressHistory: [
      { date: '2025-09-15', progress: 20, notes: 'Baseline' },
      { date: '2025-10-01', progress: 35, notes: 'Improving' },
      { date: '2025-10-15', progress: 45, notes: 'Word level' },
      { date: '2025-11-01', progress: 55, notes: 'Phrase level' },
      { date: '2025-11-15', progress: 60, notes: 'Good progress' },
      { date: '2025-11-28', progress: 65, notes: 'Maintaining' },
    ],
    iepGoalNumber: '1.1',
  },
  {
    id: 'goal-2',
    goalArea: 'ARTICULATION' as const,
    shortTermObjective: 'Produce /s/ in initial position with 80% accuracy',
    longTermGoal: 'Produce /s/ in conversation with 80% accuracy',
    baseline: '60% accuracy',
    targetCriteria: '80% across 3 sessions',
    targetDate: '2026-03-15',
    status: 'MASTERED' as const,
    currentProgress: 85,
    progressHistory: [
      { date: '2025-09-15', progress: 60, notes: 'Baseline' },
      { date: '2025-10-15', progress: 75, notes: 'Improving' },
      { date: '2025-11-01', progress: 80, notes: 'Target met' },
      { date: '2025-11-15', progress: 85, notes: 'Mastered' },
    ],
    iepGoalNumber: '1.2',
  },
  {
    id: 'goal-3',
    goalArea: 'FLUENCY' as const,
    shortTermObjective: 'Use easy onset technique with 70% success in structured conversation',
    longTermGoal: 'Demonstrate fluent speech with less than 5% stuttering in classroom settings',
    baseline: '12% stuttering',
    targetCriteria: 'Less than 5% stuttering',
    targetDate: '2026-05-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 45,
    progressHistory: [
      { date: '2025-09-15', progress: 20, notes: 'Learning easy onset' },
      { date: '2025-10-15', progress: 35, notes: 'Using in therapy' },
      { date: '2025-11-15', progress: 45, notes: 'Generalizing' },
    ],
    iepGoalNumber: '2.1',
  },
  {
    id: 'goal-4',
    goalArea: 'RECEPTIVE_LANGUAGE' as const,
    shortTermObjective: 'Follow 2-step directions with 80% accuracy',
    longTermGoal: 'Follow multi-step directions in classroom settings',
    baseline: '50% accuracy',
    targetCriteria: '80% across 3 sessions',
    targetDate: '2026-02-15',
    status: 'IN_PROGRESS' as const,
    currentProgress: 70,
    progressHistory: [
      { date: '2025-09-15', progress: 50, notes: 'Baseline' },
      { date: '2025-10-15', progress: 60, notes: 'Improving' },
      { date: '2025-11-15', progress: 70, notes: 'Good progress' },
    ],
    iepGoalNumber: '3.1',
  },
];

const mockSessions = [
  {
    id: 'session-1',
    sessionDate: '2025-11-28',
    sessionType: 'ARTICULATION' as const,
    durationMinutes: 30,
    activities: ['Word drills', 'Picture naming', 'Conversation practice'],
    progressNotes: 'Good session. Student maintained 65% accuracy on /r/ initial.',
    goalsAddressed: ['goal-1', 'goal-2'],
  },
  {
    id: 'session-2',
    sessionDate: '2025-11-25',
    sessionType: 'ARTICULATION' as const,
    durationMinutes: 30,
    activities: ['Minimal pairs', 'Sentence level practice'],
    progressNotes: 'Student showing progress at phrase level.',
    goalsAddressed: ['goal-1'],
  },
  {
    id: 'session-3',
    sessionDate: '2025-11-21',
    sessionType: 'FLUENCY' as const,
    durationMinutes: 30,
    activities: ['Easy onset practice', 'Reading aloud', 'Conversation'],
    progressNotes: 'Practiced easy onset in structured conversation. 45% success rate.',
    goalsAddressed: ['goal-3'],
  },
  {
    id: 'session-4',
    sessionDate: '2025-11-18',
    sessionType: 'RECEPTIVE_LANGUAGE' as const,
    durationMinutes: 30,
    activities: ['Following directions game', 'Barrier tasks'],
    progressNotes: 'Good accuracy with visual supports. 70% with 2-step directions.',
    goalsAddressed: ['goal-4'],
  },
  {
    id: 'session-5',
    sessionDate: '2025-11-14',
    sessionType: 'ARTICULATION' as const,
    durationMinutes: 30,
    activities: ['Word drills', 'Reading practice'],
    progressNotes: 'Continued work on /r/ initial. 60% accuracy.',
    goalsAddressed: ['goal-1'],
  },
  {
    id: 'session-6',
    sessionDate: '2025-11-11',
    sessionType: 'FLUENCY' as const,
    durationMinutes: 30,
    activities: ['Fluency shaping', 'Rate control'],
    progressNotes: 'Introduced rate control technique.',
    goalsAddressed: ['goal-3'],
  },
];

const mockArticulationTargets = [
  { phoneme: 'r', position: 'initial', currentAccuracy: 65 },
  { phoneme: 'r', position: 'medial', currentAccuracy: 45 },
  { phoneme: 's', position: 'initial', currentAccuracy: 85 },
  { phoneme: 'l', position: 'initial', currentAccuracy: 75 },
];

export default function ReportPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';

  // Calculate reporting period (last 3 months)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 3);

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
          <h1 className="text-3xl font-bold text-slate-900">Progress Report</h1>
          <p className="text-slate-500">Generate comprehensive SLP progress reports</p>
        </div>
      </div>

      {/* Progress Report Component */}
      <SLPProgressReport
        learnerId={learnerId}
        learnerName="Student Name"
        dateOfBirth="2018-05-15"
        grade="2nd Grade"
        school="Sample Elementary School"
        profile={mockProfile}
        goals={mockGoals}
        sessions={mockSessions}
        articulationTargets={mockArticulationTargets}
        reportingPeriod={{
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0],
        }}
        therapistName="Jane Smith"
        therapistCredentials="M.A., CCC-SLP"
        onExport={async (format) => {
          console.log('Exporting report as:', format);
        }}
        onSendToParent={async () => {
          console.log('Sending report to parent');
        }}
      />
    </div>
  );
}
