"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  ListChecks,
  Target,
  Calendar,
  BarChart3,
  MapPin,
} from "lucide-react";

// Types
interface TaskStep {
  stepNumber: number;
  description: string;
  percentageComplete: number;
  isComplete: boolean;
}

interface DataPoint {
  id: string;
  recordedAt: string;
  prompt: string;
  accuracy: number;
  duration?: number;
  setting: string;
  notes?: string;
}

interface SkillProgress {
  skillId: string;
  skillName: string;
  domain: string;
  currentMasteryLevel: string;
  percentageComplete: number;
  lastPracticed?: string;
  taskSteps?: TaskStep[];
  recentDataPoints?: DataPoint[];
  goalStatus?: {
    targetMastery: string;
    targetDate: string;
    onTrack: boolean;
  };
  generalizationSettings?: string[];
}

interface SkillProgressTrackerProps {
  skills: SkillProgress[];
  onSkillSelect?: (skillId: string) => void;
  onRecordData?: (skillId: string) => void;
}

const masteryLevelColors: Record<string, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-800",
  EMERGING: "bg-yellow-100 text-yellow-800",
  DEVELOPING: "bg-blue-100 text-blue-800",
  PROFICIENT: "bg-green-100 text-green-800",
  MASTERED: "bg-purple-100 text-purple-800",
  GENERALIZED: "bg-indigo-100 text-indigo-800",
};

const domainLabels: Record<string, string> = {
  MONEY_MANAGEMENT: "Money Management",
  COOKING_NUTRITION: "Cooking & Nutrition",
  TRANSPORTATION: "Transportation",
  HOUSING_HOME_CARE: "Housing & Home Care",
  HEALTH_SAFETY: "Health & Safety",
  COMMUNITY_RESOURCES: "Community Resources",
};

const promptLabels: Record<string, string> = {
  INDEPENDENT: "Independent",
  VERBAL: "Verbal",
  GESTURAL: "Gestural",
  MODEL: "Model",
  PARTIAL_PHYSICAL: "Partial Physical",
  FULL_PHYSICAL: "Full Physical",
};

