"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, Plus, CheckCircle2, XCircle, 
  Mic, Volume2, ChevronRight, RotateCcw,
  Clock
} from "lucide-react";

// Types
interface ArticulationTarget {
  id: string;
  phoneme: string;
  position: "INITIAL" | "MEDIAL" | "FINAL" | "BLENDS" | "ALL_POSITIONS";
  currentLevel: string;
  exemplarWords: string[];
  currentAccuracy: number;
  goalAccuracy: number;
}

interface TrialEntry {
  stimulusWord: string;
  isCorrect: boolean;
  errorType?: string;
  promptLevel: string;
  responseTimeMs?: number;
}

interface ArticulationTrialCollectorProps {
  learnerId: string;
  target: ArticulationTarget;
  sessionId?: string;
  onSaveTrials: (trials: TrialData[]) => Promise<void>;
  isSubmitting?: boolean;
}

interface TrialData {
  learnerId: string;
  targetId: string;
  sessionId?: string;
  phoneme: string;
  position: string;
  stimulusWord: string;
  level: string;
  isCorrect: boolean;
  errorType?: string;
  promptLevel: string;
  responseTimeMs?: number;
  recordedAt: string;
}

const positionLabels: Record<string, string> = {
  INITIAL: "Initial Position",
  MEDIAL: "Medial Position",
  FINAL: "Final Position",
  BLENDS: "Blends",
  ALL_POSITIONS: "All Positions",
};

const errorTypes = [
  { value: "SUBSTITUTION", label: "Substitution", description: "Different sound used" },
  { value: "OMISSION", label: "Omission", description: "Sound left out" },
  { value: "DISTORTION", label: "Distortion", description: "Sound altered" },
  { value: "ADDITION", label: "Addition", description: "Extra sound added" },
];

const promptLevels = [
  { value: "INDEPENDENT", label: "Independent", color: "bg-green-100 text-green-800" },
  { value: "VISUAL_CUE", label: "Visual Cue", color: "bg-blue-100 text-blue-800" },
  { value: "VERBAL_CUE", label: "Verbal Cue", color: "bg-yellow-100 text-yellow-800" },
  { value: "MODEL", label: "Model", color: "bg-orange-100 text-orange-800" },
  { value: "TACTILE_CUE", label: "Tactile Cue", color: "bg-purple-100 text-purple-800" },
  { value: "FULL_MODEL", label: "Full Model", color: "bg-red-100 text-red-800" },
];

const levelLabels: Record<string, string> = {
  ISOLATION: "Isolation",
  SYLLABLE: "Syllable",
  WORD: "Word",
  PHRASE: "Phrase",
  SENTENCE: "Sentence",
  READING: "Reading",
  CONVERSATION: "Conversation",
};

