"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Input } from "@/components/ui/Input";
import { 
  Star, 
  CheckCircle2, 
  Eye, 
  BookOpen,
  Sparkles,
  Plus,
  Search
} from "lucide-react";

type SightWordListType = 
  | "DOLCH_PRE_PRIMER"
  | "DOLCH_PRIMER"
  | "DOLCH_FIRST"
  | "DOLCH_SECOND"
  | "DOLCH_THIRD"
  | "FRY_FIRST_100"
  | "FRY_SECOND_100"
  | "FRY_THIRD_100"
  | "HIGH_FREQUENCY_CUSTOM";

type WordStatus = "NOT_INTRODUCED" | "LEARNING" | "RECOGNIZED" | "AUTOMATIC";

interface SightWordProgress {
  totalWordsLearned: number;
  totalWordsAutomatic: number;
  currentList: SightWordListType;
  currentFocusWords: string[];
  dolchProgress?: Record<string, { learned: string[]; automatic: string[] }>;
  fryProgress?: Record<string, { learned: string[]; automatic: string[] }>;
  customWords?: Record<string, { status: WordStatus; introducedAt?: string }>;
}

interface SightWordTrackerProps {
  progress: SightWordProgress;
  onUpdateWord: (word: string, status: WordStatus) => Promise<void>;
  onAddCustomWord: (word: string) => Promise<void>;
  onChangeList: (list: SightWordListType) => Promise<void>;
}

// Dolch sight word lists
const DOLCH_LISTS: Record<string, string[]> = {
  PRE_PRIMER: ["a", "and", "away", "big", "blue", "can", "come", "down", "find", "for", "funny", "go", "help", "here", "I", "in", "is", "it", "jump", "little", "look", "make", "me", "my", "not", "one", "play", "red", "run", "said", "see", "the", "three", "to", "two", "up", "we", "where", "yellow", "you"],
  PRIMER: ["all", "am", "are", "at", "ate", "be", "black", "brown", "but", "came", "did", "do", "eat", "four", "get", "good", "have", "he", "into", "like", "must", "new", "no", "now", "on", "our", "out", "please", "pretty", "ran", "ride", "saw", "say", "she", "so", "soon", "that", "there", "they", "this", "too", "under", "want", "was", "well", "went", "what", "white", "who", "will", "with", "yes"],
  FIRST: ["after", "again", "an", "any", "as", "ask", "by", "could", "every", "fly", "from", "give", "going", "had", "has", "her", "him", "his", "how", "just", "know", "let", "live", "may", "of", "old", "once", "open", "over", "put", "round", "some", "stop", "take", "thank", "them", "then", "think", "walk", "were", "when"],
  SECOND: ["always", "around", "because", "been", "before", "best", "both", "buy", "call", "cold", "does", "don't", "fast", "first", "five", "found", "gave", "goes", "green", "its", "made", "many", "off", "or", "pull", "read", "right", "sing", "sit", "sleep", "tell", "their", "these", "those", "upon", "us", "use", "very", "wash", "which", "why", "wish", "work", "would", "write", "your"],
  THIRD: ["about", "better", "bring", "carry", "clean", "cut", "done", "draw", "drink", "eight", "fall", "far", "full", "got", "grow", "hold", "hot", "hurt", "if", "keep", "kind", "laugh", "light", "long", "much", "myself", "never", "only", "own", "pick", "seven", "shall", "show", "six", "small", "start", "ten", "today", "together", "try", "warm"],
};

const LIST_INFO: Record<SightWordListType, { label: string; description: string; total: number }> = {
  DOLCH_PRE_PRIMER: { label: "Dolch Pre-Primer", description: "40 most basic sight words", total: 40 },
  DOLCH_PRIMER: { label: "Dolch Primer", description: "52 foundational words", total: 52 },
  DOLCH_FIRST: { label: "Dolch First Grade", description: "41 first grade words", total: 41 },
  DOLCH_SECOND: { label: "Dolch Second Grade", description: "46 second grade words", total: 46 },
  DOLCH_THIRD: { label: "Dolch Third Grade", description: "41 third grade words", total: 41 },
  FRY_FIRST_100: { label: "Fry First 100", description: "Most common 100 words", total: 100 },
  FRY_SECOND_100: { label: "Fry Second 100", description: "Words 101-200", total: 100 },
  FRY_THIRD_100: { label: "Fry Third 100", description: "Words 201-300", total: 100 },
  HIGH_FREQUENCY_CUSTOM: { label: "Custom Words", description: "Personalized word list", total: 0 },
};

const STATUS_CONFIG: Record<WordStatus, { color: string; bgColor: string; label: string; icon: React.ReactNode }> = {
  NOT_INTRODUCED: { color: "text-gray-400", bgColor: "bg-gray-100", label: "Not Started", icon: <Eye className="h-4 w-4" /> },
  LEARNING: { color: "text-yellow-600", bgColor: "bg-yellow-100", label: "Learning", icon: <BookOpen className="h-4 w-4" /> },
  RECOGNIZED: { color: "text-blue-600", bgColor: "bg-blue-100", label: "Recognized", icon: <CheckCircle2 className="h-4 w-4" /> },
  AUTOMATIC: { color: "text-green-600", bgColor: "bg-green-100", label: "Automatic", icon: <Sparkles className="h-4 w-4" /> },
};

