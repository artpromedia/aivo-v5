"use client";

import React from "react";
import { LessonPlanTemplate } from "@/components/dyslexia";

export default function LessonsPage() {
  const handleSaveLesson = (lesson: any) => {
    console.log("Saving lesson:", lesson);
  };

  const handleExportLesson = (lesson: any) => {
    console.log("Exporting lesson:", lesson);
  };

  return (
    <div className="container mx-auto p-6">
      <LessonPlanTemplate
        profileId="sample-profile-id"
        onSave={handleSaveLesson}
        onExport={handleExportLesson}
      />
    </div>
  );
}
