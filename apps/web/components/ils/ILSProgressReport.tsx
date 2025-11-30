"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  TrendingUp, TrendingDown, Minus, Target, 
  Calendar, MapPin, CheckCircle2, AlertCircle 
} from "lucide-react";

// Types
interface SkillProgressSummary {
  skillId: string;
  skillName: string;
  domain: string;
  startMasteryLevel: string;
  endMasteryLevel: string;
  startPercent: number;
  endPercent: number;
  growth: number;
  dataPointsCollected: number;
  settingsPracticed: string[];
}

interface GoalsSummary {
  total: number;
  active: number;
  achieved: number;
  notAchieved: number;
}

interface CBISummary {
  totalSessions: number;
  completed: number;
  averageSuccessRating: number;
  settingsVisited: string[];
}

interface GeneralizationSummary {
  totalSettingsTracked: number;
  settingsMastered: number;
  settingsInProgress: number;
  averageSuccessRate: number;
}

interface ILSProgressReportProps {
  learnerId: string;
  learnerName: string;
  reportPeriodStart: string;
  reportPeriodEnd: string;
  generatedAt: string;
  skillsTracked: number;
  skillsImproved: number;
  skillsMastered: number;
  averageGrowth: number;
  skillProgress: SkillProgressSummary[];
  goalsSummary?: GoalsSummary;
  cbiSummary?: CBISummary;
  generalizationSummary?: GeneralizationSummary;
  recommendations: string[];
  nextSteps: string[];
}

const domainLabels: Record<string, string> = {
  MONEY_MANAGEMENT: "Money Management",
  COOKING_NUTRITION: "Cooking & Nutrition",
  TRANSPORTATION: "Transportation",
  HOUSING_HOME_CARE: "Housing & Home Care",
  HEALTH_SAFETY: "Health & Safety",
  COMMUNITY_RESOURCES: "Community Resources",
};

const domainColors: Record<string, string> = {
  MONEY_MANAGEMENT: "bg-green-100 text-green-800",
  COOKING_NUTRITION: "bg-orange-100 text-orange-800",
  TRANSPORTATION: "bg-blue-100 text-blue-800",
  HOUSING_HOME_CARE: "bg-purple-100 text-purple-800",
  HEALTH_SAFETY: "bg-red-100 text-red-800",
  COMMUNITY_RESOURCES: "bg-yellow-100 text-yellow-800",
};

export function ILSProgressReport({
  learnerId,
  learnerName,
  reportPeriodStart,
  reportPeriodEnd,
  generatedAt,
  skillsTracked,
  skillsImproved,
  skillsMastered,
  averageGrowth,
  skillProgress,
  goalsSummary,
  cbiSummary,
  generalizationSummary,
  recommendations,
  nextSteps,
}: ILSProgressReportProps) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Group skills by domain
  const skillsByDomain = skillProgress.reduce((acc, skill) => {
    if (!acc[skill.domain]) {
      acc[skill.domain] = [];
    }
    acc[skill.domain].push(skill);
    return acc;
  }, {} as Record<string, SkillProgressSummary[]>);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <Card>
        <CardHeader className="text-center pb-2">
          <h1 className="text-2xl font-bold">Independent Living Skills Progress Report</h1>
          <p className="text-lg text-muted-foreground">{learnerName}</p>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center gap-8 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formatDate(reportPeriodStart)} - {formatDate(reportPeriodEnd)}
            </span>
            <span>Generated: {formatDate(generatedAt)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold text-lg">Executive Summary</h2>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-3xl font-bold text-blue-600">{skillsTracked}</p>
              <p className="text-sm text-muted-foreground">Skills Tracked</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-3xl font-bold text-green-600">{skillsImproved}</p>
              <p className="text-sm text-muted-foreground">Skills Improved</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-3xl font-bold text-purple-600">{skillsMastered}</p>
              <p className="text-sm text-muted-foreground">Skills Mastered</p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-3xl font-bold text-orange-600">
                {averageGrowth >= 0 ? "+" : ""}{averageGrowth.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Avg. Growth</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Summary */}
      {goalsSummary && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              ILS Goals Progress
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{goalsSummary.total}</p>
                <p className="text-xs text-muted-foreground">Total Goals</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{goalsSummary.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{goalsSummary.achieved}</p>
                <p className="text-xs text-muted-foreground">Achieved</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{goalsSummary.notAchieved}</p>
                <p className="text-xs text-muted-foreground">Not Achieved</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* CBI Summary */}
      {cbiSummary && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Community-Based Instruction
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{cbiSummary.totalSessions}</p>
                <p className="text-xs text-muted-foreground">Total Sessions</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{cbiSummary.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{cbiSummary.averageSuccessRating.toFixed(1)}/5</p>
                <p className="text-xs text-muted-foreground">Avg. Rating</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold">{cbiSummary.settingsVisited.length}</p>
                <p className="text-xs text-muted-foreground">Settings Visited</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generalization Summary */}
      {generalizationSummary && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg">Generalization Progress</h2>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">Settings Mastered</span>
              <span className="font-medium">
                {generalizationSummary.settingsMastered} / {generalizationSummary.totalSettingsTracked}
              </span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500"
                style={{
                  width: `${(generalizationSummary.settingsMastered / generalizationSummary.totalSettingsTracked) * 100}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Average success rate: {generalizationSummary.averageSuccessRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      )}

      {/* Skill Progress by Domain */}
      <Card>
        <CardHeader className="pb-2">
          <h2 className="font-semibold text-lg">Detailed Skill Progress</h2>
        </CardHeader>
        <CardContent>
          {Object.entries(skillsByDomain).map(([domain, skills]) => (
            <div key={domain} className="mb-6 last:mb-0">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <Badge className={domainColors[domain]}>
                  {domainLabels[domain] || domain}
                </Badge>
              </h3>
              <div className="space-y-3">
                {skills.map((skill) => (
                  <div
                    key={skill.skillId}
                    className="p-3 border rounded-lg bg-gray-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{skill.skillName}</span>
                      <div className="flex items-center gap-2">
                        {skill.growth > 0 ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : skill.growth < 0 ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-400" />
                        )}
                        <span
                          className={`font-medium ${
                            skill.growth > 0
                              ? "text-green-600"
                              : skill.growth < 0
                              ? "text-red-600"
                              : "text-gray-600"
                          }`}
                        >
                          {skill.growth >= 0 ? "+" : ""}{skill.growth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        {skill.startPercent.toFixed(0)}% → {skill.endPercent.toFixed(0)}%
                      </span>
                      <span className="text-muted-foreground">
                        {skill.dataPointsCollected} data points
                      </span>
                      <span className="text-muted-foreground">
                        {skill.settingsPracticed.length} settings
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all"
                        style={{ width: `${skill.endPercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Recommendations
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {recommendations.map((rec, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-orange-500 mt-1">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Next Steps */}
      {nextSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Next Steps
            </h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {nextSteps.map((step, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Print Button */}
      <div className="text-center py-4 print:hidden">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
        >
          Print Report
        </button>
      </div>
    </div>
  );
}

export default ILSProgressReport;
