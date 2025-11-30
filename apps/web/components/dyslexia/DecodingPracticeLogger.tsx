"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { 
  Plus, 
  Check, 
  X, 
  RotateCcw, 
  Clock,
  AlertCircle,
  Save
} from "lucide-react";

type ErrorType = "SUBSTITUTION" | "OMISSION" | "INSERTION" | "REVERSAL" | "MISPRONUNCIATION" | "SELF_CORRECTION" | "HESITATION" | "REPETITION";

interface WordAttempt {
  word: string;
  correct: boolean;
  errors: ErrorType[];
  timeMs?: number;
}

interface DecodingSessionData {
  wordListType: string;
  wordsAttempted: WordAttempt[];
  durationMinutes: number;
  teacherNotes?: string;
  focusForNext: string[];
}

interface DecodingPracticeLoggerProps {
  learnerId: string;
  onSave: (data: DecodingSessionData) => Promise<void>;
}

const ERROR_TYPES: { value: ErrorType; label: string; description: string }[] = [
  { value: "SUBSTITUTION", label: "Substitution", description: "Replaced one letter/sound with another" },
  { value: "OMISSION", label: "Omission", description: "Left out a letter/sound" },
  { value: "INSERTION", label: "Insertion", description: "Added an extra letter/sound" },
  { value: "REVERSAL", label: "Reversal", description: "Reversed letters (b/d, was/saw)" },
  { value: "MISPRONUNCIATION", label: "Mispronunciation", description: "Incorrect pronunciation" },
  { value: "SELF_CORRECTION", label: "Self-Correction", description: "Corrected own error" },
  { value: "HESITATION", label: "Hesitation", description: "Long pause before reading" },
  { value: "REPETITION", label: "Repetition", description: "Repeated word/phrase" },
];

const WORD_LIST_TYPES = [
  "CVC Words",
  "CVCE Words",
  "Consonant Blends",
  "Consonant Digraphs",
  "Vowel Teams",
  "R-Controlled Vowels",
  "Multisyllabic",
  "Mixed Review",
  "Custom List",
];