export function SkillProgressTracker({
  skills,
  onSkillSelect,
  onRecordData,
}: SkillProgressTrackerProps) {
  const [expandedSkills, setExpandedSkills] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [filterDomain, setFilterDomain] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "progress" | "lastPracticed">("progress");

  const toggleExpand = (skillId: string) => {
    const newExpanded = new Set(expandedSkills);
    if (newExpanded.has(skillId)) {
      newExpanded.delete(skillId);
    } else {
      newExpanded.add(skillId);
    }
    setExpandedSkills(newExpanded);
  };

  // Filter and sort skills
  const filteredSkills = useMemo(() => {
    let result = [...skills];

    if (filterDomain !== "all") {
      result = result.filter((s) => s.domain === filterDomain);
    }

    result.sort((a, b) => {
      if (sortBy === "name") {
        return a.skillName.localeCompare(b.skillName);
      } else if (sortBy === "progress") {
        return b.percentageComplete - a.percentageComplete;
      } else if (sortBy === "lastPracticed") {
        if (!a.lastPracticed) return 1;
        if (!b.lastPracticed) return -1;
        return new Date(b.lastPracticed).getTime() - new Date(a.lastPracticed).getTime();
      }
      return 0;
    });

    return result;
  }, [skills, filterDomain, sortBy]);

  // Get unique domains
  const domains = useMemo(() => {
    const uniqueDomains = new Set(skills.map((s) => s.domain));
    return Array.from(uniqueDomains);
  }, [skills]);

  // Calculate progress trend from recent data points
  const calculateTrend = (dataPoints?: DataPoint[]): "up" | "down" | "stable" => {
    if (!dataPoints || dataPoints.length < 2) return "stable";
    const recent = dataPoints.slice(0, 3);
    const avgRecent = recent.reduce((sum, dp) => sum + dp.accuracy, 0) / recent.length;
    const older = dataPoints.slice(3, 6);
    if (older.length === 0) return "stable";
    const avgOlder = older.reduce((sum, dp) => sum + dp.accuracy, 0) / older.length;
    if (avgRecent > avgOlder + 5) return "up";
    if (avgRecent < avgOlder - 5) return "down";
    return "stable";
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "Never";
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-4">
              {/* Domain Filter */}
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(e.target.value)}
                className="px-3 py-1.5 border rounded-md text-sm bg-background"
              >
                <option value="all">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain} value={domain}>
                    {domainLabels[domain] || domain}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="px-3 py-1.5 border rounded-md text-sm bg-background"
              >
                <option value="progress">Sort by Progress</option>
                <option value="name">Sort by Name</option>
                <option value="lastPracticed">Sort by Recent</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-md">
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-sm rounded-l-md ${
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                List
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1.5 text-sm rounded-r-md ${
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                }`}
              >
                Grid
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills List/Grid */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
        {filteredSkills.map((skill) => {
          const isExpanded = expandedSkills.has(skill.skillId);
          const trend = calculateTrend(skill.recentDataPoints);

          return (
            <Card key={skill.skillId} className="overflow-hidden">
              <CardHeader className="pb-2">
                <div
                  className="flex items-start justify-between cursor-pointer"
                  onClick={() => toggleExpand(skill.skillId)}
                >
                  <div className="flex items-start gap-2">
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mt-0.5 text-muted-foreground" />
                    )}
                    <div>
                      <h3 className="font-medium">{skill.skillName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {domainLabels[skill.domain] || skill.domain}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                    {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                    {trend === "stable" && <Minus className="h-4 w-4 text-gray-400" />}
                    <Badge className={masteryLevelColors[skill.currentMasteryLevel]}>
                      {skill.currentMasteryLevel.replace("_", " ")}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{skill.percentageComplete.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        skill.percentageComplete >= 80
                          ? "bg-green-500"
                          : skill.percentageComplete >= 50
                          ? "bg-blue-500"
                          : skill.percentageComplete >= 25
                          ? "bg-yellow-500"
                          : "bg-gray-400"
                      }`}
                      style={{ width: `${skill.percentageComplete}%` }}
                    />
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex gap-4 text-sm text-muted-foreground mb-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(skill.lastPracticed)}
                  </span>
                  {skill.generalizationSettings && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {skill.generalizationSettings.length} settings
                    </span>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    {/* Goal Status */}
                    {skill.goalStatus && (
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <Target className="h-4 w-4" />
                          Goal Status
                        </h4>
                        <div className="flex justify-between text-sm">
                          <span>Target: {skill.goalStatus.targetMastery.replace("_", " ")}</span>
                          <span>Due: {formatDate(skill.goalStatus.targetDate)}</span>
                        </div>
                        <Badge
                          className={`mt-2 ${
                            skill.goalStatus.onTrack
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {skill.goalStatus.onTrack ? "On Track" : "Needs Attention"}
                        </Badge>
                      </div>
                    )}

                    {/* Task Steps */}
                    {skill.taskSteps && skill.taskSteps.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <ListChecks className="h-4 w-4" />
                          Task Steps ({skill.taskSteps.filter((s) => s.isComplete).length}/{skill.taskSteps.length})
                        </h4>
                        <div className="space-y-1.5">
                          {skill.taskSteps.map((step) => (
                            <div
                              key={step.stepNumber}
                              className="flex items-center gap-2 text-sm"
                            >
                              <span
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                                  step.isComplete
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {step.stepNumber}
                              </span>
                              <span className={step.isComplete ? "text-muted-foreground line-through" : ""}>
                                {step.description}
                              </span>
                              <span className="ml-auto text-xs text-muted-foreground">
                                {step.percentageComplete.toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recent Data Points */}
                    {skill.recentDataPoints && skill.recentDataPoints.length > 0 && (
                      <div>
                        <h4 className="font-medium text-sm flex items-center gap-2 mb-2">
                          <BarChart3 className="h-4 w-4" />
                          Recent Data ({skill.recentDataPoints.length})
                        </h4>
                        <div className="space-y-2">
                          {skill.recentDataPoints.slice(0, 5).map((dp) => (
                            <div
                              key={dp.id}
                              className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                            >
                              <div>
                                <span className="font-medium">{dp.accuracy}%</span>
                                <span className="text-muted-foreground ml-2">
                                  {promptLabels[dp.prompt] || dp.prompt}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(dp.recordedAt)} • {dp.setting}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {onRecordData && (
                        <button
                          onClick={() => onRecordData(skill.skillId)}
                          className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
                        >
                          Record Data
                        </button>
                      )}
                      {onSkillSelect && (
                        <button
                          onClick={() => onSkillSelect(skill.skillId)}
                          className="flex-1 px-3 py-2 border rounded-md text-sm hover:bg-muted"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredSkills.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <ListChecks className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No skills found matching the current filters.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default SkillProgressTracker;
