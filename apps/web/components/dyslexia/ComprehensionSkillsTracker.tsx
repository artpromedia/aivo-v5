"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { 
  BookOpen, 
  Target, 
  Brain, 
  MessageSquare, 
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  Circle,
  ChevronRight,
  Plus,
  Save
} from "lucide-react";

// Comprehension skill types matching Prisma enum
type ComprehensionSkillType =
  | "MAIN_IDEA"
  | "SUPPORTING_DETAILS"
  | "SEQUENCING"
  | "CAUSE_EFFECT"
  | "COMPARE_CONTRAST"
  | "INFERENCE"
  | "PREDICTING"
  | "SUMMARIZING"
  | "VOCABULARY_CONTEXT"
  | "TEXT_STRUCTURE"
  | "AUTHORS_PURPOSE"
  | "FACT_OPINION";

interface ComprehensionSkill {
  id: string;
  skillType: ComprehensionSkillType;
  masteryLevel: number;
  practiceCount: number;
  lastPracticed?: string;
  notes?: string;
  strategies: string[];
}

interface ComprehensionSkillsTrackerProps {
  profileId: string;
  skills: ComprehensionSkill[];
  onUpdateSkill: (skillId: string, updates: Partial<ComprehensionSkill>) => void;
  onAddPractice: (skillType: ComprehensionSkillType, notes?: string) => void;
}

const SKILL_CONFIG: Record<ComprehensionSkillType, { 
  label: string; 
  description: string; 
  icon: React.ReactNode;
  strategies: string[];
  color: string;
}> = {
  MAIN_IDEA: {
    label: "Main Idea",
    description: "Identify the central message or theme of a text",
    icon: <Target className="h-5 w-5" />,
    strategies: [
      "Ask 'What is the text mostly about?'",
      "Look at title and headings",
      "Find sentences that summarize",
      "Eliminate minor details"
    ],
    color: "bg-blue-100 text-blue-700"
  },
  SUPPORTING_DETAILS: {
    label: "Supporting Details",
    description: "Find facts and examples that support the main idea",
    icon: <BookOpen className="h-5 w-5" />,
    strategies: [
      "Ask 'Who, What, When, Where, Why, How'",
      "Highlight key facts",
      "Connect details to main idea",
      "Use graphic organizers"
    ],
    color: "bg-green-100 text-green-700"
  },
  SEQUENCING: {
    label: "Sequencing",
    description: "Understand the order of events or steps",
    icon: <ChevronRight className="h-5 w-5" />,
    strategies: [
      "Look for signal words (first, then, finally)",
      "Create a timeline",
      "Retell events in order",
      "Number the steps"
    ],
    color: "bg-theme-primary/10 text-theme-primary"
  },
  CAUSE_EFFECT: {
    label: "Cause & Effect",
    description: "Identify why something happened and what resulted",
    icon: <TrendingUp className="h-5 w-5" />,
    strategies: [
      "Ask 'Why did this happen?'",
      "Look for signal words (because, so, therefore)",
      "Use cause-effect graphic organizer",
      "Make connections between events"
    ],
    color: "bg-orange-100 text-orange-700"
  },
  COMPARE_CONTRAST: {
    label: "Compare & Contrast",
    description: "Find similarities and differences between things",
    icon: <Brain className="h-5 w-5" />,
    strategies: [
      "Use Venn diagrams",
      "Look for comparison words",
      "List similarities first, then differences",
      "Create T-charts"
    ],
    color: "bg-teal-100 text-teal-700"
  },
  INFERENCE: {
    label: "Making Inferences",
    description: "Use clues to understand what isn't directly stated",
    icon: <Lightbulb className="h-5 w-5" />,
    strategies: [
      "Combine text clues with background knowledge",
      "Ask 'What does the author really mean?'",
      "Look for implied meanings",
      "Think beyond the literal words"
    ],
    color: "bg-yellow-100 text-yellow-700"
  },
  PREDICTING: {
    label: "Predicting",
    description: "Use clues to guess what will happen next",
    icon: <MessageSquare className="h-5 w-5" />,
    strategies: [
      "Look at pictures and titles first",
      "Think about what you know",
      "Make educated guesses",
      "Confirm or revise predictions"
    ],
    color: "bg-pink-100 text-pink-700"
  },
  SUMMARIZING: {
    label: "Summarizing",
    description: "Retell the most important information briefly",
    icon: <BookOpen className="h-5 w-5" />,
    strategies: [
      "Include only key information",
      "Use your own words",
      "Keep it short",
      "Include main idea and key details"
    ],
    color: "bg-indigo-100 text-indigo-700"
  },
  VOCABULARY_CONTEXT: {
    label: "Vocabulary in Context",
    description: "Figure out word meanings from surrounding text",
    icon: <BookOpen className="h-5 w-5" />,
    strategies: [
      "Read the whole sentence",
      "Look for definition clues",
      "Find example clues",
      "Check for contrast clues"
    ],
    color: "bg-cyan-100 text-cyan-700"
  },
  TEXT_STRUCTURE: {
    label: "Text Structure",
    description: "Understand how a text is organized",
    icon: <BookOpen className="h-5 w-5" />,
    strategies: [
      "Identify text type (narrative, expository)",
      "Look at headings and subheadings",
      "Notice paragraph organization",
      "Recognize patterns"
    ],
    color: "bg-slate-100 text-slate-700"
  },
  AUTHORS_PURPOSE: {
    label: "Author's Purpose",
    description: "Understand why the author wrote the text",
    icon: <MessageSquare className="h-5 w-5" />,
    strategies: [
      "Ask: Persuade, Inform, or Entertain?",
      "Look at word choices",
      "Consider the audience",
      "Think about the message"
    ],
    color: "bg-rose-100 text-rose-700"
  },
  FACT_OPINION: {
    label: "Fact vs. Opinion",
    description: "Distinguish between provable facts and personal beliefs",
    icon: <CheckCircle2 className="h-5 w-5" />,
    strategies: [
      "Ask: Can this be proven?",
      "Look for opinion words (I think, believe)",
      "Check for evidence",
      "Identify bias indicators"
    ],
    color: "bg-amber-100 text-amber-700"
  }
};

