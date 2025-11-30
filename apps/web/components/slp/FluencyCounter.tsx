"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Play, Pause, RotateCcw, Save, 
  Plus, Minus, Timer, Volume2
} from "lucide-react";

interface DisfluencyCount {
  repetitions: number;
  prolongations: number;
  blocks: number;
  interjections: number;
}

interface FluencyCounterProps {
  learnerId: string;
  sessionId?: string;
  taskType?: string;
  taskDescription?: string;
  onSave: (data: FluencySessionData) => Promise<void>;
  isSubmitting?: boolean;
}

interface FluencySessionData {
  learnerId: string;
  slpSessionId?: string;
  taskType: string;
  taskDescription?: string;
  durationSeconds: number;
  totalSyllables?: number;
  totalWords?: number;
  repetitionCount: number;
  prolongationCount: number;
  blockCount: number;
  interjectionCount: number;
  techniquesUsed: string[];
  secondaryBehaviorsObserved: string[];
  situationDifficultyRating?: number;
  selfRating?: number;
  therapistNotes?: string;
  recordedAt: string;
}

const taskTypes = [
  { value: "SPONTANEOUS_SPEECH", label: "Spontaneous Speech" },
  { value: "READING", label: "Reading" },
  { value: "MONOLOGUE", label: "Monologue" },
  { value: "CONVERSATION", label: "Conversation" },
  { value: "PHONE_CALL", label: "Phone Call" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "STRUCTURED_TASK", label: "Structured Task" },
];

const fluencyTechniques = [
  "Easy onset",
  "Light contact",
  "Slow rate",
  "Pausing/Phrasing",
  "Cancellation",
  "Pull-out",
  "Preparatory set",
  "Diaphragmatic breathing",
  "Voluntary stuttering",
];

const secondaryBehaviors = [
  "Eye blinking",
  "Head movements",
  "Jaw tension",
  "Lip pressing",
  "Fist clenching",
  "Foot tapping",
  "Facial grimacing",
  "Body tension",
  "Avoidance behaviors",
];

