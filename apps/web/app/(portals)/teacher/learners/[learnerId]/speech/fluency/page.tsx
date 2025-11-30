'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Activity,
  ArrowLeft,
  Plus,
  TrendingUp,
  Clock,
  BarChart3,
  Timer,
} from 'lucide-react';
import { FluencyCounter } from '@/components/slp/FluencyCounter';
import { FluencySummary } from '@/components/slp/FluencySummary';

/**
 * Fluency Therapy Page
 * Manages stuttering tracking, fluency techniques, and progress monitoring
 */

// Mock data - replace with API calls
const mockFluencyProfile = {
  id: 'fluency-1',
  stutteringType: 'DEVELOPMENTAL',
  stutteringSeverity: 'MODERATE',
  primaryBehaviors: ['BLOCKS', 'REPETITIONS'],
  secondaryBehaviors: ['Eye blinking', 'Head nods'],
  avoidanceBehaviors: ['Word substitution'],
  techniques: ['Easy onset', 'Prolonged speech', 'Light contacts'],
};

const mockRecentSessions = [
  {
    id: '1',
    date: '2025-11-28',
    duration: 30,
    syllablesSpoken: 450,
    disfluencies: 23,
    percentStuttered: 5.1,
    rating: 'Good',
  },
  {
    id: '2',
    date: '2025-11-25',
    duration: 30,
    syllablesSpoken: 420,
    disfluencies: 30,
    percentStuttered: 7.1,
    rating: 'Fair',
  },
  {
    id: '3',
    date: '2025-11-21',
    duration: 30,
    syllablesSpoken: 380,
    disfluencies: 35,
    percentStuttered: 9.2,
    rating: 'Fair',
  },
];

export default function FluencyPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';
  const [activeTab, setActiveTab] = useState<'overview' | 'counter' | 'summary'>('overview');

  const profile = mockFluencyProfile;
  const recentSessions = mockRecentSessions;

  const avgPercent =
    recentSessions.length > 0
      ? (
          recentSessions.reduce((sum, s) => sum + s.percentStuttered, 0) / recentSessions.length
        ).toFixed(1)
      : '0';

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'MILD':
        return 'bg-green-100 text-green-700';
      case 'MODERATE':
        return 'bg-yellow-100 text-yellow-700';
      case 'SEVERE':
        return 'bg-orange-100 text-orange-700';
      case 'VERY_SEVERE':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

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
          <h1 className="text-3xl font-bold text-slate-900">Fluency Therapy</h1>
          <p className="text-slate-500">Stuttering management and fluency techniques</p>
        </div>
        <button
          onClick={() => setActiveTab('counter')}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          <Timer className="h-4 w-4" />
          Start Session
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'counter', label: 'Fluency Counter', icon: Timer },
          { id: 'summary', label: 'Session Summary', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Profile Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-slate-500" />
                <span className="text-lg font-semibold text-slate-900">Fluency Profile</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500">Stuttering Type</div>
                    <Badge className="bg-purple-100 text-purple-700 capitalize">
                      {profile.stutteringType.toLowerCase().replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500">Severity</div>
                    <Badge className={getSeverityColor(profile.stutteringSeverity)}>
                      {profile.stutteringSeverity.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Primary Behaviors</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.primaryBehaviors.map((behavior) => (
                        <Badge key={behavior} className="bg-slate-100 text-slate-700">
                          {behavior.toLowerCase()}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Secondary Behaviors</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.secondaryBehaviors.map((behavior) => (
                        <Badge key={behavior} className="bg-orange-100 text-orange-700">
                          {behavior}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-slate-500 mb-2">Fluency Techniques</div>
                    <div className="flex flex-wrap gap-1">
                      {profile.techniques.map((technique) => (
                        <Badge key={technique} className="bg-green-100 text-green-700">
                          {technique}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{recentSessions.length}</div>
                <div className="text-xs text-slate-500">Total Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{avgPercent}%</div>
                <div className="text-xs text-slate-500">Avg % Stuttered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {recentSessions[0]?.percentStuttered || 0}%
                </div>
                <div className="text-xs text-slate-500">Latest Session</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto text-green-600" />
                <div className="text-xs text-slate-500">Improving</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Sessions */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-slate-500" />
                <span className="text-lg font-semibold text-slate-900">Recent Sessions</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-slate-900">
                        {new Date(session.date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-slate-500">
                        {session.syllablesSpoken} syllables • {session.disfluencies} disfluencies
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{session.percentStuttered}%</div>
                        <div className="text-xs text-slate-500">stuttered</div>
                      </div>
                      <Badge
                        className={
                          session.rating === 'Good'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }
                      >
                        {session.rating}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Counter Tab */}
      {activeTab === 'counter' && (
        <FluencyCounter
          learnerId={learnerId}
          sessionId={`session-${Date.now()}`}
          taskType="Conversation"
          taskDescription="General conversation practice"
          onSave={async (data) => {
            console.log('Session saved:', data);
            setActiveTab('summary');
          }}
        />
      )}

      {/* Summary Tab */}
      {activeTab === 'summary' && (
        <FluencySummary
          learnerId={learnerId}
          periodDays={30}
          totalSessions={recentSessions.length}
          baselineFrequency={12.5}
          currentFrequency={recentSessions[0]?.percentStuttered || 0}
          goalFrequency={3.0}
          averageFrequency={parseFloat(avgPercent)}
          frequencyTrend={recentSessions.map((s) => ({
            date: s.date,
            frequency: s.percentStuttered,
            taskType: 'Conversation',
          }))}
          disfluencyBreakdown={{
            repetitions: 45,
            prolongations: 25,
            blocks: 20,
            interjections: 10,
            percentages: {
              repetitions: 45,
              prolongations: 25,
              blocks: 20,
              interjections: 10,
            },
          }}
          techniqueUsage={{
            'Easy onset': 75,
            'Prolonged speech': 60,
            'Light contacts': 45,
          }}
        />
      )}
    </div>
  );
}