export function SightWordTracker({ progress, onUpdateWord, onAddCustomWord, onChangeList }: SightWordTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [newCustomWord, setNewCustomWord] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Get current list words
  const getCurrentListWords = (): string[] => {
    const listKey = progress.currentList.replace("DOLCH_", "");
    if (progress.currentList.startsWith("DOLCH_")) {
      return DOLCH_LISTS[listKey] || [];
    }
    // For Fry and custom lists, would need additional data
    return [];
  };

  const currentWords = getCurrentListWords();
  const filteredWords = searchTerm 
    ? currentWords.filter(w => w.toLowerCase().includes(searchTerm.toLowerCase()))
    : currentWords;

  // Get word status from progress
  const getWordStatus = (word: string): WordStatus => {
    const listKey = progress.currentList.replace("DOLCH_", "").toLowerCase();
    
    if (progress.dolchProgress?.[listKey]?.automatic?.includes(word)) {
      return "AUTOMATIC";
    }
    if (progress.dolchProgress?.[listKey]?.learned?.includes(word)) {
      return "RECOGNIZED";
    }
    if (progress.currentFocusWords.includes(word)) {
      return "LEARNING";
    }
    return "NOT_INTRODUCED";
  };

  const handleStatusChange = async (word: string, newStatus: WordStatus) => {
    await onUpdateWord(word, newStatus);
    setSelectedWord(null);
  };

  const handleAddCustomWord = async () => {
    if (newCustomWord.trim()) {
      await onAddCustomWord(newCustomWord.trim().toLowerCase());
      setNewCustomWord("");
    }
  };

  // Calculate stats
  const learnedCount = currentWords.filter(w => {
    const status = getWordStatus(w);
    return status === "RECOGNIZED" || status === "AUTOMATIC";
  }).length;
  
  const automaticCount = currentWords.filter(w => getWordStatus(w) === "AUTOMATIC").length;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Sight Word Progress
          </CardTitle>
          <CardDescription>
            {progress.totalWordsLearned} words learned, {progress.totalWordsAutomatic} automatic
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{progress.totalWordsLearned}</div>
              <div className="text-sm text-gray-500">Total Learned</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{progress.totalWordsAutomatic}</div>
              <div className="text-sm text-gray-500">Automatic</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{progress.currentFocusWords.length}</div>
              <div className="text-sm text-gray-500">Currently Learning</div>
            </div>
            <div className="text-center p-3 bg-theme-primary/10 rounded-lg">
              <div className="text-2xl font-bold text-theme-primary">
                {Math.round((progress.totalWordsAutomatic / Math.max(progress.totalWordsLearned, 1)) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Automaticity Rate</div>
            </div>
          </div>

          {/* Current Focus Words */}
          {progress.currentFocusWords.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
              <div className="font-medium mb-2">Currently Practicing:</div>
              <div className="flex flex-wrap gap-2">
                {progress.currentFocusWords.map(word => (
                  <Badge key={word} className="bg-yellow-500 text-white text-lg px-3 py-1">
                    {word}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Word List Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Word Lists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(LIST_INFO).map(([key, info]) => {
              const isActive = progress.currentList === key;
              return (
                <div
                  key={key}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    isActive
                      ? "border-theme-primary bg-theme-primary/10"
                      : "border-gray-200 hover:border-theme-primary/20"
                  }`}
                  onClick={() => onChangeList(key as SightWordListType)}
                >
                  <div className="font-medium text-sm">{info.label}</div>
                  <div className="text-xs text-gray-500">{info.description}</div>
                  {info.total > 0 && (
                    <div className="text-xs text-theme-primary mt-1">{info.total} words</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current List Progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{LIST_INFO[progress.currentList].label}</CardTitle>
              <CardDescription>
                {learnedCount} of {currentWords.length} words learned ({automaticCount} automatic)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-400" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search words..."
                className="w-40"
              />
            </div>
          </div>
          <Progress 
            value={(learnedCount / Math.max(currentWords.length, 1)) * 100} 
            className="h-2 mt-2" 
          />
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {filteredWords.map(word => {
              const status = getWordStatus(word);
              const config = STATUS_CONFIG[status];
              const isSelected = selectedWord === word;
              
              return (
                <div key={word} className="relative">
                  <div
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${config.bgColor} ${
                      isSelected ? "ring-2 ring-theme-primary" : ""
                    }`}
                    onClick={() => setSelectedWord(isSelected ? null : word)}
                  >
                    <span className={`font-medium ${config.color}`}>{word}</span>
                  </div>
                  
                  {/* Status Change Popup */}
                  {isSelected && (
                    <div className="absolute z-10 mt-1 p-2 bg-white rounded-lg shadow-lg border min-w-[150px]">
                      <div className="text-sm font-medium mb-2">Change status:</div>
                      {Object.entries(STATUS_CONFIG).map(([statusKey, statusConfig]) => (
                        <button
                          key={statusKey}
                          className={`w-full text-left px-2 py-1 rounded flex items-center gap-2 hover:bg-gray-100 ${
                            status === statusKey ? "bg-gray-100" : ""
                          }`}
                          onClick={() => handleStatusChange(word, statusKey as WordStatus)}
                        >
                          <span className={statusConfig.color}>{statusConfig.icon}</span>
                          <span className="text-sm">{statusConfig.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Status Legend */}
          <div className="mt-4 pt-4 border-t flex flex-wrap gap-3">
            {Object.entries(STATUS_CONFIG).map(([status, config]) => (
              <div key={status} className="flex items-center gap-1 text-sm">
                <span className={config.color}>{config.icon}</span>
                <span>{config.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Custom Word */}
      <Card>
        <CardHeader>
          <CardTitle>Add Custom Word</CardTitle>
          <CardDescription>Add personalized sight words for this learner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={newCustomWord}
              onChange={(e) => setNewCustomWord(e.target.value)}
              placeholder="Enter custom word..."
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCustomWord();
                }
              }}
            />
            <Button onClick={handleAddCustomWord} disabled={!newCustomWord.trim()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Word
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SightWordTracker;
