'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Plus,
  Filter,
  Search,
} from 'lucide-react';
import { SLPSessionNotes } from '@/components/slp/SLPSessionNotes';

/**
 * SLP Sessions Page
 * Session management and documentation for speech-language therapy
 */

// Mock data - replace with API calls
const mockSessions = [
  {
    id: 'session-1',
    sessionDate: '2025-11-28',
    sessionType: 'ARTICULATION',
    durationMinutes: 30,
    activities: ['Word drills', 'Picture naming', 'Conversation practice'],
    goalsAddressed: ['goal-1', 'goal-2'],
    progressNotes: 'Good session. Student maintained 65% accuracy on /r/ initial.',
    behaviorNotes: 'Focused and attentive throughout session.',
    parentCommunication: 'Sent home practice sheet for weekend.',
    status: 'COMPLETED',
  },
  {
    id: 'session-2',
    sessionDate: '2025-11-25',
    sessionType: 'ARTICULATION',
    durationMinutes: 30,
    activities: ['Minimal pairs', 'Sentence level practice'],
    goalsAddressed: ['goal-1'],
    progressNotes: 'Student showing progress at phrase level.',
    behaviorNotes: 'Some off-task behavior mid-session.',
    parentCommunication: null,
    status: 'COMPLETED',
  },
  {
    id: 'session-3',
    sessionDate: '2025-11-21',
    sessionType: 'FLUENCY',
    durationMinutes: 30,
    activities: ['Easy onset practice', 'Reading aloud', 'Conversation'],
    goalsAddressed: ['goal-3'],
    progressNotes: 'Practiced easy onset in structured conversation. 45% success rate.',
    behaviorNotes: 'Engaged and willing to try techniques.',
    parentCommunication: 'Discussed home practice strategies with parent.',
    status: 'COMPLETED',
  },
  {
    id: 'session-4',
    sessionDate: '2025-11-18',
    sessionType: 'RECEPTIVE_LANGUAGE',
    durationMinutes: 30,
    activities: ['Following directions game', 'Barrier tasks'],
    goalsAddressed: ['goal-4'],
    progressNotes: 'Good accuracy with visual supports. 70% with 2-step directions.',
    behaviorNotes: 'Highly motivated by game format.',
    parentCommunication: null,
    status: 'COMPLETED',
  },
];

const SESSION_TYPES: Record<string, { label: string; color: string }> = {
  ARTICULATION: { label: 'Articulation', color: 'bg-blue-100 text-blue-700' },
  FLUENCY: { label: 'Fluency', color: 'bg-purple-100 text-purple-700' },
  RECEPTIVE_LANGUAGE: { label: 'Receptive Language', color: 'bg-green-100 text-green-700' },
  EXPRESSIVE_LANGUAGE: { label: 'Expressive Language', color: 'bg-orange-100 text-orange-700' },
  PRAGMATIC_LANGUAGE: { label: 'Pragmatic', color: 'bg-pink-100 text-pink-700' },
  VOICE: { label: 'Voice', color: 'bg-cyan-100 text-cyan-700' },
  MIXED: { label: 'Mixed', color: 'bg-gray-100 text-gray-700' },
};

export default function SessionsPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';
  const [activeView, setActiveView] = useState<'list' | 'new'>('list');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const sessions = mockSessions;

  const filteredSessions = sessions.filter((session) => {
    if (filterType !== 'ALL' && session.sessionType !== filterType) return false;
    if (
      searchQuery &&
      !session.progressNotes.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !session.activities.some((a) => a.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false;
    }
    return true;
  });

  const totalMinutes = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
  const thisMonthSessions = sessions.filter((s) => {
    const sessionDate = new Date(s.sessionDate);
    const now = new Date();
    return (
      sessionDate.getMonth() === now.getMonth() && sessionDate.getFullYear() === now.getFullYear()
    );
  });

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
          <h1 className="text-3xl font-bold text-slate-900">Therapy Sessions</h1>
          <p className="text-slate-500">Session documentation and notes</p>
        </div>
        <button
          onClick={() => setActiveView(activeView === 'new' ? 'list' : 'new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          {activeView === 'new' ? (
            <>
              <Calendar className="h-4 w-4" />
              View Sessions
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              New Session
            </>
          )}
        </button>
      </div>

      {activeView === 'list' ? (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{sessions.length}</div>
                <div className="text-xs text-slate-500">Total Sessions</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{thisMonthSessions.length}</div>
                <div className="text-xs text-slate-500">This Month</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{totalMinutes}</div>
                <div className="text-xs text-slate-500">Total Minutes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(totalMinutes / sessions.length)}
                </div>
                <div className="text-xs text-slate-500">Avg Duration</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-slate-500" />
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="border border-slate-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="ALL">All Types</option>
                    {Object.entries(SESSION_TYPES).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search sessions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sessions List */}
          <div className="space-y-4">
            {filteredSessions.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center text-slate-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No sessions found. Create a new session to get started.</p>
                </CardContent>
              </Card>
            ) : (
              filteredSessions.map((session) => {
                const typeConfig = SESSION_TYPES[session.sessionType] || SESSION_TYPES.MIXED;
                return (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={typeConfig.color}>{typeConfig.label}</Badge>
                            <span className="text-sm text-slate-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {session.durationMinutes} min
                            </span>
                          </div>
                          <div className="font-medium text-slate-900">
                            {new Date(session.sessionDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </div>
                          <p className="text-sm text-slate-600 mt-1">{session.progressNotes}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {session.activities.map((activity, idx) => (
                              <Badge key={idx} className="bg-slate-100 text-slate-700 text-xs">
                                {activity}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              session.status === 'COMPLETED'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {session.status}
                          </Badge>
                          {session.parentCommunication && (
                            <div className="text-xs text-blue-600 mt-1">📧 Parent contacted</div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </>
      ) : (
        /* New Session Form */
        <SLPSessionNotes
          learnerId={learnerId}
          learnerName="Student"
          existingGoals={[
            {
              id: 'goal-1',
              goalArea: 'ARTICULATION',
              shortDescription: 'Produce /r/ in initial position with 80% accuracy',
            },
            {
              id: 'goal-2',
              goalArea: 'ARTICULATION',
              shortDescription: 'Produce /s/ in initial position with 80% accuracy',
            },
            {
              id: 'goal-3',
              goalArea: 'FLUENCY',
              shortDescription: 'Use easy onset technique with 70% success',
            },
            {
              id: 'goal-4',
              goalArea: 'RECEPTIVE_LANGUAGE',
              shortDescription: 'Follow 2-step directions with 80% accuracy',
            },
          ]}
          onSave={async (session) => {
            console.log('Saving session:', session);
            setActiveView('list');
          }}
        />
      )}
    </div>
  );
}
