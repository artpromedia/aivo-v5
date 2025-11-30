"use client";

import React from "react";
import { ParentHomePractice } from "@/components/dyslexia";

// Mock weekly plan data
const MOCK_WEEKLY_PLAN = {
  weekOf: new Date().toISOString(),
  activities: [
    {
      id: "1",
      title: "Letter Sound Practice",
      description: "Practice saying the sounds of letters while tracing them",
      type: "phonics" as const,
      duration: 10,
      materials: ["Letter cards", "Sand tray"],
      instructions: ["Show letter card", "Say sound", "Trace in sand"],
      tips: ["Be patient", "Celebrate effort"],
      difficulty: "easy" as const,
      completed: true,
      completedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "2",
      title: "Sight Word Flashcards",
      description: "Practice this week's sight words using flashcards",
      type: "sight_words" as const,
      duration: 5,
      materials: ["Sight word cards"],
      instructions: ["Show each card", "Have child read", "Sort into piles"],
      tips: ["Keep sessions short", "End on a success"],
      difficulty: "medium" as const,
      completed: false
    },
    {
      id: "3",
      title: "Partner Reading",
      description: "Read a decodable book together",
      type: "reading" as const,
      duration: 15,
      materials: ["Decodable reader"],
      instructions: ["Take turns reading", "Point to words", "Discuss story"],
      tips: ["Choose quiet spot", "Be patient with mistakes"],
      difficulty: "medium" as const,
      completed: false
    },
    {
      id: "4",
      title: "Rhyming Game",
      description: "Play a fun rhyming word game",
      type: "game" as const,
      duration: 10,
      materials: ["Rhyming word cards"],
      instructions: ["Say a word", "Find rhyming matches", "Make silly sentences"],
      tips: ["Make it fun", "Accept nonsense rhymes"],
      difficulty: "easy" as const,
      completed: false
    }
  ],
  focusAreas: ["Long A vowel sounds", "Sight words: said, would, could", "Reading fluency"],
  teacherMessage: "Great progress this week! Focus on the long A vowel sounds (ai, ay) during home practice. Remember to use multisensory techniques - see it, say it, trace it!",
  completedCount: 1
};

export default function ParentPage() {
  const handleCompleteActivity = (activityId: string, notes?: string) => {
    console.log("Completing activity:", activityId, notes);
  };

  const handleAddFeedback = (feedback: string) => {
    console.log("Adding feedback:", feedback);
  };

  return (
    <div className="container mx-auto p-6">
      <ParentHomePractice
        profileId="sample-profile-id"
        studentName="Sample Student"
        weeklyPlan={MOCK_WEEKLY_PLAN}
        onCompleteActivity={handleCompleteActivity}
        onAddFeedback={handleAddFeedback}
      />
    </div>
  );
}
