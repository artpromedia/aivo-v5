"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { 
  FileText, 
  TrendingUp, 
  Target,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Download,
  Printer,
  BookOpen,
  Volume2,
  Clock,
  Award,
  ArrowUp,
  ArrowDown,
  Minus
} from "lucide-react";

// Types matching Prisma enums
type DyslexiaSeverity = "MILD" | "MODERATE" | "SEVERE";
type DyslexiaSubtype = "PHONOLOGICAL" | "SURFACE" | "MIXED" | "RAPID_NAMING_DEFICIT" | "DOUBLE_DEFICIT";

interface DyslexiaProfile {
  id: string;
  severity: DyslexiaSeverity;
  subtype: DyslexiaSubtype;
  diagnosisDate?: string;
  interventionStartDate?: string;
}

interface SkillProgress {
  skillName: string;
  category: string;
  currentLevel: number;
  previousLevel: number;
  targetLevel: number;
  trend: "up" | "down" | "stable";
  practiceCount: number;
}

interface FluencyData {
  date: string;
  wcpm: number;
  accuracy: number;
}

interface ProgressReportData {
  profile: DyslexiaProfile;
  reportPeriod: { start: string; end: string };
  phonologicalProgress: SkillProgress[];
  phonicsProgress: SkillProgress[];
  sightWordProgress: { known: number; total: number; newThisPeriod: number };
  fluencyData: FluencyData[];
  comprehensionProgress: SkillProgress[];
  spellingProgress: SkillProgress[];
  lessonsCompleted: number;
  totalPracticeMinutes: number;
  strengths: string[];
  areasForGrowth: string[];
  recommendations: string[];
  parentNotes?: string;
}

interface DyslexiaProgressReportProps {
  studentName: string;
  data: ProgressReportData;
  onExport?: () => void;
  onPrint?: () => void;
}

const SEVERITY_CONFIG: Record<DyslexiaSeverity, { label: string; color: string }> = {
  MILD: { label: "Mild", color: "bg-green-100 text-green-700" },
  MODERATE: { label: "Moderate", color: "bg-yellow-100 text-yellow-700" },
  SEVERE: { label: "Severe", color: "bg-red-100 text-red-700" },
};

const SUBTYPE_CONFIG: Record<DyslexiaSubtype, { label: string; description: string }> = {
  PHONOLOGICAL: { label: "Phonological", description: "Difficulty with sound-symbol relationships" },
  SURFACE: { label: "Surface", description: "Difficulty with irregular word recognition" },
  MIXED: { label: "Mixed", description: "Combined phonological and surface difficulties" },
  RAPID_NAMING_DEFICIT: { label: "Rapid Naming Deficit", description: "Slow automatic retrieval of names" },
  DOUBLE_DEFICIT: { label: "Double Deficit", description: "Both phonological and naming speed deficits" },
};

function TrendIcon({ trend }: { trend: "up" | "down" | "stable" }) {
  if (trend === "up") return <ArrowUp className="h-4 w-4 text-green-600" />;
  if (trend === "down") return <ArrowDown className="h-4 w-4 text-red-600" />;
  return <Minus className="h-4 w-4 text-muted-foreground" />;
}

function getProgressColor(current: number, target: number): string {
  const ratio = current / target;
  if (ratio >= 0.8) return "bg-green-500";
  if (ratio >= 0.6) return "bg-blue-500";
  if (ratio >= 0.4) return "bg-yellow-500";
  return "bg-orange-500";
}

