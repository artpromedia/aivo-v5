"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { 
  Clock, 
  BookOpen, 
  Mic, 
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Save
} from "lucide-react";

interface FluencyAssessmentData {
  passageTitle: string;
  passageLevel: string;
  passageWordCount: number;
  wordsCorrectPerMinute: number;
  totalWordsRead: number;
  errorsCount: number;
  accuracy: number;
  readingTimeSeconds: number;
  expressionScore?: number;
  phrasingScore?: number;
  smoothnessScore?: number;
  paceScore?: number;
  prosodyTotal?: number;
  comprehensionQuestions?: number;
  comprehensionCorrect?: number;
  comprehensionPercent?: number;
  substitutions: number;
  omissions: number;
  insertions: number;
  selfCorrections: number;
  teacherNotes?: string;
  areasForImprovement: string[];
}

interface FluencyAssessmentFormProps {
  learnerId: string;
  onSave: (data: FluencyAssessmentData) => Promise<void>;
}

const PASSAGE_LEVELS = [
  "Pre-Primer", "Primer", "Grade 1", "Grade 2", "Grade 3", 
  "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8"
];

const PROSODY_DESCRIPTIONS = {
  expression: [
    "Reads with little expression",
    "Reads with some expression",
    "Reads with good expression",
    "Reads with excellent, varied expression"
  ],
  phrasing: [
    "Word-by-word reading",
    "Some two-word phrases",
    "Three to four word phrases",
    "Longer, meaningful phrases"
  ],
  smoothness: [
    "Frequent extended pauses",
    "Several rough spots",
    "Occasional breaks",
    "Generally smooth"
  ],
  pace: [
    "Slow and laborious",
    "Moderately slow",
    "Uneven mixture of fast and slow",
    "Consistently conversational"
  ]
};

