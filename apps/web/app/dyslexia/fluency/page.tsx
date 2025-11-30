"use client";

import React from "react";
import { FluencyAssessmentForm, FluencyProgressChart } from "@/components/dyslexia";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";

// Mock data matching the component interfaces
const MOCK_ASSESSMENTS = [
  { 
    id: "1", 
    assessmentDate: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString(), 
    wordsCorrectPerMinute: 35, 
    accuracy: 85, 
    prosodyTotal: 8,
    passageTitle: "The Little Red Hen",
    passageLevel: "Grade 1"
  },
  { 
    id: "2", 
    assessmentDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), 
    wordsCorrectPerMinute: 40, 
    accuracy: 88, 
    prosodyTotal: 9,
    passageTitle: "The Three Little Pigs",
    passageLevel: "Grade 1"
  },
  { 
    id: "3", 
    assessmentDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), 
    wordsCorrectPerMinute: 45, 
    accuracy: 90, 
    prosodyTotal: 10,
    passageTitle: "Jack and the Beanstalk",
    passageLevel: "Grade 1"
  },
  { 
    id: "4", 
    assessmentDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), 
    wordsCorrectPerMinute: 52, 
    accuracy: 92, 
    prosodyTotal: 11,
    passageTitle: "Goldilocks",
    passageLevel: "Grade 2"
  },
];

export default function FluencyPage() {
  const handleSaveAssessment = async (assessmentData: any) => {
    console.log("Saving assessment:", assessmentData);
    // TODO: Implement API call
  };

  return (
    <div className="container mx-auto p-6">
      <Tabs defaultValue="progress">
        <TabsList className="mb-6">
          <TabsTrigger value="progress">Progress Chart</TabsTrigger>
          <TabsTrigger value="assess">New Assessment</TabsTrigger>
        </TabsList>
        
        <TabsContent value="progress">
          <FluencyProgressChart
            assessments={MOCK_ASSESSMENTS}
            targetWCPM={60}
          />
        </TabsContent>
        
        <TabsContent value="assess">
          <FluencyAssessmentForm
            learnerId="sample-learner-id"
            onSave={handleSaveAssessment}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