export function DecodingPracticeLogger({ learnerId, onSave }: DecodingPracticeLoggerProps) {
  const [wordListType, setWordListType] = useState("CVC Words");
  const [currentWord, setCurrentWord] = useState("");
  const [wordsAttempted, setWordsAttempted] = useState<WordAttempt[]>([]);
  const [selectedErrors, setSelectedErrors] = useState<ErrorType[]>([]);
  const [sessionStart] = useState(new Date());
  const [teacherNotes, setTeacherNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [newFocusArea, setNewFocusArea] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAddWord = (isCorrect: boolean) => {
    if (!currentWord.trim()) return;
    
    const attempt: WordAttempt = {
      word: currentWord.trim().toLowerCase(),
      correct: isCorrect,
      errors: isCorrect ? [] : selectedErrors,
      timeMs: undefined,
    };
    
    setWordsAttempted([...wordsAttempted, attempt]);
    setCurrentWord("");
    setSelectedErrors([]);
  };

  const handleToggleError = (error: ErrorType) => {
    setSelectedErrors(prev => 
      prev.includes(error) 
        ? prev.filter(e => e !== error)
        : [...prev, error]
    );
  };

  const handleRemoveWord = (index: number) => {
    setWordsAttempted(prev => prev.filter((_, i) => i !== index));
  };

  const handleAddFocusArea = () => {
    if (newFocusArea.trim() && !focusAreas.includes(newFocusArea.trim())) {
      setFocusAreas([...focusAreas, newFocusArea.trim()]);
      setNewFocusArea("");
    }
  };

  const handleSave = async () => {
    if (wordsAttempted.length === 0) return;
    
    setSaving(true);
    const durationMinutes = Math.round((new Date().getTime() - sessionStart.getTime()) / 60000);
    
    try {
      await onSave({
        wordListType,
        wordsAttempted,
        durationMinutes,
        teacherNotes: teacherNotes || undefined,
        focusForNext: focusAreas,
      });
    } finally {
      setSaving(false);
    }
  };

  // Calculate stats
  const correctCount = wordsAttempted.filter(w => w.correct).length;
  const totalCount = wordsAttempted.length;
  const accuracy = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0;
  
  // Error breakdown
  const errorCounts = wordsAttempted.reduce((acc, word) => {
    word.errors.forEach(error => {
      acc[error] = (acc[error] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Session Setup */}
      <Card>
        <CardHeader>
          <CardTitle>Decoding Practice Session</CardTitle>
          <CardDescription>
            Log word-by-word reading attempts and track error patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2">Word List Type</label>
              <Select value={wordListType} onValueChange={setWordListType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select word list type" />
                </SelectTrigger>
                <SelectContent>
                  {WORD_LIST_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Session Duration</div>
              <div className="flex items-center gap-1 text-lg font-medium">
                <Clock className="h-4 w-4" />
                {Math.round((new Date().getTime() - sessionStart.getTime()) / 60000)} min
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Word Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Record Word Attempt</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Word</label>
            <Input
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              placeholder="Enter word being read..."
              className="text-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentWord) {
                  handleAddWord(true);
                }
              }}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Error Types (if incorrect)</label>
            <div className="flex flex-wrap gap-2">
              {ERROR_TYPES.map(error => (
                <Badge
                  key={error.value}
                  variant={selectedErrors.includes(error.value) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleToggleError(error.value)}
                  title={error.description}
                >
                  {error.label}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              onClick={() => handleAddWord(true)} 
              disabled={!currentWord}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <Check className="h-4 w-4 mr-2" />
              Correct
            </Button>
            <Button 
              onClick={() => handleAddWord(false)} 
              disabled={!currentWord}
              variant="destructive"
              className="flex-1"
            >
              <X className="h-4 w-4 mr-2" />
              Incorrect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Live Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-blue-600">{totalCount}</div>
            <div className="text-sm text-gray-500">Words Attempted</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="text-3xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-gray-500">Correct</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className={`text-3xl font-bold ${accuracy >= 80 ? "text-green-600" : accuracy >= 60 ? "text-yellow-600" : "text-red-600"}`}>
              {accuracy}%
            </div>
            <div className="text-sm text-gray-500">Accuracy</div>
          </CardContent>
        </Card>
      </div>

      {/* Words List */}
      {wordsAttempted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Words Attempted ({wordsAttempted.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {wordsAttempted.map((attempt, index) => (
                <div
                  key={index}
                  className={`group px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                    attempt.correct 
                      ? "bg-green-100 text-green-800" 
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  <span className="font-medium">{attempt.word}</span>
                  {!attempt.correct && attempt.errors.length > 0 && (
                    <span className="text-xs opacity-70">
                      ({attempt.errors.map(e => e.charAt(0)).join(",")})
                    </span>
                  )}
                  <button
                    onClick={() => handleRemoveWord(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Analysis */}
      {Object.keys(errorCounts).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Error Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(errorCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([error, count]) => {
                  const errorInfo = ERROR_TYPES.find(e => e.value === error);
                  return (
                    <div key={error} className="p-3 bg-orange-50 rounded-lg">
                      <div className="font-medium">{errorInfo?.label || error}</div>
                      <div className="text-2xl font-bold text-orange-600">{count}</div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teacher Notes & Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle>Session Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Teacher Notes</label>
            <Textarea
              value={teacherNotes}
              onChange={(e) => setTeacherNotes(e.target.value)}
              placeholder="Observations, strategies used, student response..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Focus Areas for Next Session</label>
            <div className="flex gap-2 mb-2">
              <Input
                value={newFocusArea}
                onChange={(e) => setNewFocusArea(e.target.value)}
                placeholder="Add focus area..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFocusArea();
                  }
                }}
              />
              <Button onClick={handleAddFocusArea} variant="outline">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {focusAreas.map((area, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {area}
                  <button onClick={() => setFocusAreas(focusAreas.filter((_, i) => i !== index))}>
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button 
          variant="outline" 
          onClick={() => {
            setWordsAttempted([]);
            setTeacherNotes("");
            setFocusAreas([]);
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Session
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving || wordsAttempted.length === 0}
          size="lg"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Session"}
        </Button>
      </div>
    </div>
  );
}

export default DecodingPracticeLogger;
