"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, Target, Award, Calendar } from "lucide-react";

interface ArticulationProgressData {
  phoneme: string;
  position: string;
  totalTrials: number;
  correctTrials: number;
  accuracy: number;
}

interface DailyProgressData {
  date: string;
  totalTrials: number;
  correctTrials: number;
  accuracy: number;
}

interface ArticulationProgressChartProps {
  learnerId: string;
  periodDays: number;
  totalTrials: number;
  correctTrials: number;
  overallAccuracy: number;
  activeTargets: number;
  masteredTargets: number;
  phonemeProgress: ArticulationProgressData[];
  dailyProgress: DailyProgressData[];
  goalAccuracy?: number;
}

const positionColors: Record<string, string> = {
  INITIAL: "bg-blue-500",
  MEDIAL: "bg-green-500",
  FINAL: "bg-purple-500",
  BLENDS: "bg-orange-500",
  ALL_POSITIONS: "bg-gray-500",
};

export function ArticulationProgressChart({
  learnerId,
  periodDays,
  totalTrials,
  correctTrials,
  overallAccuracy,
  activeTargets,
  masteredTargets,
  phonemeProgress,
  dailyProgress,
  goalAccuracy = 80,
}: ArticulationProgressChartProps) {
  // Calculate max value for chart scaling
  const maxTrials = useMemo(() => {
    return Math.max(...dailyProgress.map(d => d.totalTrials), 10);
  }, [dailyProgress]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-purple-600">{totalTrials}</div>
            <div className="text-sm text-gray-500">Total Trials</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className={`text-3xl font-bold ${overallAccuracy >= goalAccuracy ? 'text-green-600' : 'text-blue-600'}`}>
              {overallAccuracy}%
            </div>
            <div className="text-sm text-gray-500">Overall Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-orange-600">{activeTargets}</div>
            <div className="text-sm text-gray-500">Active Targets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-3xl font-bold text-green-600">{masteredTargets}</div>
            <div className="text-sm text-gray-500">Mastered</div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Progress Chart */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Daily Progress - Last {periodDays} Days</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {dailyProgress.length > 0 ? (
            <div className="space-y-4">
              {/* Simple Bar Chart */}
              <div className="flex items-end gap-1 h-40">
                {dailyProgress.slice(-14).map((day, idx) => (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-full bg-purple-500 rounded-t transition-all hover:bg-purple-600"
                      style={{ 
                        height: `${(day.totalTrials / maxTrials) * 100}%`,
                        minHeight: day.totalTrials > 0 ? "8px" : "0"
                      }}
                      title={`${day.totalTrials} trials, ${day.accuracy}% accuracy`}
                    />
                    {idx % 2 === 0 && (
                      <span className="text-xs text-gray-400 -rotate-45 origin-top-left whitespace-nowrap">
                        {formatDate(day.date)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Accuracy Trend Line Representation */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-gray-600">
                  Accuracy Trend: 
                  {dailyProgress.length >= 2 && (
                    <span className={`ml-1 font-medium ${
                      dailyProgress[dailyProgress.length - 1].accuracy >= dailyProgress[0].accuracy
                        ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {dailyProgress[dailyProgress.length - 1].accuracy >= dailyProgress[0].accuracy ? '↑' : '↓'}
                      {' '}{Math.abs(dailyProgress[dailyProgress.length - 1].accuracy - dailyProgress[0].accuracy)}%
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trial data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Phoneme Progress */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold">Progress by Phoneme</h3>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {phonemeProgress.length > 0 ? (
            <div className="space-y-4">
              {phonemeProgress.map((phoneme) => (
                <div key={`${phoneme.phoneme}_${phoneme.position}`} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold">/{phoneme.phoneme}/</span>
                      <Badge 
                        variant="outline"
                        className={`${positionColors[phoneme.position]} text-white border-0`}
                      >
                        {phoneme.position.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-gray-500">{phoneme.totalTrials} trials</span>
                      <span className={`font-bold ${phoneme.accuracy >= goalAccuracy ? 'text-green-600' : 'text-gray-700'}`}>
                        {phoneme.accuracy}%
                      </span>
                      {phoneme.accuracy >= goalAccuracy && (
                        <Award className="h-4 w-4 text-yellow-500" />
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full rounded-full transition-all ${
                        phoneme.accuracy >= goalAccuracy ? 'bg-green-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(phoneme.accuracy, 100)}%` }}
                    />
                    {/* Goal Line */}
                    <div
                      className="absolute top-0 h-full w-0.5 bg-gray-400"
                      style={{ left: `${goalAccuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No phoneme progress data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-purple-500" />
          <span>Trial Count</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Goal Met ({goalAccuracy}%+)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-0.5 h-3 bg-gray-400" />
          <span>Goal Line</span>
        </div>
      </div>
    </div>
  );
}