export function FluencyCounter({
  learnerId,
  sessionId,
  taskType: initialTaskType,
  taskDescription: initialDescription,
  onSave,
  isSubmitting = false,
}: FluencyCounterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [taskType, setTaskType] = useState(initialTaskType || "SPONTANEOUS_SPEECH");
  const [taskDescription, setTaskDescription] = useState(initialDescription || "");
  const [syllableCount, setSyllableCount] = useState<number | undefined>();
  const [wordCount, setWordCount] = useState<number | undefined>();
  
  const [counts, setCounts] = useState<DisfluencyCount>({
    repetitions: 0,
    prolongations: 0,
    blocks: 0,
    interjections: 0,
  });
  
  const [selectedTechniques, setSelectedTechniques] = useState<string[]>([]);
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [difficultyRating, setDifficultyRating] = useState<number>(5);
  const [selfRating, setSelfRating] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleTimer = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setElapsedTime(0);
  }, []);

  const incrementCount = useCallback((type: keyof DisfluencyCount) => {
    setCounts(prev => ({
      ...prev,
      [type]: prev[type] + 1,
    }));
  }, []);

  const decrementCount = useCallback((type: keyof DisfluencyCount) => {
    setCounts(prev => ({
      ...prev,
      [type]: Math.max(0, prev[type] - 1),
    }));
  }, []);

  const resetCounts = useCallback(() => {
    setCounts({
      repetitions: 0,
      prolongations: 0,
      blocks: 0,
      interjections: 0,
    });
  }, []);

  const toggleTechnique = useCallback((technique: string) => {
    setSelectedTechniques(prev =>
      prev.includes(technique)
        ? prev.filter(t => t !== technique)
        : [...prev, technique]
    );
  }, []);

  const toggleBehavior = useCallback((behavior: string) => {
    setSelectedBehaviors(prev =>
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  }, []);

  // Calculate stuttering frequency
  const totalDisfluencies = counts.repetitions + counts.prolongations + counts.blocks + counts.interjections;
  const stutteringFrequency = syllableCount && syllableCount > 0
    ? ((totalDisfluencies / syllableCount) * 100).toFixed(1)
    : null;

  const handleSave = useCallback(async () => {
    const data: FluencySessionData = {
      learnerId,
      slpSessionId: sessionId,
      taskType,
      taskDescription,
      durationSeconds: elapsedTime,
      totalSyllables: syllableCount,
      totalWords: wordCount,
      repetitionCount: counts.repetitions,
      prolongationCount: counts.prolongations,
      blockCount: counts.blocks,
      interjectionCount: counts.interjections,
      techniquesUsed: selectedTechniques,
      secondaryBehaviorsObserved: selectedBehaviors,
      situationDifficultyRating: difficultyRating,
      selfRating,
      therapistNotes: notes,
      recordedAt: new Date().toISOString(),
    };
    
    await onSave(data);
  }, [
    learnerId, sessionId, taskType, taskDescription, elapsedTime,
    syllableCount, wordCount, counts, selectedTechniques, selectedBehaviors,
    difficultyRating, selfRating, notes, onSave
  ]);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-blue-500" />
              Fluency Session Counter
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Track disfluencies in real-time during speech tasks
            </p>
          </div>
          <Badge variant="outline" className="text-lg font-mono">
            {formatTime(elapsedTime)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Timer Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={toggleTimer}
            className={`p-4 rounded-full ${
              isRunning 
                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' 
                : 'bg-green-100 text-green-700 hover:bg-green-200'
            } transition-colors`}
          >
            {isRunning ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8" />}
          </button>
          <button
            onClick={resetTimer}
            className="p-4 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
          >
            <RotateCcw className="h-8 w-8" />
          </button>
        </div>

        {/* Task Selection */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Task Type
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {taskTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={difficultyRating}
              onChange={(e) => setDifficultyRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm text-gray-600">{difficultyRating}/10</div>
          </div>
        </div>

        {/* Disfluency Counters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { key: "repetitions", label: "Repetitions", color: "blue" },
            { key: "prolongations", label: "Prolongations", color: "green" },
            { key: "blocks", label: "Blocks", color: "red" },
            { key: "interjections", label: "Interjections", color: "purple" },
          ].map(({ key, label, color }) => (
            <div
              key={key}
              className={`p-4 rounded-xl border-2 border-${color}-200 bg-${color}-50`}
            >
              <div className="text-center mb-2">
                <div className={`text-3xl font-bold text-${color}-600`}>
                  {counts[key as keyof DisfluencyCount]}
                </div>
                <div className="text-xs text-gray-600">{label}</div>
              </div>
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => decrementCount(key as keyof DisfluencyCount)}
                  className="p-1 rounded bg-white border hover:bg-gray-50"
                  disabled={counts[key as keyof DisfluencyCount] === 0}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => incrementCount(key as keyof DisfluencyCount)}
                  className={`p-2 rounded-lg bg-${color}-500 text-white hover:bg-${color}-600`}
                >
                  <Plus className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Syllable/Word Count */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Syllables (for % SS calculation)
            </label>
            <input
              type="number"
              value={syllableCount || ""}
              onChange={(e) => setSyllableCount(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter syllable count"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Words (optional)
            </label>
            <input
              type="number"
              value={wordCount || ""}
              onChange={(e) => setWordCount(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Enter word count"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Calculated Frequency */}
        {stutteringFrequency && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
            <div className="text-sm text-blue-600 mb-1">Stuttering Frequency</div>
            <div className="text-3xl font-bold text-blue-700">{stutteringFrequency}% SS</div>
            <div className="text-xs text-blue-500 mt-1">
              ({totalDisfluencies} disfluencies / {syllableCount} syllables)
            </div>
          </div>
        )}

        {/* Techniques Used */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Fluency Techniques Used
          </label>
          <div className="flex flex-wrap gap-2">
            {fluencyTechniques.map((technique) => (
              <button
                key={technique}
                onClick={() => toggleTechnique(technique)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedTechniques.includes(technique)
                    ? "bg-green-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {technique}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Behaviors */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Secondary Behaviors Observed
          </label>
          <div className="flex flex-wrap gap-2">
            {secondaryBehaviors.map((behavior) => (
              <button
                key={behavior}
                onClick={() => toggleBehavior(behavior)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedBehaviors.includes(behavior)
                    ? "bg-orange-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {behavior}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Therapist Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add session notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={resetCounts}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Reset Counts
          </button>
          <button
            onClick={handleSave}
            disabled={elapsedTime === 0 || isSubmitting}
            className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? "Saving..." : "Save Session"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
