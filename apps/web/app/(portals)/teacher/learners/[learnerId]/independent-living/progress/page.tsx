'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { SkillProgressTracker, DataPointRecorder, GeneralizationMatrix } from '@/components/ils';
import { ArrowLeft, Plus, BarChart3, Grid3X3 } from 'lucide-react';

/**
 * Progress Tracking Page
 * Track learner progress on ILS skills with data collection
 */

// Mock progress data - replace with API calls
const mockSkillsProgress = [
  {
    skillId: 'skill-1',
    skillName: 'Identifying Coins',
    domain: 'MONEY_MANAGEMENT',
    currentMasteryLevel: 'PROFICIENT',
    percentageComplete: 85,
    lastPracticed: '2024-05-15',
    taskSteps: [
      { stepNumber: 1, description: 'Pick up coin', percentageComplete: 100, isComplete: true },
      { stepNumber: 2, description: 'Look at size and color', percentageComplete: 100, isComplete: true },
      { stepNumber: 3, description: 'Name the coin', percentageComplete: 75, isComplete: false },
    ],
    recentDataPoints: [
      { id: 'dp1', recordedAt: '2024-05-15', prompt: 'INDEPENDENT', accuracy: 90, setting: 'classroom' },
      { id: 'dp2', recordedAt: '2024-05-14', prompt: 'VERBAL', accuracy: 85, setting: 'home' },
      { id: 'dp3', recordedAt: '2024-05-12', prompt: 'VERBAL', accuracy: 80, setting: 'classroom' },
    ],
    goalStatus: { targetMastery: 'MASTERED', targetDate: '2024-06-30', onTrack: true },
    generalizationSettings: ['classroom', 'home', 'store'],
  },
  {
    skillId: 'skill-2',
    skillName: 'Counting Coins to $1.00',
    domain: 'MONEY_MANAGEMENT',
    currentMasteryLevel: 'DEVELOPING',
    percentageComplete: 55,
    lastPracticed: '2024-05-14',
    taskSteps: [
      { stepNumber: 1, description: 'Sort coins by type', percentageComplete: 80, isComplete: false },
      { stepNumber: 2, description: 'Count quarters first', percentageComplete: 70, isComplete: false },
      { stepNumber: 3, description: 'Add dimes', percentageComplete: 50, isComplete: false },
      { stepNumber: 4, description: 'Add nickels', percentageComplete: 40, isComplete: false },
      { stepNumber: 5, description: 'Add pennies', percentageComplete: 60, isComplete: false },
      { stepNumber: 6, description: 'State total amount', percentageComplete: 30, isComplete: false },
    ],
    recentDataPoints: [
      { id: 'dp4', recordedAt: '2024-05-14', prompt: 'MODEL', accuracy: 65, setting: 'classroom' },
      { id: 'dp5', recordedAt: '2024-05-13', prompt: 'MODEL', accuracy: 60, setting: 'classroom' },
    ],
    goalStatus: { targetMastery: 'PROFICIENT', targetDate: '2024-08-15', onTrack: true },
    generalizationSettings: ['classroom'],
  },
  {
    skillId: 'skill-3',
    skillName: 'Making a Sandwich',
    domain: 'COOKING_NUTRITION',
    currentMasteryLevel: 'EMERGING',
    percentageComplete: 35,
    lastPracticed: '2024-05-13',
    recentDataPoints: [
      { id: 'dp6', recordedAt: '2024-05-13', prompt: 'PARTIAL_PHYSICAL', accuracy: 45, setting: 'home' },
    ],
    generalizationSettings: ['home'],
  },
  {
    skillId: 'skill-4',
    skillName: 'Sorting Laundry',
    domain: 'HOUSING_HOME_CARE',
    currentMasteryLevel: 'MASTERED',
    percentageComplete: 95,
    lastPracticed: '2024-05-10',
    recentDataPoints: [
      { id: 'dp7', recordedAt: '2024-05-10', prompt: 'INDEPENDENT', accuracy: 100, setting: 'home' },
      { id: 'dp8', recordedAt: '2024-05-08', prompt: 'INDEPENDENT', accuracy: 95, setting: 'laundromat' },
    ],
    goalStatus: { targetMastery: 'GENERALIZED', targetDate: '2024-06-01', onTrack: true },
    generalizationSettings: ['home', 'laundromat', 'dorm'],
  },
];

