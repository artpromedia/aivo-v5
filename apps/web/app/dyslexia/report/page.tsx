"use client";

import React from "react";
import { DyslexiaProgressReport } from "@/components/dyslexia";

// Mock report data
const MOCK_REPORT_DATA = {
  profile: {
    id: "sample-profile-id",
    severity: "MODERATE" as const,
    subtype: "PHONOLOGICAL" as const,
    diagnosisDate: "2024-01-15",
    interventionStartDate: "2024-02-01"
  },
  reportPeriod: {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString()
  },
  phonologicalProgress: [
    { skillName: "Rhyming", category: "PA", currentLevel: 75, previousLevel: 60, targetLevel: 90, trend: "up" as const, practiceCount: 12 },
    { skillName: "Syllable Segmentation", category: "PA", currentLevel: 65, previousLevel: 55, targetLevel: 85, trend: "up" as const, practiceCount: 8 },
    { skillName: "Phoneme Blending", category: "PA", currentLevel: 50, previousLevel: 45, targetLevel: 80, trend: "up" as const, practiceCount: 10 },
  ],
  phonicsProgress: [
    { skillName: "Short Vowels", category: "Phonics", currentLevel: 85, previousLevel: 70, targetLevel: 95, trend: "up" as const, practiceCount: 20 },
    { skillName: "Consonant Digraphs", category: "Phonics", currentLevel: 60, previousLevel: 45, targetLevel: 90, trend: "up" as const, practiceCount: 15 },
    { skillName: "Long Vowels (CVCe)", category: "Phonics", currentLevel: 40, previousLevel: 30, targetLevel: 85, trend: "up" as const, practiceCount: 8 },
  ],
  sightWordProgress: {
    known: 45,
    total: 100,
    newThisPeriod: 12
  },
  fluencyData: [
    { date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), wcpm: 35, accuracy: 85 },
    { date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), wcpm: 40, accuracy: 87 },
    { date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), wcpm: 45, accuracy: 89 },
    { date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), wcpm: 52, accuracy: 92 },
  ],
  comprehensionProgress: [
    { skillName: "Main Idea", category: "Comp", currentLevel: 70, previousLevel: 60, targetLevel: 85, trend: "up" as const, practiceCount: 8 },
    { skillName: "Sequencing", category: "Comp", currentLevel: 55, previousLevel: 50, targetLevel: 80, trend: "stable" as const, practiceCount: 6 },
    { skillName: "Inference", category: "Comp", currentLevel: 35, previousLevel: 30, targetLevel: 75, trend: "up" as const, practiceCount: 4 },
  ],
  spellingProgress: [
    { skillName: "CVC Patterns", category: "Spelling", currentLevel: 80, previousLevel: 70, targetLevel: 95, trend: "up" as const, practiceCount: 15 },
    { skillName: "CVCe Patterns", category: "Spelling", currentLevel: 50, previousLevel: 35, targetLevel: 90, trend: "up" as const, practiceCount: 10 },
    { skillName: "Vowel Teams", category: "Spelling", currentLevel: 25, previousLevel: 20, targetLevel: 85, trend: "up" as const, practiceCount: 5 },
  ],
  lessonsCompleted: 24,
  totalPracticeMinutes: 480,
  strengths: [
    "Strong phonemic awareness in rhyming tasks",
    "Excellent effort and persistence during challenging activities",
    "Good retention of short vowel patterns",
    "Shows strong comprehension of main idea when text is read aloud"
  ],
  areasForGrowth: [
    "Long vowel patterns (CVCe and vowel teams)",
    "Fluency rate - currently below grade level benchmark",
    "Making inferences while reading independently",
    "Spelling of words with vowel teams"
  ],
  recommendations: [
    "Continue daily 15-minute multisensory phonics practice focusing on long vowels",
    "Increase repeated reading practice with decodable texts to build fluency",
    "Use graphic organizers to support comprehension strategy instruction",
    "Implement finger tapping for syllable segmentation during spelling practice",
    "Schedule weekly home practice check-ins with parent"
  ],
  parentNotes: "Your child has made wonderful progress this month! The consistent home practice has been incredibly helpful. Please continue the daily reading routine and sight word practice. Focus on the long vowel patterns this month - especially the 'ai' and 'ay' combinations. Remember to praise effort and celebrate small wins!"
};

export default function ReportPage() {
  const handleExport = () => {
    console.log("Exporting report...");
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="container mx-auto p-6">
      <DyslexiaProgressReport
        studentName="Sample Student"
        data={MOCK_REPORT_DATA}
        onExport={handleExport}
        onPrint={handlePrint}
      />
    </div>
  );
}
