"use client";

import React, { useState, ChangeEvent } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Search, Filter, ChevronRight, Star, AlertTriangle } from "lucide-react";

// Types
interface FunctionalSkill {
  id: string;
  domain: string;
  name: string;
  description: string;
  totalSteps: number;
  isCriticalSafety: boolean;
  communityRelevance: number;
  employmentRelevance: number;
  targetSettings: string[];
}

interface ILSSkillBrowserProps {
  skills: FunctionalSkill[];
  onSkillSelect: (skillId: string) => void;
  selectedSkillId?: string;
  learnerProgress?: Record<string, { masteryLevel: string; percentMastered: number }>;
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
  MONEY_MANAGEMENT: "bg-green-100 text-green-800 border-green-200",
  COOKING_NUTRITION: "bg-orange-100 text-orange-800 border-orange-200",
  TRANSPORTATION: "bg-blue-100 text-blue-800 border-blue-200",
  HOUSING_HOME_CARE: "bg-theme-primary/10 text-theme-primary border-theme-primary/20",
  HEALTH_SAFETY: "bg-red-100 text-red-800 border-red-200",
  COMMUNITY_RESOURCES: "bg-yellow-100 text-yellow-800 border-yellow-200",
};

const masteryColors: Record<string, string> = {
  NOT_INTRODUCED: "bg-gray-100 text-gray-600",
  AWARENESS: "bg-gray-200 text-gray-700",
  EMERGING: "bg-yellow-100 text-yellow-700",
  DEVELOPING: "bg-orange-100 text-orange-700",
  PRACTICING: "bg-blue-100 text-blue-700",
  INDEPENDENT: "bg-green-100 text-green-700",
  MASTERED: "bg-green-200 text-green-800",
  GENERALIZED: "bg-theme-primary/10 text-theme-primary",
};

export function ILSSkillBrowser({
  skills,
  onSkillSelect,
  selectedSkillId,
  learnerProgress = {},
}: ILSSkillBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Filter skills
  const filteredSkills = skills.filter((skill) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      skill.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDomain = selectedDomain === "all" || skill.domain === selectedDomain;
    const matchesCritical = !showCriticalOnly || skill.isCriticalSafety;

    return matchesSearch && matchesDomain && matchesCritical;
  });

  // Group by domain
  const skillsByDomain = filteredSkills.reduce((acc, skill) => {
    if (!acc[skill.domain]) {
      acc[skill.domain] = [];
    }
    acc[skill.domain].push(skill);
    return acc;
  }, {} as Record<string, FunctionalSkill[]>);

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search skills..."
            value={searchQuery}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        
        <select
          value={selectedDomain}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedDomain(e.target.value)}
          className="px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="all">All Domains</option>
          {Object.entries(domainLabels).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowCriticalOnly(!showCriticalOnly)}
          className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${
            showCriticalOnly
              ? "bg-red-500 text-white"
              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          Safety Critical
        </button>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        Showing {filteredSkills.length} of {skills.length} skills
      </p>

      {/* Skills List by Domain */}
      <div className="space-y-6">
        {Object.entries(skillsByDomain).map(([domain, domainSkills]) => (
          <div key={domain}>
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <Badge className={domainColors[domain]}>
                {domainLabels[domain]}
              </Badge>
              <span className="text-muted-foreground text-sm">
                ({domainSkills.length} skills)
              </span>
            </h3>

            <div className="grid gap-3">
              {domainSkills.map((skill) => {
                const progress = learnerProgress[skill.id];
                const isSelected = selectedSkillId === skill.id;

                return (
                  <div
                    key={skill.id}
                    onClick={() => onSkillSelect(skill.id)}
                    className={`cursor-pointer transition-all hover:shadow-md border rounded-lg ${
                      isSelected ? "ring-2 ring-primary" : ""
                    }`}
                  >
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-medium truncate">{skill.name}</h4>
                              {skill.isCriticalSafety && (
                                <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {skill.description}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="text-xs text-muted-foreground">
                                {skill.totalSteps} steps
                              </span>
                              <div className="flex items-center gap-1">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-3 w-3 ${
                                      i < skill.communityRelevance
                                        ? "text-yellow-500 fill-yellow-500"
                                        : "text-gray-300"
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-2">
                            {progress ? (
                              <>
                                <Badge className={masteryColors[progress.masteryLevel]}>
                                  {progress.masteryLevel.replace(/_/g, " ")}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {progress.percentMastered.toFixed(0)}%
                                </span>
                              </>
                            ) : (
                              <Badge variant="outline">Not Assigned</Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {filteredSkills.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No skills found matching your criteria</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ILSSkillBrowser;
