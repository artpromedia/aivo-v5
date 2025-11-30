"use client";

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { 
  PenTool, 
  CheckCircle2, 
  AlertCircle,
  TrendingUp,
  Plus,
  Save,
  Search,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface SpellingPattern {
  id: string;
  pattern: string;
  category: string;
  examples: string[];
  masteryLevel: number;
  errorCount: number;
  correctCount: number;
  lastPracticed?: string;
  notes?: string;
}

interface SpellingPatternTrackerProps {
  profileId: string;
  patterns: SpellingPattern[];
  onUpdatePattern: (patternId: string, updates: Partial<SpellingPattern>) => void;
  onAddPattern: (pattern: Omit<SpellingPattern, "id">) => void;
  onLogPractice: (patternId: string, correct: boolean, word: string) => void;
}

// Orton-Gillingham spelling pattern categories
const PATTERN_CATEGORIES = [
  {
    category: "Short Vowels",
    patterns: [
      { pattern: "CVC", examples: ["cat", "bed", "pig", "hot", "cup"], description: "Consonant-Vowel-Consonant" },
      { pattern: "CVCC", examples: ["fast", "jump", "milk", "desk"], description: "Closed syllable with blend" },
      { pattern: "CCVC", examples: ["stop", "trip", "clap", "swim"], description: "Initial blend" },
    ]
  },
  {
    category: "Long Vowels",
    patterns: [
      { pattern: "CVCe", examples: ["make", "bike", "home", "cute"], description: "Silent E pattern" },
      { pattern: "CVVC (ai)", examples: ["rain", "paid", "tail", "wait"], description: "Vowel team AI" },
      { pattern: "CVVC (ea)", examples: ["read", "team", "beach", "dream"], description: "Vowel team EA" },
      { pattern: "CVVC (oa)", examples: ["boat", "road", "coat", "soap"], description: "Vowel team OA" },
      { pattern: "CVVC (ee)", examples: ["feet", "tree", "sleep", "green"], description: "Vowel team EE" },
    ]
  },
  {
    category: "R-Controlled Vowels",
    patterns: [
      { pattern: "ar", examples: ["car", "star", "farm", "park"], description: "AR sound" },
      { pattern: "or", examples: ["for", "corn", "storm", "short"], description: "OR sound" },
      { pattern: "er/ir/ur", examples: ["her", "bird", "turn", "nurse"], description: "Schwa-R sound" },
    ]
  },
  {
    category: "Consonant Digraphs",
    patterns: [
      { pattern: "ch", examples: ["chip", "lunch", "match", "children"], description: "CH digraph" },
      { pattern: "sh", examples: ["ship", "fish", "wish", "shell"], description: "SH digraph" },
      { pattern: "th", examples: ["this", "that", "with", "bath"], description: "TH digraph" },
      { pattern: "wh", examples: ["what", "when", "white", "wheel"], description: "WH digraph" },
      { pattern: "ck", examples: ["back", "kick", "duck", "trick"], description: "CK ending" },
    ]
  },
  {
    category: "Consonant Blends",
    patterns: [
      { pattern: "bl/cl/fl", examples: ["black", "clap", "flag"], description: "L-blends" },
      { pattern: "br/cr/dr/fr/gr/pr/tr", examples: ["bring", "drop", "train"], description: "R-blends" },
      { pattern: "sc/sk/sm/sn/sp/st/sw", examples: ["skip", "stop", "swim"], description: "S-blends" },
      { pattern: "-nd/-nt/-nk", examples: ["and", "went", "pink"], description: "N-ending blends" },
    ]
  },
  {
    category: "Vowel Diphthongs",
    patterns: [
      { pattern: "oi/oy", examples: ["oil", "boy", "coin", "toy"], description: "OI/OY sound" },
      { pattern: "ou/ow", examples: ["out", "how", "loud", "town"], description: "OU/OW sound" },
      { pattern: "aw/au", examples: ["saw", "cause", "draw", "taught"], description: "AW/AU sound" },
    ]
  },
  {
    category: "Suffixes",
    patterns: [
      { pattern: "-ed", examples: ["jumped", "played", "wanted"], description: "Past tense ending" },
      { pattern: "-ing", examples: ["jumping", "playing", "running"], description: "Present participle" },
      { pattern: "-s/-es", examples: ["cats", "boxes", "wishes"], description: "Plural/3rd person" },
      { pattern: "-ly", examples: ["quickly", "slowly", "happily"], description: "Adverb ending" },
    ]
  },
  {
    category: "Silent Letters",
    patterns: [
      { pattern: "kn", examples: ["know", "knee", "knife", "knock"], description: "Silent K" },
      { pattern: "wr", examples: ["write", "wrong", "wrap", "wrist"], description: "Silent W" },
      { pattern: "gn", examples: ["gnat", "gnaw", "sign", "design"], description: "Silent G" },
      { pattern: "mb", examples: ["climb", "lamb", "comb", "thumb"], description: "Silent B" },
    ]
  }
];

function getMasteryColor(level: number): string {
  if (level >= 80) return "bg-green-500";
  if (level >= 60) return "bg-blue-500";
  if (level >= 40) return "bg-yellow-500";
  if (level >= 20) return "bg-orange-500";
  return "bg-red-500";
}

function getMasteryBadge(level: number): { label: string; variant: "default" | "outline" | "destructive" } {
  if (level >= 80) return { label: "Mastered", variant: "default" };
  if (level >= 60) return { label: "Proficient", variant: "outline" };
  if (level >= 40) return { label: "Developing", variant: "outline" };
  return { label: "Needs Practice", variant: "destructive" };
}

export function SpellingPatternTracker({
  profileId,
  patterns,
  onUpdatePattern,
  onAddPattern,
  onLogPractice
}: SpellingPatternTrackerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["Short Vowels"]));
  const [practiceMode, setPracticeMode] = useState<{ patternId: string; word: string } | null>(null);
  const [practiceWord, setPracticeWord] = useState("");

  const patternsMap = useMemo(() => {
    const map = new Map<string, SpellingPattern>();
    patterns.forEach(p => map.set(p.pattern, p));
    return map;
  }, [patterns]);

  const overallProgress = useMemo(() => {
    const allPatterns = PATTERN_CATEGORIES.flatMap(cat => cat.patterns);
    const totalMastery = allPatterns.reduce((sum, p) => {
      const tracked = patternsMap.get(p.pattern);
      return sum + (tracked?.masteryLevel ?? 0);
    }, 0);
    return Math.round(totalMastery / allPatterns.length);
  }, [patternsMap]);

  const filteredCategories = useMemo(() => {
    if (!searchTerm && !selectedCategory) return PATTERN_CATEGORIES;
    
    return PATTERN_CATEGORIES.filter(cat => {
      if (selectedCategory && cat.category !== selectedCategory) return false;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return cat.category.toLowerCase().includes(term) ||
          cat.patterns.some(p => 
            p.pattern.toLowerCase().includes(term) ||
            p.examples.some(ex => ex.toLowerCase().includes(term))
          );
      }
      return true;
    }).map(cat => ({
      ...cat,
      patterns: searchTerm 
        ? cat.patterns.filter(p =>
            p.pattern.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.examples.some(ex => ex.toLowerCase().includes(searchTerm.toLowerCase()))
          )
        : cat.patterns
    })).filter(cat => cat.patterns.length > 0);
  }, [searchTerm, selectedCategory]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const handleLogPractice = (patternId: string, correct: boolean) => {
    if (practiceWord.trim()) {
      onLogPractice(patternId, correct, practiceWord.trim());
      setPracticeWord("");
      setPracticeMode(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5 text-purple-600" />
            Spelling Pattern Mastery
          </CardTitle>
          <CardDescription>
            Track mastery of phonetic spelling patterns using Orton-Gillingham methodology
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span>Overall Pattern Mastery</span>
              <span className="font-semibold">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-3" />
            <div className="grid grid-cols-4 gap-4 mt-4">
              {PATTERN_CATEGORIES.slice(0, 4).map(cat => {
                const catProgress = Math.round(
                  cat.patterns.reduce((sum, p) => sum + (patternsMap.get(p.pattern)?.masteryLevel ?? 0), 0) / cat.patterns.length
                );
                return (
                  <div key={cat.category} className="text-center">
                    <div className="text-2xl font-bold">{catProgress}%</div>
                    <div className="text-xs text-muted-foreground">{cat.category}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patterns or words..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={selectedCategory ? "default" : "outline"}
            onClick={() => setSelectedCategory(null)}
            size="sm"
          >
            <Filter className="h-4 w-4 mr-2" />
            All
          </Button>
        </div>
      </div>

      {/* Pattern Categories */}
      <div className="space-y-4">
        {filteredCategories.map((category) => (
          <Card key={category.category}>
            <div 
              className="cursor-pointer p-6"
              onClick={() => toggleCategory(category.category)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{category.category}</h3>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {category.patterns.length} patterns
                  </Badge>
                  {expandedCategories.has(category.category) 
                    ? <ChevronUp className="h-5 w-5" />
                    : <ChevronDown className="h-5 w-5" />
                  }
                </div>
              </div>
            </div>
            
            {expandedCategories.has(category.category) && (
              <CardContent>
                <div className="space-y-3">
                  {category.patterns.map((pattern) => {
                    const tracked = patternsMap.get(pattern.pattern);
                    const mastery = tracked?.masteryLevel ?? 0;
                    const masteryBadge = getMasteryBadge(mastery);

                    return (
                      <div
                        key={pattern.pattern}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-lg">{pattern.pattern}</span>
                              <Badge variant={masteryBadge.variant}>
                                {masteryBadge.label}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{pattern.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold">{mastery}%</div>
                            {tracked && (
                              <div className="text-xs text-muted-foreground">
                                {tracked.correctCount}/{tracked.correctCount + tracked.errorCount} correct
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mb-3">
                          <Progress value={mastery} className="h-2" />
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          {pattern.examples.map((example) => (
                            <span
                              key={example}
                              className="px-2 py-1 bg-muted rounded text-sm font-mono"
                            >
                              {example}
                            </span>
                          ))}
                        </div>

                        {practiceMode?.patternId === pattern.pattern ? (
                          <div className="flex gap-2 mt-3">
                            <Input
                              placeholder="Enter word to practice..."
                              value={practiceWord}
                              onChange={(e) => setPracticeWord(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleLogPractice(pattern.pattern, true)}
                            >
                              <CheckCircle2 className="h-4 w-4 mr-1" />
                              Correct
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleLogPractice(pattern.pattern, false)}
                            >
                              <AlertCircle className="h-4 w-4 mr-1" />
                              Error
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setPracticeMode(null);
                                setPracticeWord("");
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPracticeMode({ patternId: pattern.pattern, word: "" })}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Log Practice
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {/* Patterns Needing Attention */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Patterns Needing Focus
          </CardTitle>
          <CardDescription>
            Patterns with mastery below 60% that need more practice
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {PATTERN_CATEGORIES.flatMap(cat => cat.patterns)
              .filter(p => {
                const tracked = patternsMap.get(p.pattern);
                return !tracked || tracked.masteryLevel < 60;
              })
              .slice(0, 6)
              .map(pattern => {
                const tracked = patternsMap.get(pattern.pattern);
                return (
                  <div
                    key={pattern.pattern}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div>
                      <span className="font-mono font-semibold">{pattern.pattern}</span>
                      <span className="text-xs text-muted-foreground ml-2">{pattern.description}</span>
                    </div>
                    <Badge variant="destructive">{tracked?.masteryLevel ?? 0}%</Badge>
                  </div>
                );
              })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SpellingPatternTracker;
