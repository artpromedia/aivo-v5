"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Star,
  Volume2,
  Music,
  Puzzle
} from "lucide-react";

type PhonologicalSkillType = 
  | "RHYME_RECOGNITION"
  | "RHYME_PRODUCTION"
  | "SYLLABLE_SEGMENTATION"
  | "SYLLABLE_BLENDING"
  | "ONSET_RIME"
  | "PHONEME_ISOLATION"
  | "PHONEME_BLENDING"
  | "PHONEME_SEGMENTATION"
  | "PHONEME_MANIPULATION"
  | "PHONEME_DELETION";

type MasteryLevel = "NOT_INTRODUCED" | "EMERGING" | "DEVELOPING" | "PROFICIENT" | "MASTERED" | "AUTOMATICITY";

interface PhonologicalSkill {
  id: string;
  skillType: PhonologicalSkillType;
  masteryLevel: MasteryLevel;
  accuracyPercent: number;
  totalAttempts: number;
  correctAttempts: number;
  practiceMinutes: number;
  lastAssessedAt?: string;
}

interface PhonologicalSkillsMatrixProps {
  skills: PhonologicalSkill[];
  onSkillClick?: (skill: PhonologicalSkill) => void;
}

const SKILL_INFO: Record<PhonologicalSkillType, { label: string; description: string; icon: React.ReactNode; level: number }> = {
  RHYME_RECOGNITION: { 
    label: "Rhyme Recognition", 
    description: "Identifying words that rhyme",
    icon: <Music className="h-4 w-4" />,
    level: 1
  },
  RHYME_PRODUCTION: { 
    label: "Rhyme Production", 
    description: "Creating rhyming words",
    icon: <Music className="h-4 w-4" />,
    level: 1
  },
  SYLLABLE_SEGMENTATION: { 
    label: "Syllable Segmentation", 
    description: "Breaking words into syllables",
    icon: <Puzzle className="h-4 w-4" />,
    level: 2
  },
  SYLLABLE_BLENDING: { 
    label: "Syllable Blending", 
    description: "Combining syllables into words",
    icon: <Puzzle className="h-4 w-4" />,
    level: 2
  },
  ONSET_RIME: { 
    label: "Onset-Rime", 
    description: "Separating beginning sound from word ending",
    icon: <Volume2 className="h-4 w-4" />,
    level: 3
  },
  PHONEME_ISOLATION: { 
    label: "Phoneme Isolation", 
    description: "Identifying individual sounds in words",
    icon: <Volume2 className="h-4 w-4" />,
    level: 4
  },
  PHONEME_BLENDING: { 
    label: "Phoneme Blending", 
    description: "Combining individual sounds into words",
    icon: <Volume2 className="h-4 w-4" />,
    level: 4
  },
  PHONEME_SEGMENTATION: { 
    label: "Phoneme Segmentation", 
    description: "Breaking words into individual sounds",
    icon: <Volume2 className="h-4 w-4" />,
    level: 5
  },
  PHONEME_MANIPULATION: { 
    label: "Phoneme Manipulation", 
    description: "Changing sounds in words to make new words",
    icon: <Volume2 className="h-4 w-4" />,
    level: 6
  },
  PHONEME_DELETION: { 
    label: "Phoneme Deletion", 
    description: "Removing sounds from words",
    icon: <Volume2 className="h-4 w-4" />,
    level: 6
  },
};

const MASTERY_CONFIG: Record<MasteryLevel, { color: string; bgColor: string; icon: React.ReactNode; label: string }> = {
  NOT_INTRODUCED: { color: "text-gray-400", bgColor: "bg-gray-100", icon: <Circle className="h-4 w-4" />, label: "Not Started" },
  EMERGING: { color: "text-yellow-500", bgColor: "bg-yellow-50", icon: <Clock className="h-4 w-4" />, label: "Emerging" },
  DEVELOPING: { color: "text-orange-500", bgColor: "bg-orange-50", icon: <Clock className="h-4 w-4" />, label: "Developing" },
  PROFICIENT: { color: "text-blue-500", bgColor: "bg-blue-50", icon: <CheckCircle2 className="h-4 w-4" />, label: "Proficient" },
  MASTERED: { color: "text-green-500", bgColor: "bg-green-50", icon: <CheckCircle2 className="h-4 w-4" />, label: "Mastered" },
  AUTOMATICITY: { color: "text-theme-primary", bgColor: "bg-theme-primary/10", icon: <Star className="h-4 w-4" />, label: "Automatic" },
};