export function ArticulationTrialCollector({
  learnerId,
  target,
  sessionId,
  onSaveTrials,
  isSubmitting = false,
}: ArticulationTrialCollectorProps) {
  const [trials, setTrials] = useState<TrialEntry[]>([]);
  const [currentWord, setCurrentWord] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentPromptLevel, setCurrentPromptLevel] = useState("INDEPENDENT");
  const [trialStartTime, setTrialStartTime] = useState<number | null>(null);
  const [showErrorSelect, setShowErrorSelect] = useState(false);
  const [selectedErrorType, setSelectedErrorType] = useState<string | undefined>();

  // Use exemplar words from target or allow custom words
  const wordList = target.exemplarWords.length > 0 
    ? target.exemplarWords 
    : ["cat", "cup", "car", "cake", "come"]; // Default words for /k/ sound

  const currentTrialWord = currentWord || wordList[currentWordIndex] || "";

  const startTrial = useCallback(() => {
    setTrialStartTime(Date.now());
    setShowErrorSelect(false);
    setSelectedErrorType(undefined);
  }, []);

  const recordTrial = useCallback((isCorrect: boolean, errorType?: string) => {
    const responseTime = trialStartTime ? Date.now() - trialStartTime : undefined;
    
    const trial: TrialEntry = {
      stimulusWord: currentTrialWord,
      isCorrect,
      errorType: isCorrect ? undefined : errorType,
      promptLevel: currentPromptLevel,
      responseTimeMs: responseTime,
    };
    
    setTrials(prev => [...prev, trial]);
    setTrialStartTime(null);
    setShowErrorSelect(false);
    setSelectedErrorType(undefined);
    
    // Move to next word
    if (currentWordIndex < wordList.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
      setCurrentWord("");
    }
  }, [currentTrialWord, currentPromptLevel, trialStartTime, currentWordIndex, wordList.length]);

  const handleCorrect = useCallback(() => {
    recordTrial(true);
  }, [recordTrial]);

  const handleIncorrect = useCallback(() => {
    setShowErrorSelect(true);
  }, []);

  const handleErrorSelect = useCallback((errorType: string) => {
    recordTrial(false, errorType);
  }, [recordTrial]);

  const undoLastTrial = useCallback(() => {
    if (trials.length > 0) {
      setTrials(prev => prev.slice(0, -1));
      if (currentWordIndex > 0) {
        setCurrentWordIndex(prev => prev - 1);
      }
    }
  }, [trials.length, currentWordIndex]);

  const resetTrials = useCallback(() => {
    setTrials([]);
    setCurrentWordIndex(0);
    setCurrentWord("");
    setTrialStartTime(null);
    setShowErrorSelect(false);
  }, []);

  const handleSave = useCallback(async () => {
    const trialData: TrialData[] = trials.map(trial => ({
      learnerId,
      targetId: target.id,
      sessionId,
      phoneme: target.phoneme,
      position: target.position,
      stimulusWord: trial.stimulusWord,
      level: target.currentLevel,
      isCorrect: trial.isCorrect,
      errorType: trial.errorType,
      promptLevel: trial.promptLevel,
      responseTimeMs: trial.responseTimeMs,
      recordedAt: new Date().toISOString(),
    }));
    
    await onSaveTrials(trialData);
    resetTrials();
  }, [trials, learnerId, target, sessionId, onSaveTrials, resetTrials]);

  // Calculate current session accuracy
  const correctTrials = trials.filter(t => t.isCorrect).length;
  const totalTrials = trials.length;
  const sessionAccuracy = totalTrials > 0 
    ? Math.round((correctTrials / totalTrials) * 100) 
    : 0;

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Mic className="h-5 w-5 text-purple-500" />
              Articulation Trial Collection
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Target: /{target.phoneme}/ - {positionLabels[target.position]}
            </p>
          </div>
          <Badge variant="outline" className="text-lg">
            {levelLabels[target.currentLevel] || target.currentLevel}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Session Progress */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{correctTrials}</div>
            <div className="text-xs text-gray-500">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{totalTrials - correctTrials}</div>
            <div className="text-xs text-gray-500">Incorrect</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{totalTrials}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${sessionAccuracy >= target.goalAccuracy ? 'text-green-600' : 'text-blue-600'}`}>
              {sessionAccuracy}%
            </div>
            <div className="text-xs text-gray-500">Accuracy</div>
          </div>
        </div>

        {/* Current Word Display */}
        <div className="text-center py-6 bg-white border-2 border-dashed border-gray-200 rounded-xl">
          <div className="text-4xl font-bold text-gray-800 mb-2">
            {currentTrialWord}
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Volume2 className="h-4 w-4" />
            <span className="text-sm">Word {currentWordIndex + 1} of {wordList.length}</span>
          </div>
        </div>

        {/* Custom Word Input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={currentWord}
            onChange={(e) => setCurrentWord(e.target.value)}
            placeholder="Or enter custom word..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Prompt Level Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Prompt Level
          </label>
          <div className="flex flex-wrap gap-2">
            {promptLevels.map((level) => (
              <button
                key={level.value}
                onClick={() => setCurrentPromptLevel(level.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                  currentPromptLevel === level.value
                    ? level.color + " ring-2 ring-offset-2 ring-purple-500"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Trial Recording Buttons */}
        {!showErrorSelect ? (
          <div className="flex gap-4">
            {trialStartTime === null ? (
              <button
                onClick={startTrial}
                className="flex-1 py-4 bg-purple-600 text-white rounded-xl font-semibold text-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
              >
                <Clock className="h-5 w-5" />
                Start Trial
              </button>
            ) : (
              <>
                <button
                  onClick={handleCorrect}
                  className="flex-1 py-4 bg-green-600 text-white rounded-xl font-semibold text-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  Correct
                </button>
                <button
                  onClick={handleIncorrect}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-semibold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="h-6 w-6" />
                  Incorrect
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Select Error Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {errorTypes.map((error) => (
                <button
                  key={error.value}
                  onClick={() => handleErrorSelect(error.value)}
                  className="p-3 border-2 border-gray-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all text-left"
                >
                  <div className="font-medium text-gray-800">{error.label}</div>
                  <div className="text-xs text-gray-500">{error.description}</div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowErrorSelect(false)}
              className="w-full py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Trial History */}
        {trials.length > 0 && (
          <div className="border rounded-lg">
            <div className="px-4 py-2 bg-gray-50 border-b flex items-center justify-between">
              <span className="font-medium text-sm text-gray-700">Trial History</span>
              <button
                onClick={undoLastTrial}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" />
                Undo Last
              </button>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {trials.slice().reverse().map((trial, idx) => (
                <div
                  key={trials.length - 1 - idx}
                  className="px-4 py-2 border-b last:border-b-0 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {trial.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className="font-medium">{trial.stimulusWord}</span>
                    {trial.errorType && (
                      <Badge variant="outline" className="text-xs">
                        {trial.errorType}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{trial.promptLevel.replace(/_/g, " ")}</span>
                    {trial.responseTimeMs && (
                      <span className="text-xs">({(trial.responseTimeMs / 1000).toFixed(1)}s)</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={resetTrials}
            disabled={trials.length === 0}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Reset All
          </button>
          <button
            onClick={handleSave}
            disabled={trials.length === 0 || isSubmitting}
            className="flex-1 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? "Saving..." : `Save ${trials.length} Trials`}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