const SKILL_ORDER: ComprehensionSkillType[] = [
  "MAIN_IDEA",
  "SUPPORTING_DETAILS",
  "SEQUENCING",
  "VOCABULARY_CONTEXT",
  "CAUSE_EFFECT",
  "COMPARE_CONTRAST",
  "PREDICTING",
  "INFERENCE",
  "SUMMARIZING",
  "TEXT_STRUCTURE",
  "AUTHORS_PURPOSE",
  "FACT_OPINION"
];

function getMasteryColor(level: number): string {
  if (level >= 80) return "bg-green-500";
  if (level >= 60) return "bg-blue-500";
  if (level >= 40) return "bg-yellow-500";
  if (level >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getMasteryLabel(level: number): string {
  if (level >= 80) return "Mastered";
  if (level >= 60) return "Proficient";
  if (level >= 40) return "Developing";
  if (level >= 20) return "Emerging";
  return "Beginning";
}

export function ComprehensionSkillsTracker({
  profileId,
  skills,
  onUpdateSkill,
  onAddPractice
}: ComprehensionSkillsTrackerProps) {
  const [selectedSkill, setSelectedSkill] = useState<ComprehensionSkillType | null>(null);
  const [practiceNotes, setPracticeNotes] = useState("");
  const [showStrategies, setShowStrategies] = useState<ComprehensionSkillType | null>(null);

  const skillsMap = useMemo(() => {
    const map = new Map<ComprehensionSkillType, ComprehensionSkill>();
    skills.forEach(skill => map.set(skill.skillType, skill));
    return map;
  }, [skills]);

  const overallProgress = useMemo(() => {
    if (skills.length === 0) return 0;
    const total = skills.reduce((sum, skill) => sum + skill.masteryLevel, 0);
    return Math.round(total / SKILL_ORDER.length);
  }, [skills]);

  const handleLogPractice = () => {
    if (selectedSkill) {
      onAddPractice(selectedSkill, practiceNotes);
      setPracticeNotes("");
      setSelectedSkill(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Reading Comprehension Skills
          </CardTitle>
          <CardDescription>
            Track progress across 12 essential comprehension skills
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Comprehension Mastery</span>
              <span className="font-semibold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="flex gap-2 text-xs text-muted-foreground">
              <span>{skills.filter(s => s.masteryLevel >= 80).length} mastered</span>
              <span>•</span>
              <span>{skills.filter(s => s.masteryLevel >= 40 && s.masteryLevel < 80).length} developing</span>
              <span>•</span>
              <span>{skills.filter(s => s.masteryLevel < 40).length} need focus</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SKILL_ORDER.map((skillType) => {
          const config = SKILL_CONFIG[skillType];
          const skill = skillsMap.get(skillType);
          const mastery = skill?.masteryLevel ?? 0;

          return (
            <div
              key={skillType}
              className={`cursor-pointer transition-all hover:shadow-md rounded-lg border bg-card ${
                selectedSkill === skillType ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedSkill(selectedSkill === skillType ? null : skillType)}
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${config.color}`}>
                    {config.icon}
                  </div>
                  <Badge 
                    variant="outline" 
                    className={getMasteryColor(mastery).replace("bg-", "border-")}
                  >
                    {getMasteryLabel(mastery)}
                  </Badge>
                </div>

                <h3 className="font-semibold mb-1">{config.label}</h3>
                <p className="text-xs text-muted-foreground mb-3">{config.description}</p>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Mastery</span>
                    <span>{mastery}%</span>
                  </div>
                  <Progress value={mastery} className="h-2" />
                </div>

                {skill && (
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{skill.practiceCount} practice sessions</span>
                    {skill.lastPracticed && (
                      <span>Last: {new Date(skill.lastPracticed).toLocaleDateString()}</span>
                    )}
                  </div>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStrategies(showStrategies === skillType ? null : skillType);
                  }}
                >
                  {showStrategies === skillType ? "Hide Strategies" : "View Strategies"}
                </Button>

                {showStrategies === skillType && (
                  <div className="mt-3 p-3 bg-muted rounded-lg">
                    <h4 className="text-xs font-semibold mb-2">Teaching Strategies:</h4>
                    <ul className="space-y-1">
                      {config.strategies.map((strategy, idx) => (
                        <li key={idx} className="text-xs flex items-start gap-2">
                          <CheckCircle2 className="h-3 w-3 mt-0.5 text-green-600 flex-shrink-0" />
                          {strategy}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Practice Logger */}
      {selectedSkill && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Log Practice: {SKILL_CONFIG[selectedSkill].label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Describe the practice activity, text used, and observations..."
              value={practiceNotes}
              onChange={(e) => setPracticeNotes(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button onClick={handleLogPractice}>
                <Save className="h-4 w-4 mr-2" />
                Log Practice Session
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedSkill(null);
                  setPracticeNotes("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Skill Focus Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Focus Recommendations</CardTitle>
          <CardDescription>Skills that need the most attention</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SKILL_ORDER
              .filter(skillType => {
                const skill = skillsMap.get(skillType);
                return !skill || skill.masteryLevel < 60;
              })
              .slice(0, 3)
              .map(skillType => {
                const config = SKILL_CONFIG[skillType];
                const skill = skillsMap.get(skillType);
                return (
                  <div 
                    key={skillType}
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                  >
                    <div className={`p-2 rounded ${config.color}`}>
                      {config.icon}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{config.label}</h4>
                      <p className="text-xs text-muted-foreground">
                        Current: {skill?.masteryLevel ?? 0}% • {config.strategies[0]}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedSkill(skillType)}
                    >
                      Practice
                    </Button>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ComprehensionSkillsTracker;
