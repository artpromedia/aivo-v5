'use client'

import { useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'

export interface AACStats {
  totalSymbolsAvailable: number
  symbolsUsedToday: number
  symbolsUsedThisWeek: number
  averageUtterancesPerDay: number
  goalsInProgress: number
  goalsAchieved: number
  mostUsedSymbols: Array<{ symbolId: string; label?: string; count: number }>
  communicativeFunctionBreakdown: Record<string, number>
}

export interface VocabularyGoal {
  id: string
  symbolId: string
  symbolLabel: string
  symbolImageUrl: string
  currentMastery: 'NOT_INTRODUCED' | 'EMERGING' | 'DEVELOPING' | 'MASTERED'
  targetMastery: 'NOT_INTRODUCED' | 'EMERGING' | 'DEVELOPING' | 'MASTERED'
  completedTrials: number
  targetTrials: number
  successRate: number
  targetAccuracy: number
  isAchieved: boolean
}

export interface Recommendation {
  type: string
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  symbolId?: string
  actionData?: Record<string, unknown>
}

export interface AACProgressDashboardProps {
  learnerId: string
  learnerName: string
  stats: AACStats
  goals: VocabularyGoal[]
  recommendations: Recommendation[]
  onViewGoal?: (goalId: string) => void
  onActOnRecommendation?: (recommendation: Recommendation) => void
  onViewAllGoals?: () => void
  onGenerateReport?: () => void
}

const FUNCTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  REQUESTING: { label: 'Requesting', icon: '🙋', color: 'bg-blue-100 text-blue-700' },
  REJECTING: { label: 'Rejecting', icon: '🚫', color: 'bg-red-100 text-red-700' },
  COMMENTING: { label: 'Commenting', icon: '💬', color: 'bg-green-100 text-green-700' },
  QUESTIONING: { label: 'Questioning', icon: '❓', color: 'bg-theme-primary/10 text-theme-primary' },
  GREETING: { label: 'Greeting', icon: '👋', color: 'bg-yellow-100 text-yellow-700' },
  RESPONDING: { label: 'Responding', icon: '↩️', color: 'bg-indigo-100 text-indigo-700' },
  LABELING: { label: 'Labeling', icon: '🏷️', color: 'bg-pink-100 text-pink-700' },
  EXPRESSING_FEELINGS: { label: 'Expressing Feelings', icon: '😊', color: 'bg-orange-100 text-orange-700' },
}

const MASTERY_LEVELS = {
  NOT_INTRODUCED: { label: 'Not Introduced', color: 'bg-gray-200', width: '0%' },
  EMERGING: { label: 'Emerging', color: 'bg-yellow-400', width: '33%' },
  DEVELOPING: { label: 'Developing', color: 'bg-blue-400', width: '66%' },
  MASTERED: { label: 'Mastered', color: 'bg-green-400', width: '100%' },
}

const PRIORITY_COLORS = {
  high: 'border-l-red-500 bg-red-50',
  medium: 'border-l-yellow-500 bg-yellow-50',
  low: 'border-l-blue-500 bg-blue-50',
}

export function AACProgressDashboard({
  learnerId,
  learnerName,
  stats,
  goals,
  recommendations,
  onViewGoal,
  onActOnRecommendation,
  onViewAllGoals,
  onGenerateReport,
}: AACProgressDashboardProps) {
  // Calculate function distribution percentages
  const functionTotal = useMemo(() => {
    return Object.values(stats.communicativeFunctionBreakdown).reduce((a, b) => a + b, 0)
  }, [stats.communicativeFunctionBreakdown])

  const functionPercentages = useMemo(() => {
    if (functionTotal === 0) return {}
    return Object.fromEntries(
      Object.entries(stats.communicativeFunctionBreakdown).map(([key, value]) => [
        key,
        Math.round((value / functionTotal) * 100),
      ])
    )
  }, [stats.communicativeFunctionBreakdown, functionTotal])

  // Active goals (not achieved)
  const activeGoals = useMemo(() => {
    return goals.filter((g) => !g.isAchieved).slice(0, 5)
  }, [goals])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AAC Progress Dashboard</h1>
          <p className="text-slate-600">{learnerName}</p>
        </div>
        <button
          type="button"
          onClick={onGenerateReport}
          className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
        >
          📊 Generate Report
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          icon="🔤"
          label="Symbols Used Today"
          value={stats.symbolsUsedToday}
          subtext={`of ${stats.totalSymbolsAvailable} available`}
        />
        <MetricCard
          icon="📅"
          label="This Week"
          value={stats.symbolsUsedThisWeek}
          subtext="unique symbols"
        />
        <MetricCard
          icon="💬"
          label="Daily Average"
          value={stats.averageUtterancesPerDay.toFixed(1)}
          subtext="utterances/day"
        />
        <MetricCard
          icon="🎯"
          label="Goals in Progress"
          value={stats.goalsInProgress}
          subtext="active goals"
          highlight={stats.goalsInProgress > 0}
        />
        <MetricCard
          icon="✅"
          label="Goals Achieved"
          value={stats.goalsAchieved}
          subtext="completed"
          variant="success"
        />
        <MetricCard
          icon="📈"
          label="Vocabulary Growth"
          value={`${Math.round((stats.symbolsUsedThisWeek / stats.totalSymbolsAvailable) * 100)}%`}
          subtext="of total vocabulary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Communicative Functions */}
        <Card>
          <CardHeader 
            title="Communicative Functions" 
            subtitle="Distribution of communication purposes"
          />
          <CardContent>
            {functionTotal === 0 ? (
              <p className="text-center text-gray-500 py-8">No communication data yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.communicativeFunctionBreakdown)
                  .sort(([, a], [, b]) => b - a)
                  .map(([func, count]) => {
                    const funcInfo = FUNCTION_LABELS[func] || { 
                      label: func, 
                      icon: '📝', 
                      color: 'bg-gray-100 text-gray-700' 
                    }
                    const percentage = functionPercentages[func] || 0

                    return (
                      <div key={func} className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-lg text-sm ${funcInfo.color}`}>
                          {funcInfo.icon} {funcInfo.label}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium text-gray-700 w-16 text-right">
                          {count} ({percentage}%)
                        </span>
                      </div>
                    )
                  })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Most Used Symbols */}
        <Card>
          <CardHeader 
            title="Most Used Symbols" 
            subtitle="Top 10 frequently used vocabulary"
          />
          <CardContent>
            {stats.mostUsedSymbols.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No symbols used yet</p>
            ) : (
              <div className="grid grid-cols-5 gap-2">
                {stats.mostUsedSymbols.slice(0, 10).map((symbol, index) => (
                  <div 
                    key={symbol.symbolId}
                    className="relative flex flex-col items-center p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      {index + 1}
                    </span>
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                      <span className="text-2xl">🔤</span>
                    </div>
                    <span className="text-xs font-medium text-gray-700 mt-1 text-center truncate w-full">
                      {symbol.label || symbol.symbolId.slice(0, 8)}
                    </span>
                    <span className="text-xs text-gray-500">{symbol.count}x</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <Card>
          <CardHeader 
            title="Active Goals" 
            subtitle={`${activeGoals.length} goals in progress`}
            action={
              <button
                type="button"
                onClick={onViewAllGoals}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                View All →
              </button>
            }
          />
          <CardContent>
            {activeGoals.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No active goals. Create some goals to track progress!</p>
            ) : (
              <div className="space-y-4">
                {activeGoals.map((goal) => {
                  const progress = goal.targetTrials > 0 
                    ? Math.round((goal.completedTrials / goal.targetTrials) * 100) 
                    : 0
                  const masteryInfo = MASTERY_LEVELS[goal.currentMastery]

                  return (
                    <div 
                      key={goal.id}
                      className="p-3 rounded-lg bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors"
                      onClick={() => onViewGoal?.(goal.id)}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img 
                            src={goal.symbolImageUrl} 
                            alt={goal.symbolLabel}
                            className="w-8 h-8 object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{goal.symbolLabel}</p>
                          <p className="text-xs text-gray-500">
                            {goal.completedTrials}/{goal.targetTrials} trials • {Math.round(goal.successRate * 100)}% success
                          </p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${masteryInfo.color.replace('bg-', 'bg-opacity-50 ')} text-gray-700`}>
                          {masteryInfo.label}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${masteryInfo.color} transition-all duration-500`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader 
            title="AI Recommendations" 
            subtitle="Personalized suggestions to improve AAC use"
          />
          <CardContent>
            {recommendations.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recommendations at this time</p>
            ) : (
              <div className="space-y-3">
                {recommendations.map((rec, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${PRIORITY_COLORS[rec.priority]} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => onActOnRecommendation?.(rec)}
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-lg">
                        {rec.type === 'new_symbol' && '🆕'}
                        {rec.type === 'goal_suggestion' && '🎯'}
                        {rec.type === 'board_update' && '📋'}
                        {rec.type === 'access_adjustment' && '⚙️'}
                      </span>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{rec.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                      </div>
                      <span className={`
                        px-2 py-0.5 rounded-full text-xs font-medium uppercase
                        ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : ''}
                        ${rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                        ${rec.priority === 'low' ? 'bg-blue-100 text-blue-700' : ''}
                      `}>
                        {rec.priority}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Metric Card Component
function MetricCard({
  icon,
  label,
  value,
  subtext,
  highlight = false,
  variant = 'default',
}: {
  icon: string
  label: string
  value: string | number
  subtext?: string
  highlight?: boolean
  variant?: 'default' | 'success'
}) {
  return (
    <Card className={`
      ${highlight ? 'ring-2 ring-blue-400' : ''}
      ${variant === 'success' ? 'bg-green-50' : ''}
    `}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{icon}</span>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</span>
        </div>
        <p className={`text-2xl font-bold ${variant === 'success' ? 'text-green-700' : 'text-gray-900'}`}>
          {value}
        </p>
        {subtext && (
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        )}
      </CardContent>
    </Card>
  )
}

export default AACProgressDashboard