export function FluencyAssessmentForm({ learnerId, onSave }: FluencyAssessmentFormProps) {
  const [formData, setFormData] = useState<Partial<FluencyAssessmentData>>({
    passageTitle: "",
    passageLevel: "Grade 2",
    passageWordCount: 0,
    totalWordsRead: 0,
    errorsCount: 0,
    readingTimeSeconds: 60,
    substitutions: 0,
    omissions: 0,
    insertions: 0,
    selfCorrections: 0,
    areasForImprovement: [],
  });
  const [saving, setSaving] = useState(false);
  const [newArea, setNewArea] = useState("");

  // Calculate WCPM and accuracy
  const correctWords = (formData.totalWordsRead || 0) - (formData.errorsCount || 0);
  const wcpm = formData.readingTimeSeconds 
    ? Math.round((correctWords / formData.readingTimeSeconds) * 60) 
    : 0;
  const accuracy = formData.totalWordsRead 
    ? Math.round((correctWords / formData.totalWordsRead) * 100) 
    : 0;
  const prosodyTotal = (formData.expressionScore || 0) + (formData.phrasingScore || 0) + 
    (formData.smoothnessScore || 0) + (formData.paceScore || 0);
  const comprehensionPercent = formData.comprehensionQuestions 
    ? Math.round(((formData.comprehensionCorrect || 0) / formData.comprehensionQuestions) * 100)
    : undefined;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...formData as FluencyAssessmentData,
        wordsCorrectPerMinute: wcpm,
        accuracy,
        prosodyTotal: prosodyTotal || undefined,
        comprehensionPercent,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddArea = () => {
    if (newArea.trim() && !formData.areasForImprovement?.includes(newArea.trim())) {
      setFormData({
        ...formData,
        areasForImprovement: [...(formData.areasForImprovement || []), newArea.trim()]
      });
      setNewArea("");
    }
  };

  // WCPM benchmarks by grade
  const getWCPMBenchmark = (level: string): { min: number; target: number } => {
    const benchmarks: Record<string, { min: number; target: number }> = {
      "Grade 1": { min: 30, target: 60 },
      "Grade 2": { min: 50, target: 90 },
      "Grade 3": { min: 70, target: 110 },
      "Grade 4": { min: 90, target: 120 },
      "Grade 5": { min: 100, target: 130 },
      "Grade 6": { min: 110, target: 140 },
    };
    return benchmarks[level] || { min: 50, target: 100 };
  };

  const benchmark = getWCPMBenchmark(formData.passageLevel || "Grade 2");

  return (
    <div className="space-y-6">
      {/* Passage Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Passage Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Passage Title</label>
              <Input
                value={formData.passageTitle}
                onChange={(e) => setFormData({ ...formData, passageTitle: e.target.value })}
                placeholder="Enter passage title..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reading Level</label>
              <Select 
                value={formData.passageLevel}
                onValueChange={(value) => setFormData({ ...formData, passageLevel: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {PASSAGE_LEVELS.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Word Count in Passage</label>
              <Input
                type="number"
                value={formData.passageWordCount || ""}
                onChange={(e) => setFormData({ ...formData, passageWordCount: parseInt(e.target.value) || 0 })}
                placeholder="Total words in passage"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reading Time (seconds)</label>
              <Input
                type="number"
                value={formData.readingTimeSeconds || ""}
                onChange={(e) => setFormData({ ...formData, readingTimeSeconds: parseInt(e.target.value) || 60 })}
                placeholder="60"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fluency Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-green-500" />
            Fluency Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Total Words Read</label>
              <Input
                type="number"
                value={formData.totalWordsRead || ""}
                onChange={(e) => setFormData({ ...formData, totalWordsRead: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Total Errors</label>
              <Input
                type="number"
                value={formData.errorsCount || ""}
                onChange={(e) => setFormData({ ...formData, errorsCount: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Self-Corrections</label>
              <Input
                type="number"
                value={formData.selfCorrections || ""}
                onChange={(e) => setFormData({ ...formData, selfCorrections: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>

          {/* Calculated Results */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                wcpm >= benchmark.target ? "text-green-600" :
                wcpm >= benchmark.min ? "text-yellow-600" : "text-red-600"
              }`}>
                {wcpm}
              </div>
              <div className="text-sm text-gray-500">WCPM</div>
              <div className="text-xs text-gray-400">Target: {benchmark.target}</div>
            </div>
            <div className="text-center">
              <div className={`text-3xl font-bold ${
                accuracy >= 97 ? "text-green-600" :
                accuracy >= 90 ? "text-yellow-600" : "text-red-600"
              }`}>
                {accuracy}%
              </div>
              <div className="text-sm text-gray-500">Accuracy</div>
              <div className="text-xs text-gray-400">Target: 97%+</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{correctWords}</div>
              <div className="text-sm text-gray-500">Words Correct</div>
            </div>
          </div>

          {/* Error Breakdown */}
          <div>
            <label className="block text-sm font-medium mb-2">Error Breakdown</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Substitutions</label>
                <Input
                  type="number"
                  value={formData.substitutions || ""}
                  onChange={(e) => setFormData({ ...formData, substitutions: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Omissions</label>
                <Input
                  type="number"
                  value={formData.omissions || ""}
                  onChange={(e) => setFormData({ ...formData, omissions: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Insertions</label>
                <Input
                  type="number"
                  value={formData.insertions || ""}
                  onChange={(e) => setFormData({ ...formData, insertions: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prosody Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-purple-500" />
            Prosody Assessment (1-4 Scale)
          </CardTitle>
          <CardDescription>
            Rate each aspect of oral reading fluency
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Expression */}
          <div>
            <label className="block text-sm font-medium mb-2">Expression & Volume</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(score => (
                <div
                  key={score}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                    formData.expressionScore === score
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onClick={() => setFormData({ ...formData, expressionScore: score })}
                >
                  <div className="text-xl font-bold">{score}</div>
                  <div className="text-xs text-gray-500">{PROSODY_DESCRIPTIONS.expression[score - 1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Phrasing */}
          <div>
            <label className="block text-sm font-medium mb-2">Phrasing</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(score => (
                <div
                  key={score}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                    formData.phrasingScore === score
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onClick={() => setFormData({ ...formData, phrasingScore: score })}
                >
                  <div className="text-xl font-bold">{score}</div>
                  <div className="text-xs text-gray-500">{PROSODY_DESCRIPTIONS.phrasing[score - 1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Smoothness */}
          <div>
            <label className="block text-sm font-medium mb-2">Smoothness</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(score => (
                <div
                  key={score}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                    formData.smoothnessScore === score
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onClick={() => setFormData({ ...formData, smoothnessScore: score })}
                >
                  <div className="text-xl font-bold">{score}</div>
                  <div className="text-xs text-gray-500">{PROSODY_DESCRIPTIONS.smoothness[score - 1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div>
            <label className="block text-sm font-medium mb-2">Pace</label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map(score => (
                <div
                  key={score}
                  className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                    formData.paceScore === score
                      ? "border-purple-500 bg-purple-50"
                      : "border-gray-200 hover:border-purple-200"
                  }`}
                  onClick={() => setFormData({ ...formData, paceScore: score })}
                >
                  <div className="text-xl font-bold">{score}</div>
                  <div className="text-xs text-gray-500">{PROSODY_DESCRIPTIONS.pace[score - 1]}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Prosody Total */}
          {prosodyTotal > 0 && (
            <div className="p-4 bg-purple-50 rounded-lg text-center">
              <div className="text-3xl font-bold text-purple-600">{prosodyTotal}/16</div>
              <div className="text-sm text-gray-500">Prosody Total Score</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comprehension Check */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Comprehension Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Questions Asked</label>
              <Input
                type="number"
                value={formData.comprehensionQuestions || ""}
                onChange={(e) => setFormData({ ...formData, comprehensionQuestions: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Questions Correct</label>
              <Input
                type="number"
                value={formData.comprehensionCorrect || ""}
                onChange={(e) => setFormData({ ...formData, comprehensionCorrect: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          {comprehensionPercent !== undefined && (
            <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
              <div className="text-2xl font-bold text-green-600">{comprehensionPercent}%</div>
              <div className="text-sm text-gray-500">Comprehension Score</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes & Improvement Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Notes & Areas for Improvement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teacher Notes</label>
            <Textarea
              value={formData.teacherNotes || ""}
              onChange={(e) => setFormData({ ...formData, teacherNotes: e.target.value })}
              placeholder="Observations, strategies to try, student response..."
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Areas for Improvement</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newArea}
                onChange={(e) => setNewArea(e.target.value)}
                placeholder="Add improvement area..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddArea();
                  }
                }}
              />
              <Button onClick={handleAddArea} variant="outline">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.areasForImprovement?.map((area, index) => (
                <Badge key={index} variant="outline">
                  {area}
                  <button 
                    className="ml-1"
                    onClick={() => setFormData({
                      ...formData,
                      areasForImprovement: formData.areasForImprovement?.filter((_, i) => i !== index)
                    })}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={saving || !formData.passageTitle || !formData.totalWordsRead}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Assessment"}
        </Button>
      </div>
    </div>
  );
}

export default FluencyAssessmentForm;
