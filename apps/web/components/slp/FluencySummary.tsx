"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingDown, TrendingUp, Target, AlertCircle } from "lucide-react";

interface FrequencyTrendData {
  date: string;
  frequency: number;
  taskType: string;
}

interface DisfluencyBreakdown {
  repetitions: number;
  prolongations: number;
  blocks: number;
  interjections: number;
  percentages: {
    repetitions: number;
    prolongations: number;
    blocks: number;
    interjections: number;
  };
}

interface FluencySummaryProps {
  learnerId: string;
  periodDays: number;
  totalSessions: number;
  baselineFrequency?: number;
  currentFrequency?: number;
  goalFrequency?: number;
  averageFrequency?: number;
  frequencyTrend: FrequencyTrendData[];
  disfluencyBreakdown: DisfluencyBreakdown;
  techniqueUsage: Record<string, number>;
}

export function FluencySummary({
  learnerId,
  periodDays,
  totalSessions,
  baselineFrequency,
  currentFrequency,
  goalFrequency,
  averageFrequency,
  frequencyTrend,
  disfluencyBreakdown,
  techniqueUsage,
}: FluencySummaryProps) {
  // Calculate improvement from baseline
  const improvement = useMemo(() => {
    if (baselineFrequency && currentFrequency) {
      const diff = baselineFrequency - currentFrequency;
      const pct = ((diff / baselineFrequency) * 100).toFixed(1);
      return { diff: diff.toFixed(1), pct, improved: diff > 0 };
    }
    return null;
  }, [baselineFrequency, currentFrequency]);

  // Progress toward goal
  const goalProgress = useMemo(() => {
    if (baselineFrequency && currentFrequency && goalFrequency) {
      const totalNeeded = baselineFrequency - goalFrequency;
      const achieved = baselineFrequency - currentFrequency;
      if (totalNeeded <= 0) return 100;
      return Math.min(100, Math.max(0, (achieved / totalNeeded) * 100));
    }
    return null;
  }, [baselineFrequency, currentFrequency, goalFrequency]);

  // Sort techniques by usage
  const sortedTechniques = useMemo(() => {
    return Object.entries(techniqueUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [techniqueUsage]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Baseline</div>
            <div className="text-2xl font-bold text-gray-700">
              {baselineFrequency ? `${baselineFrequency}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Current</div>
            <div className={`text-2xl font-bold ${
              currentFrequency && goalFrequency && currentFrequency <= goalFrequency
                ? 'text-green-600' : 'text-blue-600'
            }`}>
              {currentFrequency ? `${currentFrequency}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Goal</div>
            <div className="text-2xl font-bold text-theme-primary">
              {goalFrequency ? `${goalFrequency}%` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-sm text-gray-500 mb-1">Sessions</div>
            <div className="text-2xl font-bold text-gray-700">{totalSessions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Improvement Indicator */}
      {improvement && (
        <Card className={improvement.improved ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {improvement.improved ? (
                  <TrendingDown className="h-8 w-8 text-green-500" />
                ) : (
                  <TrendingUp className="h-8 w-8 text-orange-500" />
                )}
                <div>
                  <div className="font-semibold text-gray-800">
                    {improvement.improved ? "Improvement Detected" : "Needs Attention"}
                  </div>
                  <div className="text-sm text-gray-600">
                    Stuttering frequency {improvement.improved ? "decreased" : "increased"} by {Math.abs(parseFloat(improvement.diff))}% SS
                    ({Math.abs(parseFloat(improvement.pct))}% {improvement.improved ? "reduction" : "increase"})
                  </div>
                </div>
              </div>
              {goalProgress !== null && (
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-800">{goalProgress.toFixed(0)}%</div>
                  <div className="text-xs text-gray-500">toward goal</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Frequency Trend */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Stuttering Frequency Trend</h3>
        </CardHeader>
        <CardContent className="p-6">
          {frequencyTrend.length > 0 ? (
            <div className="space-y-4">
              {/* Simple visual representation */}
              <div className="relative h-40">
                <div className="absolute inset-0 flex items-end gap-1">
                  {frequencyTrend.slice(-14).map((point, idx) => {
                    const maxFreq = Math.max(...frequencyTrend.map(t => t.frequency), 20);
                    const height = (point.frequency / maxFreq) * 100;
                    const isGoalMet = goalFrequency && point.frequency <= goalFrequency;
                    
                    return (
                      <div
                        key={`${point.date}-${idx}`}
                        className="flex-1 flex flex-col items-center"
                      >
                        <div
                          className={`w-full rounded-t transition-all ${
                            isGoalMet ? 'bg-green-500' : 'bg-blue-500'
                          } hover:opacity-80`}
                          style={{ height: `${height}%`, minHeight: "4px" }}
                          title={`${point.date}: ${point.frequency}% SS (${point.taskType})`}
                        />
                      </div>
                    );
                  })}
                </div>
                
                {/* Goal line */}
                {goalFrequency && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-dashed border-theme-primary"
                    style={{
                      bottom: `${(goalFrequency / Math.max(...frequencyTrend.map(t => t.frequency), 20)) * 100}%`
                    }}
                  >
                    <span className="absolute -top-5 right-0 text-xs text-theme-primary bg-white px-1">
                      Goal: {goalFrequency}%
                    </span>
                  </div>
                )}
              </div>
              
              {/* X-axis labels */}
              <div className="flex justify-between text-xs text-gray-500">
                {frequencyTrend.length > 0 && (
                  <>
                    <span>{formatDate(frequencyTrend[0].date)}</span>
                    <span>{formatDate(frequencyTrend[frequencyTrend.length - 1].date)}</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No fluency data available yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Disfluency Breakdown */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Disfluency Type Distribution</h3>
        </CardHeader>
        <CardContent className="p-6">
          {disfluencyBreakdown && Object.values(disfluencyBreakdown.percentages).some(v => v > 0) ? (
            <div className="space-y-4">
              {[
                { key: "repetitions", label: "Repetitions", color: "bg-blue-500" },
                { key: "prolongations", label: "Prolongations", color: "bg-green-500" },
                { key: "blocks", label: "Blocks", color: "bg-red-500" },
                { key: "interjections", label: "Interjections", color: "bg-theme-primary" },
              ].map(({ key, label, color }) => {
                const count = disfluencyBreakdown[key as keyof DisfluencyBreakdown] as number;
                const pct = disfluencyBreakdown.percentages[key as keyof typeof disfluencyBreakdown.percentages];
                
                return (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-700">{label}</span>
                      <span className="text-gray-500">{count} ({pct}%)</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${color} rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No disfluency data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Most Used Techniques */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Most Used Fluency Techniques</h3>
        </CardHeader>
        <CardContent className="p-6">
          {sortedTechniques.length > 0 ? (
            <div className="space-y-3">
              {sortedTechniques.map(([technique, count], idx) => (
                <div key={technique} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx === 0 ? 'bg-yellow-100 text-yellow-800' :
                    idx === 1 ? 'bg-gray-100 text-gray-800' :
                    idx === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-50 text-gray-600'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-800">{technique}</div>
                  </div>
                  <Badge variant="outline">{count} sessions</Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No technique usage recorded
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
