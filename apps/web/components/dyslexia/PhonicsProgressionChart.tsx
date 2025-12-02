"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  CheckCircle2, 
  Circle, 
  Lock,
  Unlock,
  Star,
  TrendingUp
} from "lucide-react";

type PhonicsCategory = 
  | "SINGLE_CONSONANTS"
  | "SHORT_VOWELS"
  | "CONSONANT_DIGRAPHS"
  | "CONSONANT_BLENDS"
  | "LONG_VOWELS_CVCe"
  | "VOWEL_TEAMS"
  | "R_CONTROLLED_VOWELS"
  | "DIPHTHONGS"
  | "COMPLEX_CONSONANTS"
  | "ADVANCED_VOWELS"
  | "MULTISYLLABIC"
  | "MORPHOLOGY";

type MasteryLevel = "NOT_INTRODUCED" | "EMERGING" | "DEVELOPING" | "PROFICIENT" | "MASTERED" | "AUTOMATICITY";

interface PhonicsSkill {
  id: string;
  category: PhonicsCategory;
  level: number;
  pattern: string;
  patternName: string;
  exampleWords: string[];
  masteryLevel: MasteryLevel;
  readingAccuracy: number;
  spellingAccuracy: number;
  totalExposures: number;
  ogSequenceNumber?: number;
}

interface PhonicsProgressionChartProps {
  skills: PhonicsSkill[];
  currentLevel: number;
  onSkillClick?: (skill: PhonicsSkill) => void;
}

// Orton-Gillingham Scope & Sequence
const OG_LEVELS = [
  { level: 1, name: "Single Consonants & Short Vowels", category: "SINGLE_CONSONANTS" as PhonicsCategory },
  { level: 2, name: "Consonant Digraphs", category: "CONSONANT_DIGRAPHS" as PhonicsCategory },
  { level: 3, name: "Consonant Blends", category: "CONSONANT_BLENDS" as PhonicsCategory },
  { level: 4, name: "Long Vowels (CVCe)", category: "LONG_VOWELS_CVCe" as PhonicsCategory },
  { level: 5, name: "Vowel Teams - Part 1", category: "VOWEL_TEAMS" as PhonicsCategory },
  { level: 6, name: "Vowel Teams - Part 2", category: "DIPHTHONGS" as PhonicsCategory },
  { level: 7, name: "R-Controlled Vowels", category: "R_CONTROLLED_VOWELS" as PhonicsCategory },
  { level: 8, name: "Complex Consonants", category: "COMPLEX_CONSONANTS" as PhonicsCategory },
  { level: 9, name: "Advanced Vowel Patterns", category: "ADVANCED_VOWELS" as PhonicsCategory },
  { level: 10, name: "Multisyllabic - Closed & Open", category: "MULTISYLLABIC" as PhonicsCategory },
  { level: 11, name: "Multisyllabic - Advanced", category: "MULTISYLLABIC" as PhonicsCategory },
  { level: 12, name: "Morphology", category: "MORPHOLOGY" as PhonicsCategory },
];

const MASTERY_COLORS: Record<MasteryLevel, string> = {
  NOT_INTRODUCED: "bg-gray-200",
  EMERGING: "bg-yellow-300",
  DEVELOPING: "bg-orange-300",
  PROFICIENT: "bg-blue-400",
  MASTERED: "bg-green-500",
  AUTOMATICITY: "bg-theme-primary",
};

export function PhonicsProgressionChart({ skills, currentLevel, onSkillClick }: PhonicsProgressionChartProps) {
  // Group skills by level
  const skillsByLevel = skills.reduce((acc, skill) => {
    if (!acc[skill.level]) {
      acc[skill.level] = [];
    }
    acc[skill.level].push(skill);
    return acc;
  }, {} as Record<number, PhonicsSkill[]>);

  // Calculate level progress
  const getLevelProgress = (level: number) => {
    const levelSkills = skillsByLevel[level] || [];
    if (levelSkills.length === 0) return { mastered: 0, total: 0, percent: 0 };
    
    const mastered = levelSkills.filter(s => 
      s.masteryLevel === "MASTERED" || s.masteryLevel === "AUTOMATICITY"
    ).length;
    
    return {
      mastered,
      total: levelSkills.length,
      percent: Math.round((mastered / levelSkills.length) * 100)
    };
  };

  // Calculate overall stats
  const totalSkills = skills.length;
  const masteredSkills = skills.filter(s => 
    s.masteryLevel === "MASTERED" || s.masteryLevel === "AUTOMATICITY"
  ).length;
  const avgReadingAccuracy = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.readingAccuracy, 0) / skills.length
    : 0;
  const avgSpellingAccuracy = skills.length > 0
    ? skills.reduce((sum, s) => sum + s.spellingAccuracy, 0) / skills.length
    : 0;

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-theme-primary">{currentLevel}</div>
            <div className="text-sm text-gray-500">Current Level</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{masteredSkills}/{totalSkills}</div>
            <div className="text-sm text-gray-500">Patterns Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{Math.round(avgReadingAccuracy)}%</div>
            <div className="text-sm text-gray-500">Reading Accuracy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{Math.round(avgSpellingAccuracy)}%</div>
            <div className="text-sm text-gray-500">Spelling Accuracy</div>
          </CardContent>
        </Card>
      </div>

      {/* Progression Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-theme-primary" />
            Orton-Gillingham Progression
          </CardTitle>
          <CardDescription>
            12-level structured literacy scope and sequence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {OG_LEVELS.map((ogLevel) => {
              const progress = getLevelProgress(ogLevel.level);
              const isCurrentLevel = ogLevel.level === currentLevel;
              const isLocked = ogLevel.level > currentLevel;
              const isCompleted = progress.percent === 100;
              
              return (
                <div
                  key={ogLevel.level}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    isCurrentLevel
                      ? "border-theme-primary bg-theme-primary/10"
                      : isLocked
                      ? "border-gray-200 bg-gray-50 opacity-60"
                      : isCompleted
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isCompleted ? "bg-green-500 text-white" :
                        isCurrentLevel ? "bg-theme-primary text-white" :
                        isLocked ? "bg-gray-300 text-gray-500" :
                        "bg-blue-100 text-blue-600"
                      }`}>
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : isLocked ? (
                          <Lock className="h-4 w-4" />
                        ) : isCurrentLevel ? (
                          <Star className="h-4 w-4" />
                        ) : (
                          <span className="text-sm font-bold">{ogLevel.level}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          Level {ogLevel.level}: {ogLevel.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {progress.mastered} of {progress.total || "?"} patterns mastered
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isCurrentLevel && (
                        <Badge className="bg-theme-primary">Current</Badge>
                      )}
                      {isCompleted && (
                        <Badge className="bg-green-500">Complete</Badge>
                      )}
                      {!isLocked && !isCompleted && (
                        <Badge variant="outline">{progress.percent}%</Badge>
                      )}
                    </div>
                  </div>
                  
                  {!isLocked && progress.total > 0 && (
                    <Progress 
                      value={progress.percent} 
                      className="h-2 mt-2" 
                    />
                  )}
                  
                  {/* Show patterns for current level */}
                  {isCurrentLevel && skillsByLevel[ogLevel.level] && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="text-sm font-medium mb-2">Patterns in this level:</div>
                      <div className="flex flex-wrap gap-2">
                        {skillsByLevel[ogLevel.level].map((skill) => (
                          <div
                            key={skill.id}
                            className={`px-3 py-1 rounded-full text-sm cursor-pointer transition-all hover:scale-105 ${
                              MASTERY_COLORS[skill.masteryLevel]
                            } ${
                              skill.masteryLevel === "MASTERED" || skill.masteryLevel === "AUTOMATICITY"
                                ? "text-white"
                                : "text-gray-800"
                            }`}
                            onClick={() => onSkillClick?.(skill)}
                            title={`${skill.patternName}: ${skill.masteryLevel}`}
                          >
                            {skill.pattern}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Mastery Legend */}
      <Card>
        <CardContent className="pt-4">
          <div className="text-sm font-medium mb-2">Mastery Levels:</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(MASTERY_COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className={`w-4 h-4 rounded ${color}`} />
                <span className="text-sm">
                  {level.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default PhonicsProgressionChart;