export function DyslexiaProgressReport({
  studentName,
  data,
  onExport,
  onPrint
}: DyslexiaProgressReportProps) {
  const fluencyChange = useMemo(() => {
    if (data.fluencyData.length < 2) return null;
    const latest = data.fluencyData[data.fluencyData.length - 1];
    const earliest = data.fluencyData[0];
    return {
      wcpmChange: latest.wcpm - earliest.wcpm,
      accuracyChange: latest.accuracy - earliest.accuracy
    };
  }, [data.fluencyData]);

  const latestFluency = data.fluencyData[data.fluencyData.length - 1];

  const overallProgress = useMemo(() => {
    const allSkills = [
      ...data.phonologicalProgress,
      ...data.phonicsProgress,
      ...data.comprehensionProgress,
      ...data.spellingProgress
    ];
    if (allSkills.length === 0) return 0;
    const avg = allSkills.reduce((sum, s) => sum + (s.currentLevel / s.targetLevel * 100), 0) / allSkills.length;
    return Math.round(avg);
  }, [data]);

  return (
    <div className="space-y-6 print:space-y-4">
      {/* Header */}
      <Card className="print:shadow-none">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <FileText className="h-6 w-6 text-blue-600" />
                Dyslexia Intervention Progress Report
              </CardTitle>
              <CardDescription className="mt-2">
                <span className="font-semibold text-foreground">{studentName}</span>
                <span className="mx-2">•</span>
                {new Date(data.reportPeriod.start).toLocaleDateString()} - {new Date(data.reportPeriod.end).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="flex gap-2 print:hidden">
              {onExport && (
                <Button variant="outline" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export PDF
                </Button>
              )}
              {onPrint && (
                <Button variant="outline" onClick={onPrint}>
                  <Printer className="h-4 w-4 mr-2" />
                  Print
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Student Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">Severity</div>
              <Badge className={SEVERITY_CONFIG[data.profile.severity].color}>
                {SEVERITY_CONFIG[data.profile.severity].label}
              </Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Subtype</div>
              <Badge variant="outline">{SUBTYPE_CONFIG[data.profile.subtype].label}</Badge>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Intervention Start</div>
              <div className="font-medium">
                {data.profile.interventionStartDate 
                  ? new Date(data.profile.interventionStartDate).toLocaleDateString()
                  : "N/A"
                }
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
              <div className="text-2xl font-bold text-blue-600">{overallProgress}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <BookOpen className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <div className="text-2xl font-bold">{data.lessonsCompleted}</div>
            <div className="text-sm text-muted-foreground">Lessons Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <div className="text-2xl font-bold">{data.totalPracticeMinutes}</div>
            <div className="text-sm text-muted-foreground">Practice Minutes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Award className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
            <div className="text-2xl font-bold">{data.sightWordProgress.known}</div>
            <div className="text-sm text-muted-foreground">Sight Words Mastered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 text-theme-primary" />
            <div className="text-2xl font-bold">{latestFluency?.wcpm || 0}</div>
            <div className="text-sm text-muted-foreground">Current WCPM</div>
          </CardContent>
        </Card>
      </div>

      {/* Fluency Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-orange-600" />
            Fluency Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Words Correct Per Minute (WCPM)</h4>
              <div className="space-y-2">
                {data.fluencyData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <Progress value={Math.min(entry.wcpm, 150) / 1.5} className="flex-1 h-3" />
                    <span className="font-medium w-16 text-right">{entry.wcpm} WCPM</span>
                  </div>
                ))}
              </div>
              {fluencyChange && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {fluencyChange.wcpmChange > 0 ? (
                      <>
                        <ArrowUp className="h-4 w-4 text-green-600" />
                        <span className="text-green-600 font-medium">
                          +{fluencyChange.wcpmChange} WCPM improvement
                        </span>
                      </>
                    ) : fluencyChange.wcpmChange < 0 ? (
                      <>
                        <ArrowDown className="h-4 w-4 text-red-600" />
                        <span className="text-red-600 font-medium">
                          {fluencyChange.wcpmChange} WCPM change
                        </span>
                      </>
                    ) : (
                      <>
                        <Minus className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">No change in WCPM</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-3">Accuracy Rate</h4>
              <div className="space-y-2">
                {data.fluencyData.map((entry, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-24">
                      {new Date(entry.date).toLocaleDateString()}
                    </span>
                    <Progress value={entry.accuracy} className="flex-1 h-3" />
                    <span className="font-medium w-16 text-right">{entry.accuracy}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skill Progress Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Phonological Awareness */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phonological Awareness</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.phonologicalProgress.map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {skill.skillName}
                      <TrendIcon trend={skill.trend} />
                    </span>
                    <span className="font-medium">{skill.currentLevel}%</span>
                  </div>
                  <Progress 
                    value={skill.currentLevel} 
                    className={`h-2 ${getProgressColor(skill.currentLevel, skill.targetLevel)}`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Phonics & Decoding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Phonics & Decoding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.phonicsProgress.map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {skill.skillName}
                      <TrendIcon trend={skill.trend} />
                    </span>
                    <span className="font-medium">{skill.currentLevel}%</span>
                  </div>
                  <Progress 
                    value={skill.currentLevel} 
                    className={`h-2 ${getProgressColor(skill.currentLevel, skill.targetLevel)}`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Comprehension */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Reading Comprehension</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.comprehensionProgress.map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {skill.skillName}
                      <TrendIcon trend={skill.trend} />
                    </span>
                    <span className="font-medium">{skill.currentLevel}%</span>
                  </div>
                  <Progress 
                    value={skill.currentLevel} 
                    className={`h-2 ${getProgressColor(skill.currentLevel, skill.targetLevel)}`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Spelling */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Spelling Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {data.spellingProgress.map((skill, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {skill.skillName}
                      <TrendIcon trend={skill.trend} />
                    </span>
                    <span className="font-medium">{skill.currentLevel}%</span>
                  </div>
                  <Progress 
                    value={skill.currentLevel} 
                    className={`h-2 ${getProgressColor(skill.currentLevel, skill.targetLevel)}`} 
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sight Words */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-green-600" />
            Sight Word Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-3xl font-bold text-green-600">{data.sightWordProgress.known}</div>
              <div className="text-sm text-muted-foreground">Words Mastered</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">+{data.sightWordProgress.newThisPeriod}</div>
              <div className="text-sm text-muted-foreground">New This Period</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-theme-primary">{data.sightWordProgress.total}</div>
              <div className="text-sm text-muted-foreground">Total Target Words</div>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={(data.sightWordProgress.known / data.sightWordProgress.total) * 100} 
              className="h-3" 
            />
            <div className="text-sm text-muted-foreground mt-2 text-center">
              {Math.round((data.sightWordProgress.known / data.sightWordProgress.total) * 100)}% of target sight words mastered
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strengths, Growth Areas, Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.strengths.map((strength, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                  {strength}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Areas for Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.areasForGrowth.map((area, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <AlertCircle className="h-4 w-4 mt-0.5 text-orange-600 flex-shrink-0" />
                  {area}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {data.recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  {rec}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Parent Notes */}
      {data.parentNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notes for Parents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{data.parentNotes}</p>
          </CardContent>
        </Card>
      )}

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Report generated: {new Date().toLocaleDateString()}</span>
            <span>AIVO Dyslexia Intervention System</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default DyslexiaProgressReport;