// Group skills by developmental level
const SKILL_LEVELS = [
  { level: 1, name: "Rhyme Awareness", skills: ["RHYME_RECOGNITION", "RHYME_PRODUCTION"] },
  { level: 2, name: "Syllable Awareness", skills: ["SYLLABLE_SEGMENTATION", "SYLLABLE_BLENDING"] },
  { level: 3, name: "Onset-Rime", skills: ["ONSET_RIME"] },
  { level: 4, name: "Basic Phonemic Awareness", skills: ["PHONEME_ISOLATION", "PHONEME_BLENDING"] },
  { level: 5, name: "Advanced Phonemic Awareness", skills: ["PHONEME_SEGMENTATION"] },
  { level: 6, name: "Expert Phonemic Awareness", skills: ["PHONEME_MANIPULATION", "PHONEME_DELETION"] },
];

export function PhonologicalSkillsMatrix({ skills, onSkillClick }: PhonologicalSkillsMatrixProps) {
  // Create a map of skills by type for easy lookup
  const skillsMap = new Map(skills.map(s => [s.skillType, s]));

  // Calculate overall progress
  const totalSkills = Object.keys(SKILL_INFO).length;
  const masteredSkills = skills.filter(s => 
    s.masteryLevel === "MASTERED" || s.masteryLevel === "AUTOMATICITY"
  ).length;
  const overallProgress = (masteredSkills / totalSkills) * 100;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Phonological Awareness Progress</CardTitle>
          <CardDescription>
            {masteredSkills} of {totalSkills} skills mastered
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={overallProgress} className="h-3" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>0%</span>
              <span className="font-medium">{Math.round(overallProgress)}% Complete</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Mastery Legend */}
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(MASTERY_CONFIG).map(([level, config]) => (
              <div key={level} className="flex items-center gap-1 text-xs">
                <span className={config.color}>{config.icon}</span>
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Skills by Developmental Level */}
      <div className="space-y-4">
        {SKILL_LEVELS.map((levelGroup) => {
          const levelSkills = levelGroup.skills.map(st => ({
            type: st as PhonologicalSkillType,
            data: skillsMap.get(st as PhonologicalSkillType)
          }));
          
          const levelMastered = levelSkills.filter(s => 
            s.data?.masteryLevel === "MASTERED" || s.data?.masteryLevel === "AUTOMATICITY"
          ).length;
          
          return (
            <Card key={levelGroup.level}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">
                      Level {levelGroup.level}: {levelGroup.name}
                    </CardTitle>
                    <CardDescription>
                      {levelMastered} of {levelGroup.skills.length} skills mastered
                    </CardDescription>
                  </div>
                  <Badge variant={levelMastered === levelGroup.skills.length ? "default" : "outline"}>
                    {Math.round((levelMastered / levelGroup.skills.length) * 100)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3">
                  {levelSkills.map(({ type, data }) => {
                    const info = SKILL_INFO[type];
                    const mastery = data?.masteryLevel || "NOT_INTRODUCED";
                    const config = MASTERY_CONFIG[mastery];
                    
                    return (
                      <div
                        key={type}
                        className={`p-3 rounded-lg border ${config.bgColor} cursor-pointer hover:shadow-md transition-shadow`}
                        onClick={() => data && onSkillClick?.(data)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <span className={config.color}>{info.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{info.label}</div>
                              <div className="text-xs text-gray-500">{info.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm ${config.color}`}>{config.icon}</span>
                            <Badge variant="outline" className="text-xs">
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                        
                        {data && data.totalAttempts > 0 && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Accuracy: {Math.round(data.accuracyPercent)}%</span>
                              <span>{data.correctAttempts}/{data.totalAttempts} correct</span>
                              <span>{data.practiceMinutes} min practiced</span>
                            </div>
                            <Progress 
                              value={data.accuracyPercent} 
                              className="h-1.5 mt-2" 
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default PhonologicalSkillsMatrix;
