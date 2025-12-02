'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { TransitionTimeline } from '@/components/transition';

/**
 * Transition Services Dashboard
 * IDEA-mandated transition planning for students 14+
 * 
 * Displays:
 * - Transition plan overview
 * - Timeline with upcoming milestones
 * - Quick stats and progress indicators
 * - Links to all transition areas
 */

// Mock data - replace with API calls
const mockTransitionPlan = {
  id: 'tp-001',
  learnerId: 'learner-001',
  status: 'active',
  startDate: '2024-01-15',
  expectedGraduationDate: '2026-05-30',
  transitionCoordinatorId: 'teacher-001',
  postSecondaryGoals: {
    education: 'Attend community college for automotive technology program',
    employment: 'Become a certified automotive technician',
    independentLiving: 'Live independently in an apartment with minimal support',
  },
  strengthsInterests: {
    strengths: ['Mechanical aptitude', 'Problem-solving', 'Hands-on learning', 'Attention to detail'],
    interests: ['Cars and trucks', 'Technology', 'Building things', 'Video games'],
    preferences: ['Visual instructions', 'Quiet environment', 'Clear expectations'],
  },
  assessmentSummary: 'Strong vocational aptitude in mechanical/technical fields. Self-determination skills developing.',
  interagencyCollaboration: ['Vocational Rehabilitation', 'Community College Disability Services'],
};

const mockMilestones = [
  {
    id: 'm1',
    date: '2024-01-15',
    title: 'Initial Transition Meeting',
    description: 'Completed initial transition assessment and goal setting',
    category: 'meeting' as const,
    status: 'completed' as const,
  },
  {
    id: 'm2',
    date: '2024-02-20',
    title: 'Self-Determination Assessment',
    description: 'Completed AIR Self-Determination Scale',
    category: 'assessment' as const,
    status: 'completed' as const,
  },
  {
    id: 'm3',
    date: '2024-03-15',
    title: 'Job Shadow - Auto Shop',
    description: 'Job shadowing at Johnson Auto Repair',
    category: 'employment' as const,
    status: 'completed' as const,
  },
  {
    id: 'm4',
    date: '2024-05-01',
    title: 'Career Interest Inventory',
    description: 'Complete updated career interest assessment',
    category: 'assessment' as const,
    status: 'in-progress' as const,
  },
  {
    id: 'm5',
    date: '2024-06-15',
    title: 'Summer Work Experience',
    description: 'Begin paid work experience at partner auto shop',
    category: 'employment' as const,
    status: 'upcoming' as const,
  },
  {
    id: 'm6',
    date: '2024-09-01',
    title: 'College Visit',
    description: 'Visit community college automotive technology program',
    category: 'education' as const,
    status: 'upcoming' as const,
  },
  {
    id: 'm7',
    date: '2025-01-15',
    title: 'Annual IEP Transition Review',
    description: 'Annual review of transition goals and services',
    category: 'meeting' as const,
    status: 'upcoming' as const,
  },
];

const quickLinks = [
  { title: 'College Prep', href: 'transition/college', icon: '🎓', description: 'Search colleges, track applications' },
  { title: 'Work Experience', href: 'transition/work', icon: '💼', description: 'Job shadows, internships, employment' },
  { title: 'Vocational Pathways', href: 'transition/vocational', icon: '🔧', description: 'Trade programs, certifications' },
  { title: 'Self-Determination', href: 'transition/self-determination', icon: '🎯', description: 'Assessments, person-centered planning' },
  { title: 'Goals', href: 'transition/goals', icon: '📋', description: 'Track transition goal progress' },
];

export default function TransitionDashboardPage() {
  const params = useParams();
  const learnerId = params?.learnerId as string;

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transition Services</h1>
          <p className="text-gray-600">
            IDEA-mandated post-secondary planning • Ages 14+
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            Generate Report
          </button>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            Edit Plan
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Plan Status</div>
            <div className="text-2xl font-bold text-green-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Goals Progress</div>
            <div className="text-2xl font-bold">3/7</div>
            <div className="text-xs text-gray-500">goals in progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Work Experience</div>
            <div className="text-2xl font-bold">24</div>
            <div className="text-xs text-gray-500">hours completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Days to Graduation</div>
            <div className="text-2xl font-bold text-indigo-600">
              {Math.ceil((new Date(mockTransitionPlan.expectedGraduationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Post-Secondary Goals */}
      <Card>
        <CardHeader title="Post-Secondary Goals" subtitle="Vision for life after high school" />
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🎓</span>
                <h4 className="font-semibold">Education/Training</h4>
              </div>
              <p className="text-sm text-gray-600">{mockTransitionPlan.postSecondaryGoals.education}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">💼</span>
                <h4 className="font-semibold">Employment</h4>
              </div>
              <p className="text-sm text-gray-600">{mockTransitionPlan.postSecondaryGoals.employment}</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">🏠</span>
                <h4 className="font-semibold">Independent Living</h4>
              </div>
              <p className="text-sm text-gray-600">{mockTransitionPlan.postSecondaryGoals.independentLiving}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths & Interests */}
      <Card>
        <CardHeader title="Strengths & Interests" subtitle="Building on student capabilities" />
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold text-green-700 mb-2">💪 Strengths</h4>
              <div className="flex flex-wrap gap-2">
                {mockTransitionPlan.strengthsInterests.strengths.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-blue-700 mb-2">⭐ Interests</h4>
              <div className="flex flex-wrap gap-2">
                {mockTransitionPlan.strengthsInterests.interests.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-theme-primary mb-2">✨ Preferences</h4>
              <div className="flex flex-wrap gap-2">
                {mockTransitionPlan.strengthsInterests.preferences.map((s, i) => (
                  <span key={i} className="px-2 py-1 bg-theme-primary/10 text-theme-primary rounded text-sm">{s}</span>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <TransitionTimeline
        milestones={mockMilestones}
        graduationDate={mockTransitionPlan.expectedGraduationDate}
        learnerName="Student"
        onMilestoneClick={(milestone) => console.log('Milestone clicked:', milestone)}
      />

      {/* Quick Links */}
      <Card>
        <CardHeader title="Transition Areas" />
        <CardContent>
          <div className="grid md:grid-cols-5 gap-4">
            {quickLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="block p-4 rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
              >
                <span className="text-3xl block mb-2">{link.icon}</span>
                <h4 className="font-semibold">{link.title}</h4>
                <p className="text-xs text-gray-500 mt-1">{link.description}</p>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agency Collaboration */}
      <Card>
        <CardHeader title="Interagency Collaboration" subtitle="Community partners supporting transition" />
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {mockTransitionPlan.interagencyCollaboration.map((agency, i) => (
              <span key={i} className="px-4 py-2 bg-gray-100 rounded-lg flex items-center gap-2">
                <span className="text-lg">🤝</span>
                {agency}
              </span>
            ))}
            <button className="px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-indigo-400 hover:text-indigo-600">
              + Add Partner Agency
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