// Mock generalization data
const mockGeneralizationData = [
  {
    skillId: 'skill-1',
    skillName: 'Identifying Coins',
    targetSettings: ['CLASSROOM', 'HOME', 'COMMUNITY_STORE'],
    records: {
      'CLASSROOM': {
        setting: 'CLASSROOM',
        locationName: 'Room 105',
        isIntroduced: true,
        introducedDate: '2024-01-15',
        isMastered: true,
        masteredDate: '2024-04-20',
        trialsAttempted: 20,
        trialsSuccessful: 19,
        successRate: 95,
        currentPromptLevel: 'INDEPENDENT',
        supportsNeeded: [],
        barriers: [],
        accommodations: [],
      },
      'HOME': {
        setting: 'HOME',
        locationName: 'Home',
        isIntroduced: true,
        introducedDate: '2024-02-01',
        isMastered: false,
        trialsAttempted: 12,
        trialsSuccessful: 10,
        successRate: 83,
        currentPromptLevel: 'VERBAL_INDIRECT',
        supportsNeeded: ['Visual reminder chart'],
        barriers: ['Distractions from siblings'],
        accommodations: ['Quiet area for practice'],
      },
      'COMMUNITY_STORE': {
        setting: 'COMMUNITY_STORE',
        locationName: 'Target',
        isIntroduced: true,
        introducedDate: '2024-03-15',
        isMastered: false,
        trialsAttempted: 5,
        trialsSuccessful: 3,
        successRate: 60,
        currentPromptLevel: 'VERBAL_DIRECT',
        supportsNeeded: ['Visual coin chart', 'Extra time'],
        barriers: ['Noise', 'Line pressure'],
        accommodations: ['Use quiet checkout lane'],
      },
    },
  },
  {
    skillId: 'skill-4',
    skillName: 'Sorting Laundry',
    targetSettings: ['HOME', 'COMMUNITY_STORE', 'SCHOOL_COMMON'],
    records: {
      'HOME': {
        setting: 'HOME',
        locationName: 'Home',
        isIntroduced: true,
        introducedDate: '2024-01-10',
        isMastered: true,
        masteredDate: '2024-03-15',
        trialsAttempted: 15,
        trialsSuccessful: 15,
        successRate: 100,
        currentPromptLevel: 'INDEPENDENT',
        supportsNeeded: [],
        barriers: [],
        accommodations: [],
      },
      'COMMUNITY_STORE': {
        setting: 'COMMUNITY_STORE',
        locationName: 'Local Laundromat',
        isIntroduced: true,
        introducedDate: '2024-03-20',
        isMastered: true,
        masteredDate: '2024-05-01',
        trialsAttempted: 8,
        trialsSuccessful: 8,
        successRate: 100,
        currentPromptLevel: 'INDEPENDENT',
        supportsNeeded: [],
        barriers: [],
        accommodations: [],
      },
      'SCHOOL_COMMON': {
        setting: 'SCHOOL_COMMON',
        locationName: 'School Life Skills Room',
        isIntroduced: false,
        isMastered: false,
        trialsAttempted: 0,
        trialsSuccessful: 0,
        supportsNeeded: [],
        barriers: [],
        accommodations: [],
      },
    },
  },
];

export default function ProgressPage() {
  const params = useParams();
  const learnerId = params?.learnerId as string;
  const [view, setView] = useState<'progress' | 'record' | 'generalization'>('progress');
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);

  const basePath = `/teacher/learners/${learnerId}/independent-living`;

  const handleRecordData = (skillId: string) => {
    setSelectedSkillId(skillId);
    setView('record');
  };

  const handleDataSubmit = (data: {
    prompt: string;
    accuracy: number;
    setting: string;
    stepData?: Array<{ stepNumber: number; correct: boolean; promptUsed: string }>;
    notes?: string;
  }) => {
    console.log('Data submitted:', data);
    alert('Data recorded successfully! (Demo)');
    setView('progress');
    setSelectedSkillId(null);
  };

  const selectedSkill = mockSkillsProgress.find((s) => s.skillId === selectedSkillId);

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
            <h1 className="text-2xl font-bold">Progress Tracking</h1>
            <p className="text-muted-foreground">
              Track skill progress and collect data
            </p>
          </div>
        </div>
        
        {/* View Toggle */}
        <div className="flex gap-1 border rounded-md">
          <button
            onClick={() => setView('progress')}
            className={`px-4 py-2 text-sm rounded-l-md flex items-center gap-2 ${
              view === 'progress' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Progress
          </button>
          <button
            onClick={() => setView('generalization')}
            className={`px-4 py-2 text-sm rounded-r-md flex items-center gap-2 ${
              view === 'generalization' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
            }`}
          >
            <Grid3X3 className="h-4 w-4" />
            Generalization
          </button>
        </div>
      </div>

      {/* Content */}
      {view === 'progress' && (
        <SkillProgressTracker
          skills={mockSkillsProgress}
          onSkillSelect={(skillId) => {
            setSelectedSkillId(skillId);
          }}
          onRecordData={handleRecordData}
        />
      )}

      {view === 'record' && selectedSkill && (
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setView('progress')}
            className="mb-4 text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Progress
          </button>
          <DataPointRecorder
            skillId={selectedSkill.skillId}
            skillName={selectedSkill.skillName}
            steps={selectedSkill.taskSteps?.map((s) => ({
              stepNumber: s.stepNumber,
              description: s.description,
            })) || []}
            settings={['classroom', 'home', 'community', 'school-cafeteria']}
            onSave={(data) => {
              console.log('Data submitted:', data);
              alert('Data recorded successfully! (Demo)');
              setView('progress');
              setSelectedSkillId(null);
            }}
          />
        </div>
      )}

      {view === 'generalization' && (
        <div className="space-y-6">
          {mockGeneralizationData.map((skillData) => (
            <GeneralizationMatrix
              key={skillData.skillId}
              skillId={skillData.skillId}
              skillName={skillData.skillName}
              targetSettings={skillData.targetSettings}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              records={skillData.records as any}
              onSettingClick={(setting: string) => {
                console.log('Setting clicked:', setting);
                alert(`View details for "${setting}"! (Demo)`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
