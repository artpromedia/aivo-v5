'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  Activity,
  BookOpen,
  MessageSquare,
  Target,
  Calendar,
  FileText,
  Home,
  TrendingUp,
  Clock,
  ChevronRight,
  Plus,
} from 'lucide-react';

/**
 * Speech-Language Pathology (SLP) Dashboard
 * Comprehensive speech therapy management for special education
 * 
 * Features:
 * - Overview of all therapy areas (Articulation, Fluency, Language, Pragmatic, Voice)
 * - IEP goal tracking
 * - Session management
 * - Parent homework assignments
 * - Progress reporting
 */

// Therapy area configuration
const therapyAreas = [
  {
    id: 'articulation',
    label: 'Articulation',
    icon: Mic,
    color: 'bg-blue-100 text-blue-700',
    description: 'Sound production and phonological processes',
  },
  {
    id: 'fluency',
    label: 'Fluency',
    icon: Activity,
    color: 'bg-purple-100 text-purple-700',
    description: 'Stuttering and speech flow management',
  },
  {
    id: 'language',
    label: 'Language',
    icon: BookOpen,
    color: 'bg-green-100 text-green-700',
    description: 'Receptive and expressive language skills',
  },
  {
    id: 'pragmatic',
    label: 'Pragmatic/Social',
    icon: MessageSquare,
    color: 'bg-pink-100 text-pink-700',
    description: 'Social communication and pragmatic skills',
  },
  {
    id: 'voice',
    label: 'Voice',
    icon: Target,
    color: 'bg-cyan-100 text-cyan-700',
    description: 'Voice quality and vocal hygiene',
  },
];

// Mock data - replace with API calls
const mockDashboardStats = {
  totalGoals: 5,
  goalsInProgress: 3,
  goalsMastered: 1,
  avgProgress: 62,
  upcomingSessions: 2,
  homeworkAssigned: 3,
};

const mockProfile = {
  primaryDiagnosis: 'Speech Sound Disorder',
  serviceMinutesPerWeek: 60,
  sessionFrequency: '2x weekly',
  iepStartDate: '2025-09-01',
  iepEndDate: '2026-08-31',
};

const mockAreaStats: Record<string, { skills: number; avgProgress: number }> = {
  articulation: { skills: 4, avgProgress: 72 },
  fluency: { skills: 2, avgProgress: 58 },
  language: { skills: 5, avgProgress: 65 },
  pragmatic: { skills: 3, avgProgress: 45 },
  voice: { skills: 1, avgProgress: 80 },
};

const mockRecentSessions = [
  { id: '1', date: '2025-11-28', type: 'Articulation', duration: 30, progress: 'Good' },
  { id: '2', date: '2025-11-25', type: 'Articulation', duration: 30, progress: 'Excellent' },
  { id: '3', date: '2025-11-21', type: 'Fluency', duration: 30, progress: 'Good' },
];

const mockArticulationTargets = [
  { phoneme: 'r', accuracy: 65 },
  { phoneme: 's', accuracy: 80 },
  { phoneme: 'l', accuracy: 75 },
];

export default function SpeechDashboardPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';

  // TODO: Replace with actual API calls
  const stats = mockDashboardStats;
  const profile = mockProfile;
  const areaStats = mockAreaStats;
  const recentSessions = mockRecentSessions;
  const articulationTargets = mockArticulationTargets;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Speech-Language Therapy</h1>
          <p className="text-slate-500">Comprehensive speech and language services</p>
        </div>
        <Link
          href={`/teacher/learners/${learnerId}/speech/sessions`}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Session
        </Link>
      </div>

      {/* Profile Summary */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <Badge className="bg-blue-100 text-blue-800">
              {profile.primaryDiagnosis}
            </Badge>
            <span className="text-sm text-slate-500 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {profile.serviceMinutesPerWeek} min/week ({profile.sessionFrequency})
            </span>
            <span className="text-sm text-slate-500">
              IEP: {new Date(profile.iepStartDate).toLocaleDateString()} -{' '}
              {new Date(profile.iepEndDate).toLocaleDateString()}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalGoals}</div>
            <div className="text-xs text-slate-500">Total Goals</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.goalsInProgress}</div>
            <div className="text-xs text-slate-500">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.goalsMastered}</div>
            <div className="text-xs text-slate-500">Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.avgProgress}%</div>
            <div className="text-xs text-slate-500">Avg Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-cyan-600">{stats.upcomingSessions}</div>
            <div className="text-xs text-slate-500">Upcoming</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-pink-600">{stats.homeworkAssigned}</div>
            <div className="text-xs text-slate-500">Homework</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { title: 'Sessions', href: 'sessions', icon: Calendar },
          { title: 'Goals', href: 'goals', icon: Target },
          { title: 'Homework', href: 'homework', icon: Home },
          { title: 'Reports', href: 'report', icon: FileText },
        ].map((link) => (
          <Link key={link.href} href={`/teacher/learners/${learnerId}/speech/${link.href}`}>
            <Card className="hover:bg-slate-50 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 flex items-center gap-3">
                <link.icon className="h-5 w-5 text-slate-500" />
                <span className="font-medium text-slate-900">{link.title}</span>
                <ChevronRight className="h-4 w-4 ml-auto text-slate-400" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Therapy Areas */}
      <div>
        <h2 className="text-xl font-semibold mb-4 text-slate-900">Therapy Areas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {therapyAreas.map((area) => {
            const areaData = areaStats[area.id] || { skills: 0, avgProgress: 0 };
            return (
              <Link key={area.id} href={`/teacher/learners/${learnerId}/speech/${area.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <div className={`p-2 rounded-lg ${area.color}`}>
                        <area.icon className="h-5 w-5" />
                      </div>
                      <Badge className="bg-slate-100 text-slate-700">
                        {areaData.skills} targets
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{area.label}</h3>
                    <p className="text-sm text-slate-500">{area.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Progress</span>
                        <span className="font-medium">{areaData.avgProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            areaData.avgProgress >= 80
                              ? 'bg-green-500'
                              : areaData.avgProgress >= 60
                                ? 'bg-yellow-500'
                                : 'bg-orange-500'
                          }`}
                          style={{ width: `${areaData.avgProgress}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Sessions & Articulation Progress */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-slate-500" />
              <span className="text-lg font-semibold text-slate-900">Recent Sessions</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div>
                    <div className="font-medium text-slate-900">
                      {new Date(session.date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-slate-500">
                      {session.type} • {session.duration} min
                    </div>
                  </div>
                  <Badge
                    className={
                      session.progress === 'Excellent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-blue-100 text-blue-700'
                    }
                  >
                    {session.progress}
                  </Badge>
                </div>
              ))}
              <Link
                href={`/teacher/learners/${learnerId}/speech/sessions`}
                className="block w-full py-2 text-center text-blue-600 hover:text-blue-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                View All Sessions
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Articulation Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-500" />
              <span className="text-lg font-semibold text-slate-900">Articulation Targets</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {articulationTargets.map((target, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">/{target.phoneme}/</span>
                    <span className="text-sm text-slate-500">{target.accuracy}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        target.accuracy >= 80
                          ? 'bg-green-500'
                          : target.accuracy >= 60
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${target.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
              <Link
                href={`/teacher/learners/${learnerId}/speech/articulation`}
                className="block w-full py-2 text-center text-blue-600 hover:text-blue-700 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                View All Targets
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
