"use client";

import React from "react";
import { SpellingPatternTracker } from "@/components/dyslexia";

// Mock data
const MOCK_PATTERNS = [
  { id: "1", pattern: "CVC", category: "Short Vowels", examples: ["cat", "bed", "pig"], masteryLevel: 85, errorCount: 3, correctCount: 22 },
  { id: "2", pattern: "CVCe", category: "Long Vowels", examples: ["make", "bike", "home"], masteryLevel: 60, errorCount: 8, correctCount: 12 },
  { id: "3", pattern: "ch", category: "Consonant Digraphs", examples: ["chip", "lunch", "match"], masteryLevel: 45, errorCount: 6, correctCount: 5 },
  { id: "4", pattern: "ai", category: "Vowel Teams", examples: ["rain", "paid", "tail"], masteryLevel: 30, errorCount: 7, correctCount: 3 },
];

export default function SpellingPage() {
  const handleUpdatePattern = (patternId: string, updates: any) => {
    console.log("Updating spelling pattern:", patternId, updates);
  };

  const handleAddPattern = (pattern: any) => {
    console.log("Adding pattern:", pattern);
  };

  const handleLogPractice = (patternId: string, correct: boolean, word: string) => {
    console.log("Logging practice:", patternId, correct, word);
  };

  return (
    <div className="container mx-auto p-6">
      <SpellingPatternTracker
        profileId="sample-profile-id"
        patterns={MOCK_PATTERNS}
        onUpdatePattern={handleUpdatePattern}
        onAddPattern={handleAddPattern}
        onLogPractice={handleLogPractice}
      />
    </div>
  );
}
