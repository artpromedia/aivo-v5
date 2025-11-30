"use client";

import React from "react";
import { MultisensoryActivityLibrary } from "@/components/dyslexia";

export default function ActivitiesPage() {
  const handleSelectActivity = (activity: any) => {
    console.log("Selected activity:", activity);
  };

  const handleLogUsage = (activityId: string, rating?: number) => {
    console.log("Logging activity usage:", activityId, rating);
  };

  return (
    <div className="container mx-auto p-6">
      <MultisensoryActivityLibrary
        onSelectActivity={handleSelectActivity}
        onLogUsage={handleLogUsage}
      />
    </div>
  );
}
