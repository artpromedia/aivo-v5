"use client";

import React from "react";
import { ComprehensionSkillsTracker } from "@/components/dyslexia";

// Mock data
const MOCK_SKILLS = [
  { id: "1", skillType: "MAIN_IDEA" as const, masteryLevel: 70, practiceCount: 15, lastPracticed: new Date().toISOString(), strategies: [] },
  { id: "2", skillType: "SUPPORTING_DETAILS" as const, masteryLevel: 65, practiceCount: 12, lastPracticed: new Date().toISOString(), strategies: [] },
  { id: "3", skillType: "SEQUENCING" as const, masteryLevel: 55, practiceCount: 8, lastPracticed: new Date().toISOString(), strategies: [] },
  { id: "4", skillType: "CAUSE_EFFECT" as const, masteryLevel: 40, practiceCount: 5, lastPracticed: new Date().toISOString(), strategies: [] },
  { id: "5", skillType: "INFERENCE" as const, masteryLevel: 35, practiceCount: 4, lastPracticed: new Date().toISOString(), strategies: [] },
];

export default function ComprehensionPage() {
  const handleUpdateSkill = (skillId: string, updates: any) => {
    console.log("Updating comprehension skill:", skillId, updates);
  };

  const handleAddPractice = (skillType: string, notes?: string) => {
    console.log("Adding practice:", skillType, notes);
  };

  return (
    <div className="container mx-auto p-6">
      <ComprehensionSkillsTracker
        profileId="sample-profile-id"
        skills={MOCK_SKILLS}
        onUpdateSkill={handleUpdateSkill}
        onAddPractice={handleAddPractice}
      />
    </div>
  );
}
