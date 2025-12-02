"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface FluencyAssessment {
  id: string;
  assessmentDate: string;
  passageTitle: string;
  passageLevel: string;
  wordsCorrectPerMinute: number;
  accuracy: number;
  prosodyTotal?: number;
  comprehensionPercent?: number;
}

interface FluencyProgressChartProps {
  assessments: FluencyAssessment[];
  targetWCPM?: number;
}

export function FluencyProgressChart({ assessments, targetWCPM = 100 }: FluencyProgressChartProps) {
  if (assessments.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-gray-500">
          No fluency assessments recorded yet.
        </CardContent>
      </Card>
    );
  }

  // Sort by date
  const sortedAssessments = [...assessments].sort(
    (a, b) => new Date(a.assessmentDate).getTime() - new Date(b.assessmentDate).getTime()
  );

  // Calculate statistics
  const latestAssessment = sortedAssessments[sortedAssessments.length - 1];
  const firstAssessment = sortedAssessments[0];
  
  const wcpmGrowth = latestAssessment.wordsCorrectPerMinute - firstAssessment.wordsCorrectPerMinute;
  const wcpmGrowthPercent = firstAssessment.wordsCorrectPerMinute > 0
    ? Math.round((wcpmGrowth / firstAssessment.wordsCorrectPerMinute) * 100)
    : 0;

  // Find max values for scaling
  const maxWCPM = Math.max(...sortedAssessments.map(a => a.wordsCorrectPerMinute), targetWCPM);

  // Determine trend
  const getTrend = (): { icon: React.ReactNode; label: string; color: string } => {
    if (wcpmGrowth > 5) {
      return { icon: <TrendingUp className="h-5 w-5" />, label: "Improving", color: "text-green-500" };
    } else if (wcpmGrowth < -5) {
      return { icon: <TrendingDown className="h-5 w-5" />, label: "Declining", color: "text-red-500" };
    }
    return { icon: <Minus className="h-5 w-5" />, label: "Stable", color: "text-yellow-500" };
  };

  const trend = getTrend();

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-600">
              {latestAssessment.wordsCorrectPerMinute}
            </div>
            <div className="text-sm text-gray-500">Current WCPM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className={`text-3xl font-bold ${trend.color} flex items-center justify-center gap-2`}>
              {trend.icon}
              {wcpmGrowth > 0 ? "+" : ""}{wcpmGrowth}
            </div>
            <div className="text-sm text-gray-500">WCPM Growth</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className={`text-3xl font-bold ${
              latestAssessment.accuracy >= 97 ? "text-green-600" :
              latestAssessment.accuracy >= 90 ? "text-yellow-600" : "text-red-600"
            }`}>
              {Math.round(latestAssessment.accuracy)}%
            </div>
            <div className="text-sm text-gray-500">Latest Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-theme-primary">
              {latestAssessment.prosodyTotal || "-"}/16
            </div>
            <div className="text-sm text-gray-500">Prosody Score</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Fluency Progress Over Time</span>
            <Badge className={trend.color.replace("text-", "bg-").replace("-500", "-100")}>
              {trend.label}
            </Badge>
          </CardTitle>
          <CardDescription>
            Words Correct Per Minute (WCPM) across {assessments.length} assessments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple bar chart visualization */}
          <div className="space-y-4">
            {/* Target line reference */}
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <div className="w-4 h-0.5 bg-green-500" />
              <span>Target: {targetWCPM} WCPM</span>
            </div>

            {/* Chart area */}
            <div className="relative h-64 border-l border-b border-gray-200">
              {/* Y-axis labels */}
              <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-xs text-gray-400">
                <span>{maxWCPM}</span>
                <span>{Math.round(maxWCPM * 0.75)}</span>
                <span>{Math.round(maxWCPM * 0.5)}</span>
                <span>{Math.round(maxWCPM * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Target line */}
              <div 
                className="absolute w-full border-t-2 border-dashed border-green-400"
                style={{ bottom: `${(targetWCPM / maxWCPM) * 100}%` }}
              />

              {/* Bars */}
              <div className="absolute inset-0 flex items-end justify-around px-4">
                {sortedAssessments.map((assessment, index) => {
                  const heightPercent = (assessment.wordsCorrectPerMinute / maxWCPM) * 100;
                  const meetsTarget = assessment.wordsCorrectPerMinute >= targetWCPM;
                  
                  return (
                    <div key={assessment.id} className="flex flex-col items-center gap-1 group">
                      {/* Bar */}
                      <div 
                        className={`w-8 md:w-12 rounded-t transition-all ${
                          meetsTarget ? "bg-green-500" : "bg-blue-500"
                        } hover:opacity-80`}
                        style={{ height: `${heightPercent}%` }}
                        title={`${assessment.wordsCorrectPerMinute} WCPM`}
                      />
                      {/* Label */}
                      <div className="text-xs text-gray-500 transform -rotate-45 origin-top-left">
                        {new Date(assessment.assessmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                        <div>{assessment.passageTitle}</div>
                        <div>{assessment.wordsCorrectPerMinute} WCPM</div>
                        <div>{Math.round(assessment.accuracy)}% accuracy</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedAssessments.slice().reverse().map((assessment) => (
              <div 
                key={assessment.id}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50"
              >
                <div>
                  <div className="font-medium">{assessment.passageTitle}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(assessment.assessmentDate).toLocaleDateString()} • {assessment.passageLevel}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-bold text-lg">{assessment.wordsCorrectPerMinute}</div>
                    <div className="text-xs text-gray-500">WCPM</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold text-lg ${
                      assessment.accuracy >= 97 ? "text-green-600" :
                      assessment.accuracy >= 90 ? "text-yellow-600" : "text-red-600"
                    }`}>
                      {Math.round(assessment.accuracy)}%
                    </div>
                    <div className="text-xs text-gray-500">Accuracy</div>
                  </div>
                  {assessment.prosodyTotal && (
                    <div className="text-right">
                      <div className="font-bold text-lg text-theme-primary">{assessment.prosodyTotal}/16</div>
                      <div className="text-xs text-gray-500">Prosody</div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default FluencyProgressChart;
