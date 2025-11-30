"use client";

import React from "react";
import { DyslexiaProfileSetup } from "@/components/dyslexia";

export default function DyslexiaProfilePage() {
  const handleSaveProfile = (profileData: any) => {
    console.log("Saving profile:", profileData);
    // TODO: Implement API call to save profile
  };

  return (
    <div className="container mx-auto p-6">
      <DyslexiaProfileSetup 
        onSave={handleSaveProfile}
      />
    </div>
  );
}
