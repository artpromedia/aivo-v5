"use client";

import React from "react";
import { SightWordTracker } from "@/components/dyslexia";

// Mock data
const MOCK_SIGHT_WORDS = [
  { id: "1", word: "the", listType: "DOLCH_PREPRIMER" as const, status: "MASTERED" as const, exposureCount: 25, correctCount: 24 },
  { id: "2", word: "and", listType: "DOLCH_PREPRIMER" as const, status: "MASTERED" as const, exposureCount: 20, correctCount: 19 },
  { id: "3", word: "said", listType: "DOLCH_PRIMER" as const, status: "LEARNING" as const, exposureCount: 10, correctCount: 6 },
  { id: "4", word: "would", listType: "DOLCH_FIRST" as const, status: "INTRODUCED" as const, exposureCount: 3, correctCount: 1 },
];

export default function SightWordsPage() {
  const handleUpdateWord = (wordId: string, updates: any) => {
    console.log("Updating sight word:", wordId, updates);
  };

  const handleAddPractice = (wordId: string, correct: boolean) => {
    console.log("Adding practice:", wordId, correct);
  };

  return (
    <div className="container mx-auto p-6">
      <SightWordTracker
        profileId="sample-profile-id"
        words={MOCK_SIGHT_WORDS}
        onUpdateWord={handleUpdateWord}
        onAddPractice={handleAddPractice}
      />
    </div>
  );
}
