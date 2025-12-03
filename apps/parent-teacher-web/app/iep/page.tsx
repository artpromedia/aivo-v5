'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, RefreshCw, ChevronDown, ChevronUp, Target } from 'lucide-react';
import {
  IEPStatusPieChart,
  IEPGoalCard,
  IEPGoalCardSkeleton,
  IEPFilterBar,
  IEPUpcomingReviews,
} from '../../components/iep';
import type { IEPGoal, IEPCategory, IEPGoalStatus } from '../../types/iep';
import { CATEGORY_CONFIG } from '../../types/iep';

// ============================================================================
// Mock Data Generator (will be replaced with API calls)
// ============================================================================

function generateMockGoals(learnerId: string): IEPGoal[] {
  const now = new Date();

  return [
    {
      id: '1',
      learnerId,
      name: 'Reading Comprehension',
      description:
        'Student will answer inferential questions about grade-level text with 80% accuracy.',
      category: 'academic',
      subject: 'ELA',
      status: 'on_track',
      currentValue: 55,
      targetValue: 80,
      unit: 'accuracy %',
      startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString(),
      reviewDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [
        {
          id: 'd1',
          goalId: '1',
          value: 45,
          measurementDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd2',
          goalId: '1',
          value: 48,
          measurementDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd3',
          goalId: '1',
          value: 52,
          measurementDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd4',
          goalId: '1',
          value: 50,
          measurementDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd5',
          goalId: '1',
          value: 55,
          measurementDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
      ],
      notes: [],
    },
    {
      id: '2',
      learnerId,
      name: 'Math Problem Solving',
      description:
        'Student will solve multi-step word problems using appropriate strategies with 75% accuracy.',
      category: 'academic',
      subject: 'Math',
      status: 'on_track',
      currentValue: 70,
      targetValue: 75,
      unit: 'accuracy %',
      startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [
        {
          id: 'd6',
          goalId: '2',
          value: 50,
          measurementDate: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd7',
          goalId: '2',
          value: 55,
          measurementDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd8',
          goalId: '2',
          value: 62,
          measurementDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd9',
          goalId: '2',
          value: 68,
          measurementDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd10',
          goalId: '2',
          value: 70,
          measurementDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
      ],
      notes: [],
    },
    {
      id: '3',
      learnerId,
      name: 'Turn-Taking in Conversation',
      description:
        'Student will wait for their turn and respond appropriately in 4 out of 5 peer conversations.',
      category: 'social_emotional',
      status: 'needs_review',
      currentValue: 3.2,
      targetValue: 4,
      unit: 'out of 5',
      startDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      reviewDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [
        {
          id: 'd11',
          goalId: '3',
          value: 2.0,
          measurementDate: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd12',
          goalId: '3',
          value: 2.5,
          measurementDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd13',
          goalId: '3',
          value: 3.0,
          measurementDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd14',
          goalId: '3',
          value: 3.2,
          measurementDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
      ],
      notes: [],
    },
    {
      id: '4',
      learnerId,
      name: 'Expressing Needs Verbally',
      description:
        'Student will use complete sentences to express needs and wants in 8 out of 10 opportunities.',
      category: 'communication',
      status: 'achieved',
      currentValue: 8,
      targetValue: 8,
      unit: 'out of 10',
      startDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [
        {
          id: 'd15',
          goalId: '4',
          value: 5,
          measurementDate: new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'therapy',
        },
        {
          id: 'd16',
          goalId: '4',
          value: 6,
          measurementDate: new Date(now.getTime() - 80 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'therapy',
        },
        {
          id: 'd17',
          goalId: '4',
          value: 7,
          measurementDate: new Date(now.getTime() - 50 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'therapy',
        },
        {
          id: 'd18',
          goalId: '4',
          value: 8,
          measurementDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'therapy',
        },
      ],
      notes: [],
    },
    {
      id: '5',
      learnerId,
      name: 'Self-Regulation During Transitions',
      description:
        'Student will independently transition between activities with 2 or fewer prompts.',
      category: 'behavioral',
      status: 'at_risk',
      currentValue: 3,
      targetValue: 2,
      unit: 'prompts',
      startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() + 150 * 24 * 60 * 60 * 1000).toISOString(),
      reviewDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [
        {
          id: 'd19',
          goalId: '5',
          value: 5,
          measurementDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd20',
          goalId: '5',
          value: 4,
          measurementDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
        {
          id: 'd21',
          goalId: '5',
          value: 3,
          measurementDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          context: 'classroom',
        },
      ],
      notes: [],
    },
    {
      id: '6',
      learnerId,
      name: 'Fine Motor - Handwriting',
      description: 'Student will write legibly on lined paper with proper letter formation.',
      category: 'motor',
      status: 'not_started',
      currentValue: 0,
      targetValue: 80,
      unit: 'accuracy %',
      startDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      targetDate: new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      dataPoints: [],
      notes: [],
    },
  ];
}

// ============================================================================
// Progress Overview Card
// ============================================================================

interface ProgressOverviewCardProps {
  goals: IEPGoal[];
  loading?: boolean;
}

function ProgressOverviewCard({ goals, loading }: ProgressOverviewCardProps) {
  const stats = useMemo(() => {
    const achieved = goals.filter((g) => g.status === 'achieved').length;
    const onTrack = goals.filter((g) => g.status === 'on_track').length;
    const needsReview = goals.filter((g) => g.status === 'needs_review').length;
    const atRisk = goals.filter((g) => g.status === 'at_risk').length;
    const notStarted = goals.filter((g) => g.status === 'not_started').length;

    return { achieved, onTrack, needsReview, atRisk, notStarted, total: goals.length };
  }, [goals]);

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-lg p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 bg-gray-100 rounded-lg" />
          <div className="h-6 w-40 bg-gray-100 rounded" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-48 h-48 bg-gray-100 rounded-full" />
          <div className="flex-1 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-3 h-3 bg-gray-100 rounded-full" />
                <div className="h-4 w-24 bg-gray-100 rounded" />
                <div className="h-4 w-8 bg-gray-100 rounded ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
          <span className="text-lg">📊</span>
        </div>
        <h2 className="text-lg font-semibold text-gray-900">Progress Overview</h2>
      </div>

      {/* Content */}
      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Pie Chart */}
        <div className="flex-shrink-0">
          <IEPStatusPieChart goals={goals} size={180} showLegend={false} />
        </div>

        {/* Stats */}
        <div className="flex-1 w-full space-y-3">
          <StatRow
            label="Total Goals"
            value={stats.total}
            color="text-gray-800"
            dotColor="bg-gray-400"
          />
          <StatRow
            label="Achieved"
            value={stats.achieved}
            color="text-emerald-600"
            dotColor="bg-emerald-500"
          />
          <StatRow
            label="On Track"
            value={stats.onTrack}
            color="text-blue-600"
            dotColor="bg-blue-500"
          />
          <StatRow
            label="Needs Review"
            value={stats.needsReview}
            color="text-amber-600"
            dotColor="bg-amber-500"
          />
          {stats.atRisk > 0 && (
            <StatRow
              label="At Risk"
              value={stats.atRisk}
              color="text-red-600"
              dotColor="bg-red-500"
            />
          )}
          {stats.notStarted > 0 && (
            <StatRow
              label="Not Started"
              value={stats.notStarted}
              color="text-gray-500"
              dotColor="bg-gray-400"
            />
          )}
        </div>
      </div>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
  dotColor,
}: {
  label: string;
  value: number;
  color: string;
  dotColor: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full ${dotColor}`} />
      <span className="flex-1 text-sm text-gray-600">{label}</span>
      <span className={`text-sm font-bold ${color}`}>{value}</span>
    </div>
  );
}

// ============================================================================
// Category Section (Collapsible)
// ============================================================================

interface CategorySectionProps {
  category: IEPCategory;
  goals: IEPGoal[];
  defaultExpanded?: boolean;
}

function CategorySection({ category, goals, defaultExpanded = true }: CategorySectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  const config = CATEGORY_CONFIG[category];

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 py-2 hover:bg-gray-50 rounded-xl transition-colors"
      >
        <span className="text-lg">{config.emoji}</span>
        <span className="font-semibold text-gray-900">{config.label}</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">
          {goals.length}
        </span>
        <div className="ml-auto">
          {expanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </button>

      {/* Goals */}
      {expanded && (
        <div className="space-y-4 pl-2">
          {goals.map((goal) => (
            <IEPGoalCard key={goal.id} goal={goal} />
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Empty State
// ============================================================================

function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Target className="w-8 h-8 text-violet-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {hasFilters ? 'No goals match filters' : 'No IEP goals yet'}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mx-auto">
        {hasFilters
          ? 'Try adjusting your filters or search query'
          : 'Add a goal to start tracking progress towards educational objectives.'}
      </p>
    </div>
  );
}

// ============================================================================
// Main Dashboard Content
// ============================================================================

function IEPDashboardContent() {
  const _router = useRouter();
  const searchParams = useSearchParams();
  const learnerId = searchParams.get('learnerId') ?? 'demo-learner';
  const learnerName = searchParams.get('learnerName') ?? 'Demo Learner';

  // State
  const [goals, setGoals] = useState<IEPGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IEPCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<IEPGoalStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isTeacher] = useState(true); // TODO: Get from auth context

  // Load goals
  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      const mockGoals = generateMockGoals(learnerId);
      setGoals(mockGoals);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  // Filter goals
  const filteredGoals = useMemo(() => {
    return goals.filter((goal) => {
      if (selectedCategory && goal.category !== selectedCategory) return false;
      if (selectedStatus && goal.status !== selectedStatus) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesName = goal.name.toLowerCase().includes(query);
        const matchesDesc = goal.description.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc) return false;
      }
      return true;
    });
  }, [goals, selectedCategory, selectedStatus, searchQuery]);

  // Group goals by category
  const goalsByCategory = useMemo(() => {
    const grouped = new Map<IEPCategory, IEPGoal[]>();
    for (const goal of filteredGoals) {
      const existing = grouped.get(goal.category) ?? [];
      grouped.set(goal.category, [...existing, goal]);
    }
    return grouped;
  }, [filteredGoals]);

  const hasActiveFilters =
    selectedCategory !== null || selectedStatus !== null || searchQuery.length > 0;

  const clearFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSearchQuery('');
  }, []);

  const handleAddGoal = useCallback(() => {
    // TODO: Open add goal modal/sheet
    alert('Goal creation coming soon!');
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-lavender-50 to-lavender-100 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
            >
              <span className="text-lg">←</span>
            </Link>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">IEP Goals</h1>
              <p className="text-sm text-gray-500">{learnerName}</p>
            </div>
            <button
              onClick={loadGoals}
              disabled={loading}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-red-600 text-sm">Error: {error}</p>
            <button
              onClick={loadGoals}
              className="mt-2 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try again
            </button>
          </div>
        )}

        {/* Progress Overview */}
        <ProgressOverviewCard goals={goals} loading={loading} />

        {/* Upcoming Reviews */}
        {!loading && <IEPUpcomingReviews goals={goals} />}

        {/* Filters */}
        <IEPFilterBar
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          searchQuery={searchQuery}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
          onSearchChange={setSearchQuery}
          onClearFilters={clearFilters}
        />

        {/* Goals by Category */}
        {loading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-gray-100 rounded animate-pulse" />
                  <div className="h-5 w-24 bg-gray-100 rounded animate-pulse" />
                </div>
                <IEPGoalCardSkeleton />
              </div>
            ))}
          </div>
        ) : filteredGoals.length === 0 ? (
          <EmptyState hasFilters={hasActiveFilters} />
        ) : (
          <div className="space-y-6">
            {Array.from(goalsByCategory.entries()).map(([category, categoryGoals]) => (
              <CategorySection
                key={category}
                category={category}
                goals={categoryGoals}
                defaultExpanded={goalsByCategory.size <= 3}
              />
            ))}
          </div>
        )}
      </div>

      {/* Teacher FAB */}
      {isTeacher && (
        <button
          onClick={handleAddGoal}
          className="fixed bottom-6 right-6 flex items-center gap-2 px-5 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-full shadow-lg hover:shadow-xl transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Add Goal</span>
        </button>
      )}
    </main>
  );
}

// ============================================================================
// Page Export with Suspense
// ============================================================================

export default function IEPDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-lavender-50 to-lavender-100">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">🎯</div>
            <p className="text-gray-600">Loading IEP Dashboard...</p>
          </div>
        </div>
      }
    >
      <IEPDashboardContent />
    </Suspense>
  );
}
