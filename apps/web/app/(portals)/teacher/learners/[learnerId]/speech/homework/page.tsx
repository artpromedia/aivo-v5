'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home } from 'lucide-react';
import { ParentHomeworkAssigner } from '@/components/slp/ParentHomeworkAssigner';

/**
 * SLP Homework Page
 * Parent communication and home practice assignments
 */

// Mock data - replace with API calls
const mockHomework = [
  {
    id: 'hw-1',
    slpProfileId: 'profile-1',
    goalArea: 'ARTICULATION' as const,
    title: '/r/ Sound Practice Cards',
    instructions:
      'Practice the /r/ sound using the picture cards. Say each word 3 times clearly. Focus on the initial /r/ sound. Praise your child for good attempts!',
    targetSkills: ['Initial /r/ production', 'Word-level practice'],
    materials: ['Picture cards', 'Mirror'],
    videoUrl: null,
    audioModelUrl: null,
    imageUrls: [],
    frequencyPerWeek: 5,
    durationMinutes: 10,
    assignedDate: '2025-11-25',
    dueDate: '2025-12-02',
    status: 'IN_PROGRESS' as const,
    parentNotes: 'We practiced 4 times this week. He seems to be getting better!',
    completionLogs: [
      { date: '2025-11-26', durationMinutes: 10, completed: true, accuracy: 60, parentRating: 4 },
      { date: '2025-11-27', durationMinutes: 12, completed: true, accuracy: 65, parentRating: 4 },
      { date: '2025-11-28', durationMinutes: 10, completed: true, accuracy: 70, parentRating: 5 },
    ],
    createdAt: '2025-11-25',
    updatedAt: '2025-11-28',
  },
  {
    id: 'hw-2',
    slpProfileId: 'profile-1',
    goalArea: 'FLUENCY' as const,
    title: 'Easy Starts Practice',
    instructions:
      'Practice starting words with a gentle, easy onset. Begin with single words, then try short phrases. Keep it fun and pressure-free! Model slow, easy speech yourself.',
    targetSkills: ['Easy onset', 'Smooth speech initiation'],
    materials: ['Word list provided'],
    videoUrl: null,
    audioModelUrl: null,
    imageUrls: [],
    frequencyPerWeek: 5,
    durationMinutes: 10,
    assignedDate: '2025-11-20',
    dueDate: '2025-11-27',
    status: 'COMPLETED' as const,
    parentNotes: 'Great progress! He remembered to use easy starts at dinner.',
    completionLogs: [
      { date: '2025-11-21', durationMinutes: 10, completed: true, notes: 'Did well with single words' },
      { date: '2025-11-22', durationMinutes: 15, completed: true, notes: 'Tried phrases' },
      { date: '2025-11-24', durationMinutes: 10, completed: true, notes: 'Good session' },
      { date: '2025-11-25', durationMinutes: 10, completed: true, notes: 'Used at dinner' },
      { date: '2025-11-26', durationMinutes: 12, completed: true, notes: 'Excellent!' },
    ],
    createdAt: '2025-11-20',
    updatedAt: '2025-11-27',
  },
  {
    id: 'hw-3',
    slpProfileId: 'profile-1',
    goalArea: 'RECEPTIVE_LANGUAGE' as const,
    title: 'Following Directions Game',
    instructions:
      'Give your child 2-step directions during daily activities. Start simple and gradually increase complexity. Make it a game! Examples: "Get your shoes and put them by the door." Use visual supports if needed.',
    targetSkills: ['Following 2-step directions', 'Auditory memory'],
    materials: ['None required - use household items'],
    videoUrl: null,
    audioModelUrl: null,
    imageUrls: [],
    frequencyPerWeek: 5,
    durationMinutes: 10,
    assignedDate: '2025-11-28',
    dueDate: '2025-12-05',
    status: 'ASSIGNED' as const,
    parentNotes: null,
    completionLogs: [],
    createdAt: '2025-11-28',
    updatedAt: '2025-11-28',
  },
];

export default function HomeworkPage() {
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
          <h1 className="text-3xl font-bold text-slate-900">Home Practice</h1>
          <p className="text-slate-500">Parent homework assignments and communication</p>
        </div>
      </div>

      {/* Homework Assigner */}
      <ParentHomeworkAssigner
        learnerId={learnerId}
        profileId="profile-1"
        learnerName="Student"
        homework={mockHomework}
        onHomeworkCreate={async (homework) => {
          console.log('Creating homework:', homework);
        }}
        onHomeworkUpdate={async (id, updates) => {
          console.log('Updating homework:', id, updates);
        }}
        onHomeworkDelete={async (id) => {
          console.log('Deleting homework:', id);
        }}
        onSendToParent={async (homeworkId) => {
          console.log('Sending to parent:', homeworkId);
        }}
      />
    </div>
  );
}
