'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Edit,
  Plus,
  Share2,
  ChevronDown,
  TrendingUp,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import {
  IEPProgressChart,
  IEPProgressChartSkeleton,
  IEPDataPointList,
  IEPNotesList,
  IEPTimeline,
  IEPTimelineSkeleton,
} from '../../../components/iep';
import type { IEPGoal, IEPGoalStatus } from '../../../types/iep';
import {
  CATEGORY_CONFIG,
  STATUS_CONFIG,
  ALL_STATUSES,
  calculateProgress,
  getDaysUntilTarget,
} from '../../../types/iep';

// ============================================================================
// Mock Data (will be replaced with API calls)
// ============================================================================

function generateMockGoal(goalId: string): IEPGoal {
  const now = new Date();

  return {
    id: goalId,
    learnerId: 'demo-learner',
    name: 'Reading Comprehension',
    description:
      'Student will answer inferential questions about grade-level text with 80% accuracy as measured by classroom assessments and standardized testing.',
    category: 'academic',
    subject: 'English Language Arts',
    status: 'on_track',
    currentValue: 65,
    targetValue: 80,
    unit: '% accuracy',
    startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    reviewDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    dataPoints: [
      {
        id: 'dp1',
        goalId,
        value: 45,
        measurementDate: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        notes: 'Initial assessment at start of intervention',
        recordedBy: 'Ms. Johnson',
      },
      {
        id: 'dp2',
        goalId,
        value: 48,
        measurementDate: new Date(now.getTime() - 70 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        recordedBy: 'Ms. Johnson',
      },
      {
        id: 'dp3',
        goalId,
        value: 52,
        measurementDate: new Date(now.getTime() - 55 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'assessment',
        notes: 'Benchmark assessment - showing improvement',
        recordedBy: 'Dr. Smith',
      },
      {
        id: 'dp4',
        goalId,
        value: 50,
        measurementDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        recordedBy: 'Ms. Johnson',
      },
      {
        id: 'dp5',
        goalId,
        value: 58,
        measurementDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'therapy',
        notes: 'Good session with reading specialist',
        recordedBy: 'Mrs. Davis',
      },
      {
        id: 'dp6',
        goalId,
        value: 62,
        measurementDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        recordedBy: 'Ms. Johnson',
      },
      {
        id: 'dp7',
        goalId,
        value: 60,
        measurementDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'home',
        notes: 'Parent observed reading practice',
        recordedBy: 'Parent',
      },
      {
        id: 'dp8',
        goalId,
        value: 65,
        measurementDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        context: 'classroom',
        notes: 'Strong performance on chapter test',
        recordedBy: 'Ms. Johnson',
      },
    ],
    notes: [
      {
        id: 'n1',
        goalId,
        content:
          'Student is showing great progress with graphic organizers. We noticed improved comprehension when using story maps before reading.',
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Ms. Johnson',
        authorRole: 'teacher',
      },
      {
        id: 'n2',
        goalId,
        content:
          'Amazing work this week! Student correctly identified the main idea in 4 out of 5 passages.',
        createdAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Mrs. Davis',
        authorRole: 'therapist',
      },
      {
        id: 'n3',
        goalId,
        content:
          "We've been practicing reading comprehension at home using the suggested strategies. Child seems more confident.",
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Parent',
        authorRole: 'parent',
      },
      {
        id: 'n4',
        goalId,
        content:
          'Concern: Student sometimes struggles with longer texts. Suggest breaking into smaller chunks.',
        createdAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        createdBy: 'Ms. Johnson',
        authorRole: 'teacher',
      },
    ],
    createdAt: new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  };
}

// ============================================================================
// Tab Types
// ============================================================================

type TabId = 'progress' | 'data' | 'notes';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof TrendingUp;
}

const TABS: Tab[] = [
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'data', label: 'Data Points', icon: Calendar },
  { id: 'notes', label: 'Notes', icon: MessageSquare },
];

// ============================================================================
// Progress Summary Card
// ============================================================================

interface ProgressSummaryCardProps {
  goal: IEPGoal;
}

