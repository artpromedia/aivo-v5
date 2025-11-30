"use client";

import React from "react";
import { PhonicsProgressionChart, DecodingPracticeLogger } from "@/components/dyslexia";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

// Mock data matching the component interfaces
const MOCK_PHONICS_SKILLS = [
  { 
    id: "1", 
    category: "SINGLE_CONSONANTS" as const, 
    level: 1,
    pattern: "b, c, d, f, g",
    patternName: "Single Consonants", 
    exampleWords: ["cat", "dog", "mat"],
    masteryLevel: "MASTERED" as const, 
    readingAccuracy: 95,
    spellingAccuracy: 90,
    totalExposures: 50,
    ogSequenceNumber: 1
  },
  { 
    id: "2", 
    category: "SHORT_VOWELS" as const, 
    level: 1,
    pattern: "a",
    patternName: "Short A", 
    exampleWords: ["cat", "bat", "hat"],
    masteryLevel: "MASTERED" as const, 
    readingAccuracy: 92,
    spellingAccuracy: 88,
    totalExposures: 45,
    ogSequenceNumber: 2
  },
  { 
    id: "3", 
    category: "SHORT_VOWELS" as const, 
    level: 1,
    pattern: "e",
    patternName: "Short E", 
    exampleWords: ["bed", "red", "pen"],
    masteryLevel: "PROFICIENT" as const, 
    readingAccuracy: 85,
    spellingAccuracy: 80,
    totalExposures: 35,
    ogSequenceNumber: 3
  },
  { 
    id: "4", 
    category: "CONSONANT_DIGRAPHS" as const, 
    level: 2,
    pattern: "ch, sh, th, wh",
    patternName: "Consonant Digraphs", 
    exampleWords: ["chip", "ship", "this"],
    masteryLevel: "DEVELOPING" as const, 
    readingAccuracy: 70,
    spellingAccuracy: 65,
    totalExposures: 20,
    ogSequenceNumber: 4
  },
  { 
    id: "5", 
    category: "CONSONANT_BLENDS" as const, 
    level: 3,
    pattern: "bl, cl, fl, sl",
    patternName: "Initial L-Blends", 
    exampleWords: ["stop", "blue", "trip"],
    masteryLevel: "EMERGING" as const, 
    readingAccuracy: 50,
    spellingAccuracy: 40,
    totalExposures: 10,
    ogSequenceNumber: 5
  },
];

export default function PhonicsPage() {
  const handleSkillClick = (skill: any) => {
    console.log("Skill clicked:", skill);
  };

  const handleSaveSession = async (sessionData: any) => {
    console.log("Saving decoding session:", sessionData);
    // TODO: Implement API call
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="progression">
        <TabsList className="mb-6">
          <TabsTrigger value="progression">Phonics Progression</TabsTrigger>
          <TabsTrigger value="decoding">Decoding Practice</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progression">
          <PhonicsProgressionChart
            skills={MOCK_PHONICS_SKILLS}
            currentLevel={2}
            onSkillClick={handleSkillClick}
          />
        </TabsContent>
        
        <TabsContent value="decoding">
          <DecodingPracticeLogger
            learnerId="sample-learner-id"
            onSave={handleSaveSession}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
