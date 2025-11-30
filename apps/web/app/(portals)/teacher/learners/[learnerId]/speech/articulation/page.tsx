'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
  Mic,
  ArrowLeft,
  Plus,
  TrendingUp,
  Target,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { ArticulationTrialCollector } from '@/components/slp/ArticulationTrialCollector';
import { ArticulationProgressChart } from '@/components/slp/ArticulationProgressChart';

/**
 * Articulation Therapy Page
 * Manages sound production targets, trial data collection, and progress tracking
 */

// Mock data - replace with API calls
const mockTargets = [
  {
    id: '1',
    phoneme: 'r',
    position: 'initial',
    currentAccuracy: 65,
    targetAccuracy: 80,
    status: 'IN_PROGRESS',
    lastSessionDate: '2025-11-28',
  },
  {
    id: '2',
    phoneme: 'r',
    position: 'medial',
    currentAccuracy: 45,
    targetAccuracy: 80,
    status: 'IN_PROGRESS',
    lastSessionDate: '2025-11-28',
  },
  {
    id: '3',
    phoneme: 's',
    position: 'initial',
    currentAccuracy: 80,
    targetAccuracy: 80,
    status: 'MASTERED',
    lastSessionDate: '2025-11-25',
  },
  {
    id: '4',
    phoneme: 'l',
    position: 'initial',
    currentAccuracy: 75,
    targetAccuracy: 80,
    status: 'IN_PROGRESS',
    lastSessionDate: '2025-11-21',
  },
];

export default function ArticulationPage() {
  const params = useParams();
  const learnerId = (params?.learnerId as string) || '';
  const [activeTab, setActiveTab] = useState<'overview' | 'collect' | 'progress'>('overview');
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const targets = mockTargets;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'MASTERED':
        return 'bg-green-100 text-green-700';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-700';
      case 'NOT_STARTED':
        return 'bg-gray-100 text-gray-700';
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
          <h1 className="text-3xl font-bold text-slate-900">Articulation Therapy</h1>
          <p className="text-slate-500">Sound production and phonological processes</p>
        </div>
        <button
          onClick={() => setActiveTab('collect')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Collect Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Overview', icon: Target },
          { id: 'collect', label: 'Collect Data', icon: Mic },
          { id: 'progress', label: 'Progress', icon: BarChart3 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
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
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{targets.length}</div>
                <div className="text-xs text-slate-500">Total Targets</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {targets.filter((t) => t.status === 'IN_PROGRESS').length}
                </div>
                <div className="text-xs text-slate-500">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {targets.filter((t) => t.status === 'MASTERED').length}
                </div>
                <div className="text-xs text-slate-500">Mastered</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.round(
                    targets.reduce((sum, t) => sum + t.currentAccuracy, 0) / targets.length
                  )}
                  %
                </div>
                <div className="text-xs text-slate-500">Avg Accuracy</div>
              </CardContent>
            </Card>
          </div>

          {/* Targets List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-slate-500" />
                  <span className="text-lg font-semibold text-slate-900">Articulation Targets</span>
                </div>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  + Add Target
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {targets.map((target) => (
                  <div
                    key={target.id}
                    className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTarget(target.id);
                      setActiveTab('collect');
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <span className="text-xl font-bold text-blue-700">/{target.phoneme}/</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 capitalize">
                          {target.position} position
                        </div>
                        <div className="text-sm text-slate-500">
                          Last session: {new Date(target.lastSessionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-bold text-slate-900">{target.currentAccuracy}%</div>
                        <div className="text-xs text-slate-500">Target: {target.targetAccuracy}%</div>
                      </div>
                      <Badge className={getStatusColor(target.status)}>
                        {target.status === 'IN_PROGRESS'
                          ? 'In Progress'
                          : target.status === 'MASTERED'
                            ? 'Mastered'
                            : 'Not Started'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collect Data Tab */}
      {activeTab === 'collect' && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Select Target to Collect Data</h3>
            <p className="text-sm text-slate-500">Choose an articulation target to record trials</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {targets.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTarget(t.id)}
                  className={`p-4 rounded-lg border text-left transition-colors ${
                    selectedTarget === t.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Mic className="h-5 w-5 text-blue-500" />
                    <span className="font-bold text-lg">/{t.phoneme}/</span>
                    <Badge variant="outline">{t.position}</Badge>
                  </div>
                  <div className="mt-2 text-sm text-slate-600">
                    Current: {t.currentAccuracy}% | Target: {t.targetAccuracy}%
                  </div>
                </button>
              ))}
            </div>
            {selectedTarget && (() => {
              const target = targets.find((t) => t.id === selectedTarget);
              if (!target) return null;
              return (
                <ArticulationTrialCollector
                  learnerId={learnerId}
                  target={{
                    id: target.id,
                    phoneme: target.phoneme,
                    position: target.position.toUpperCase() as 'INITIAL' | 'MEDIAL' | 'FINAL' | 'BLENDS' | 'ALL_POSITIONS',
                    currentLevel: 'WORD',
                    exemplarWords: ['rabbit', 'run', 'red', 'rain', 'rope'],
                    currentAccuracy: target.currentAccuracy,
                    goalAccuracy: target.targetAccuracy,
                  }}
                  onSaveTrials={async () => { console.log('Save trials'); }}
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <ArticulationProgressChart
          learnerId={learnerId}
          periodDays={30}
          totalTrials={150}
          correctTrials={105}
          overallAccuracy={70}
          activeTargets={3}
          masteredTargets={1}
          goalAccuracy={80}
          phonemeProgress={targets.map((t) => ({
            phoneme: t.phoneme,
            position: t.position.toUpperCase(),
            totalTrials: 30,
            correctTrials: Math.round(30 * t.currentAccuracy / 100),
            accuracy: t.currentAccuracy,
          }))}
          dailyProgress={[
            { date: '2025-11-22', totalTrials: 20, correctTrials: 12, accuracy: 60 },
            { date: '2025-11-23', totalTrials: 25, correctTrials: 16, accuracy: 64 },
            { date: '2025-11-24', totalTrials: 30, correctTrials: 20, accuracy: 67 },
            { date: '2025-11-25', totalTrials: 28, correctTrials: 19, accuracy: 68 },
            { date: '2025-11-26', totalTrials: 25, correctTrials: 18, accuracy: 72 },
            { date: '2025-11-27', totalTrials: 22, correctTrials: 16, accuracy: 73 },
          ]}
        />
      )}
    </div>
  );
}