function ProgressSummaryCard({ goal }: ProgressSummaryCardProps) {
  const progress = calculateProgress(goal);
  const daysLeft = getDaysUntilTarget(goal);
  const isOnTrack = goal.status === 'on_track' || goal.status === 'achieved';

  return (
    <div className="bg-white rounded-2xl shadow-lg p-5">
      <h3 className="text-sm font-semibold text-gray-500 mb-4">Progress Summary</h3>

      {/* Progress bar */}
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Current Progress</span>
          <span
            className={`text-sm font-bold ${isOnTrack ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {progress.toFixed(0)}%
          </span>
        </div>
        <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
              isOnTrack ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${Math.min(100, progress)}%` }}
          />
          {/* Target marker */}
          <div className="absolute right-0 top-0 w-1 h-full bg-gray-800" />
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-violet-50 rounded-xl p-3 text-center">
          <p className="text-xs text-violet-600 mb-1">Current</p>
          <p className="text-lg font-bold text-violet-700">
            {goal.currentValue.toFixed(1)}
            <span className="text-xs font-normal ml-1">{goal.unit}</span>
          </p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xs text-emerald-600 mb-1">Target</p>
          <p className="text-lg font-bold text-emerald-700">
            {goal.targetValue.toFixed(1)}
            <span className="text-xs font-normal ml-1">{goal.unit}</span>
          </p>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <p className="text-xs text-blue-600 mb-1">Data Points</p>
          <p className="text-lg font-bold text-blue-700">{goal.dataPoints.length}</p>
        </div>
        <div
          className={`rounded-xl p-3 text-center ${daysLeft < 0 ? 'bg-red-50' : daysLeft <= 14 ? 'bg-amber-50' : 'bg-gray-50'}`}
        >
          <p
            className={`text-xs mb-1 ${daysLeft < 0 ? 'text-red-600' : daysLeft <= 14 ? 'text-amber-600' : 'text-gray-600'}`}
          >
            Time Left
          </p>
          <p
            className={`text-lg font-bold ${daysLeft < 0 ? 'text-red-700' : daysLeft <= 14 ? 'text-amber-700' : 'text-gray-700'}`}
          >
            {daysLeft > 0 ? `${daysLeft}d` : daysLeft === 0 ? 'Today' : 'Overdue'}
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Status Dropdown
// ============================================================================

interface StatusDropdownProps {
  currentStatus: IEPGoalStatus;
  onStatusChange: (status: IEPGoalStatus) => void;
  disabled?: boolean;
}

function StatusDropdown({ currentStatus, onStatusChange, disabled }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const current = STATUS_CONFIG[currentStatus];

  return (
    <div className="relative">
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all ${current.bgColor} ${current.color} ${
          disabled ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-80'
        }`}
      >
        <span>{current.icon}</span>
        <span>{current.label}</span>
        {!disabled && <ChevronDown className="w-4 h-4" />}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
            role="button"
            tabIndex={0}
            aria-label="Close menu"
          />
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
            {ALL_STATUSES.map((status) => {
              const config = STATUS_CONFIG[status];
              const isSelected = status === currentStatus;
              return (
                <button
                  key={status}
                  onClick={() => {
                    onStatusChange(status);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
                    isSelected ? 'bg-gray-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <span>{config.icon}</span>
                  <span className={config.color}>{config.label}</span>
                  {isSelected && <span className="ml-auto text-violet-600">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Main Goal Detail Content
// ============================================================================

function GoalDetailContent() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;

  // State
  const [goal, setGoal] = useState<IEPGoal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('progress');
  const [isTeacher] = useState(true); // TODO: Get from auth context

  // Load goal
  const loadGoal = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockGoal = generateMockGoal(goalId);
      setGoal(mockGoal);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [goalId]);

  useEffect(() => {
    void loadGoal();
  }, [loadGoal]);

  // Handlers
  const handleStatusChange = useCallback(
    (newStatus: IEPGoalStatus) => {
      if (!goal) return;
      setGoal({ ...goal, status: newStatus });
      // TODO: API call to update status
    },
    [goal],
  );

  const handleAddDataPoint = useCallback(() => {
    router.push(`/iep/${goalId}/add-data`);
  }, [router, goalId]);

  const handleAddNote = useCallback(() => {
    // TODO: Open add note modal
    alert('Add note modal coming soon!');
  }, []);

  const handleEditGoal = useCallback(() => {
    // TODO: Navigate to edit goal page or open modal
    alert('Edit goal coming soon!');
  }, []);

  const handleShare = useCallback(() => {
    // TODO: Open share/export options
    alert('Share/export coming soon!');
  }, []);

  // Derived state
  const category = goal ? CATEGORY_CONFIG[goal.category] : null;

  if (loading) {
    return <GoalDetailSkeleton />;
  }

  if (error || !goal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-4xl mb-4">😕</div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">{error || 'Goal not found'}</h2>
          <Link href="/iep" className="text-violet-600 hover:text-violet-700 font-medium">
            ← Back to IEP Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/iep"
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${category?.bgColor} ${category?.color}`}
                >
                  <span>{category?.emoji}</span>
                  <span>{category?.label}</span>
                </span>
              </div>
              <h1 className="text-lg font-bold text-gray-900 truncate">{goal.name}</h1>
            </div>
            <StatusDropdown
              currentStatus={goal.status}
              onStatusChange={handleStatusChange}
              disabled={!isTeacher}
            />
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <p className="text-gray-600 leading-relaxed">{goal.description}</p>
          {goal.subject && <p className="text-sm text-gray-400 mt-2">Subject: {goal.subject}</p>}
        </div>

        {/* Progress Summary */}
        <ProgressSummaryCard goal={goal} />

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">Timeline</h3>
          <IEPTimeline goal={goal} />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Tab headers */}
          <div className="flex border-b border-gray-100">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const count =
                tab.id === 'data'
                  ? goal.dataPoints.length
                  : tab.id === 'notes'
                    ? goal.notes.length
                    : null;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? 'text-violet-600 border-violet-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {count !== null && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-xs ${
                        isActive ? 'bg-violet-100 text-violet-600' : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Tab content */}
          <div className="p-5">
            {activeTab === 'progress' && <IEPProgressChart goal={goal} height={280} />}

            {activeTab === 'data' && (
              <IEPDataPointList dataPoints={goal.dataPoints} unit={goal.unit} />
            )}

            {activeTab === 'notes' && (
              <IEPNotesList notes={goal.notes} isTeacher={isTeacher} onAddNote={handleAddNote} />
            )}
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-20">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          {/* Add Data Point */}
          <button
            onClick={handleAddDataPoint}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Data Point</span>
          </button>

          {/* Edit (teachers only) */}
          {isTeacher && (
            <button
              onClick={handleEditGoal}
              className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <Edit className="w-5 h-5 text-gray-600" />
            </button>
          )}

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center justify-center w-12 h-12 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            <Share2 className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function GoalDetailSkeleton() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 pb-24 animate-pulse">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-100 rounded-xl" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-20 bg-gray-100 rounded-full" />
              <div className="h-6 w-48 bg-gray-100 rounded" />
            </div>
            <div className="h-8 w-24 bg-gray-100 rounded-full" />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Description */}
        <div className="bg-white rounded-2xl shadow-lg p-5 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>

        {/* Progress */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <div className="h-4 w-32 bg-gray-100 rounded mb-4" />
          <div className="h-3 bg-gray-100 rounded-full mb-4" />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl" />
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl shadow-lg p-5">
          <IEPTimelineSkeleton />
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg">
          <div className="flex border-b border-gray-100 p-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1 h-8 bg-gray-100 rounded mx-2" />
            ))}
          </div>
          <div className="p-5">
            <IEPProgressChartSkeleton />
          </div>
        </div>
      </div>
    </main>
  );
}

// ============================================================================
// Page Export with Suspense
// ============================================================================

export default function IEPGoalDetailPage() {
  return (
    <Suspense fallback={<GoalDetailSkeleton />}>
      <GoalDetailContent />
    </Suspense>
  );
}
