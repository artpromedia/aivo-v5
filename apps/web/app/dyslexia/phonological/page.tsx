"use client";

import React from "react";
import { PhonologicalSkillsMatrix } from "@/components/dyslexia";

// Mock data
const MOCK_SKILLS = [
  { id: "1", skillType: "RHYMING" as const, masteryLevel: 75, practiceCount: 12 },
  { id: "2", skillType: "SYLLABLE_SEGMENTATION" as const, masteryLevel: 60, practiceCount: 8 },
  { id: "3", skillType: "ONSET_RIME" as const, masteryLevel: 45, practiceCount: 5 },
  { id: "4", skillType: "PHONEME_ISOLATION" as const, masteryLevel: 55, practiceCount: 7 },
  { id: "5", skillType: "PHONEME_BLENDING" as const, masteryLevel: 40, practiceCount: 6 },
  { id: "6", skillType: "PHONEME_SEGMENTATION" as const, masteryLevel: 35, practiceCount: 4 },
];

export default function PhonologicalAwarenessPage() {
  const handleUpdateSkill = (skillId: string, updates: any) => {
    console.log("Updating skill:", skillId, updates);
    // TODO: Implement API call
  };

  const handleAddPractice = (skillType: string, correct: number, total: number) => {
    console.log("Adding practice:", skillType, correct, total);
    // TODO: Implement API call
  };

  return (
    <div className="container mx-auto p-6">
      <PhonologicalSkillsMatrix
        profileId="sample-profile-id"
        skills={MOCK_SKILLS}
        onUpdateSkill={handleUpdateSkill}
        onAddPractice={handleAddPractice}
      />
    </div>
  );
}
