"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Brain, Eye, Ear, Hand, Sparkles } from "lucide-react";

type DyslexiaSeverity = "MILD" | "MODERATE" | "SEVERE" | "PROFOUND";
type DyslexiaSubtype = "PHONOLOGICAL" | "SURFACE" | "MIXED" | "RAPID_NAMING" | "DOUBLE_DEFICIT";
type SensoryModality = "VISUAL" | "AUDITORY" | "KINESTHETIC" | "TACTILE" | "VISUAL_AUDITORY" | "VISUAL_KINESTHETIC" | "AUDITORY_KINESTHETIC" | "MULTISENSORY_VAKT";

interface DyslexiaProfileData {
  severity: DyslexiaSeverity;
  subtypes: DyslexiaSubtype[];
  diagnosisDate?: string;
  diagnosingProfessional?: string;
  diagnosisNotes?: string;
  currentReadingLevel?: string;
  gradeEquivalent?: number;
  lexileLevel?: number;
  targetReadingLevel?: string;
  interventionProgram: string;
  currentPhonicsLevel: number;
  sessionsPerWeek: number;
  sessionDurationMinutes: number;
  preferredModalities: SensoryModality[];
  assistiveTechnology: string[];
}

interface DyslexiaProfileSetupProps {
  learnerId: string;
  existingProfile?: DyslexiaProfileData;
  onSave: (data: DyslexiaProfileData) => Promise<void>;
}

const SEVERITY_OPTIONS: { value: DyslexiaSeverity; label: string; description: string }[] = [
  { value: "MILD", label: "Mild", description: "Minor reading difficulties, responds well to intervention" },
  { value: "MODERATE", label: "Moderate", description: "Significant reading challenges, requires structured support" },
  { value: "SEVERE", label: "Severe", description: "Major reading difficulties, needs intensive intervention" },
  { value: "PROFOUND", label: "Profound", description: "Extensive reading challenges, requires comprehensive support" },
];

const SUBTYPE_OPTIONS: { value: DyslexiaSubtype; label: string; description: string }[] = [
  { value: "PHONOLOGICAL", label: "Phonological", description: "Difficulty with sound-symbol relationships" },
  { value: "SURFACE", label: "Surface", description: "Difficulty with whole word recognition" },
  { value: "MIXED", label: "Mixed", description: "Combination of phonological and surface" },
  { value: "RAPID_NAMING", label: "Rapid Naming Deficit", description: "Slow retrieval of verbal labels" },
  { value: "DOUBLE_DEFICIT", label: "Double Deficit", description: "Both phonological and rapid naming challenges" },
];

const MODALITY_OPTIONS: { value: SensoryModality; label: string; icon: React.ReactNode }[] = [
  { value: "VISUAL", label: "Visual", icon: <Eye className="h-4 w-4" /> },
  { value: "AUDITORY", label: "Auditory", icon: <Ear className="h-4 w-4" /> },
  { value: "KINESTHETIC", label: "Kinesthetic", icon: <Hand className="h-4 w-4" /> },
  { value: "TACTILE", label: "Tactile", icon: <Hand className="h-4 w-4" /> },
  { value: "VISUAL_AUDITORY", label: "Visual + Auditory", icon: <><Eye className="h-4 w-4" /><Ear className="h-4 w-4" /></> },
  { value: "VISUAL_KINESTHETIC", label: "Visual + Kinesthetic", icon: <><Eye className="h-4 w-4" /><Hand className="h-4 w-4" /></> },
  { value: "AUDITORY_KINESTHETIC", label: "Auditory + Kinesthetic", icon: <><Ear className="h-4 w-4" /><Hand className="h-4 w-4" /></> },
  { value: "MULTISENSORY_VAKT", label: "Multisensory (VAKT)", icon: <Sparkles className="h-4 w-4" /> },
];

const ASSISTIVE_TECH_OPTIONS = [
  "Text-to-Speech Software",
  "Speech-to-Text Software",
  "Audiobooks",
  "Reading Pen/Scanner",
  "Colored Overlays",
  "Dyslexia-Friendly Font",
  "Word Prediction Software",
  "Mind Mapping Tools",
  "Digital Note-Taking",
  "Screen Reader",
];

export function DyslexiaProfileSetup({ learnerId, existingProfile, onSave }: DyslexiaProfileSetupProps) {
  const [formData, setFormData] = useState<DyslexiaProfileData>(existingProfile || {
    severity: "MODERATE",
    subtypes: [],
    interventionProgram: "Orton-Gillingham",
    currentPhonicsLevel: 1,
    sessionsPerWeek: 3,
    sessionDurationMinutes: 45,
    preferredModalities: [],
    assistiveTechnology: [],
  });
  const [saving, setSaving] = useState(false);

  const handleSubtypeToggle = (subtype: DyslexiaSubtype) => {
    setFormData(prev => ({
      ...prev,
      subtypes: prev.subtypes.includes(subtype)
        ? prev.subtypes.filter(s => s !== subtype)
        : [...prev.subtypes, subtype]
    }));
  };

  const handleModalityToggle = (modality: SensoryModality) => {
    setFormData(prev => ({
      ...prev,
      preferredModalities: prev.preferredModalities.includes(modality)
        ? prev.preferredModalities.filter(m => m !== modality)
        : [...prev.preferredModalities, modality]
    }));
  };

  const handleAssistiveTechToggle = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      assistiveTechnology: prev.assistiveTechnology.includes(tech)
        ? prev.assistiveTechnology.filter(t => t !== tech)
        : [...prev.assistiveTechnology, tech]
    }));
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Diagnosis Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-theme-primary" />
            Diagnosis Information
          </CardTitle>
          <CardDescription>
            Enter diagnostic details for the learner&apos;s dyslexia profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Severity Level</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {SEVERITY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.severity === option.value
                      ? "border-theme-primary bg-theme-primary/10"
                      : "border-gray-200 hover:border-theme-primary/20"
                  }`}
                  onClick={() => setFormData({ ...formData, severity: option.value })}
                >
                  <div className="font-medium">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Dyslexia Subtypes</label>
            <div className="space-y-2">
              {SUBTYPE_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    formData.subtypes.includes(option.value)
                      ? "border-theme-primary bg-theme-primary/10"
                      : "border-gray-200 hover:border-theme-primary/20"
                  }`}
                  onClick={() => handleSubtypeToggle(option.value)}
                >
                  <Checkbox
                    checked={formData.subtypes.includes(option.value)}
                    onCheckedChange={() => handleSubtypeToggle(option.value)}
                  />
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Diagnosis Date</label>
              <Input
                type="date"
                value={formData.diagnosisDate || ""}
                onChange={(e) => setFormData({ ...formData, diagnosisDate: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Diagnosing Professional</label>
              <Input
                placeholder="e.g., Dr. Smith, Educational Psychologist"
                value={formData.diagnosingProfessional || ""}
                onChange={(e) => setFormData({ ...formData, diagnosingProfessional: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Diagnosis Notes</label>
            <Textarea
              placeholder="Additional notes from the diagnostic evaluation..."
              value={formData.diagnosisNotes || ""}
              onChange={(e) => setFormData({ ...formData, diagnosisNotes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Reading Levels */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            Reading Levels
          </CardTitle>
          <CardDescription>
            Current and target reading levels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Current Reading Level</label>
              <Input
                placeholder="e.g., 2.3, Beginning 1st"
                value={formData.currentReadingLevel || ""}
                onChange={(e) => setFormData({ ...formData, currentReadingLevel: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Grade Equivalent</label>
              <Input
                type="number"
                step="0.1"
                placeholder="e.g., 2.3"
                value={formData.gradeEquivalent || ""}
                onChange={(e) => setFormData({ ...formData, gradeEquivalent: parseFloat(e.target.value) })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Lexile Level</label>
              <Input
                type="number"
                placeholder="e.g., 450"
                value={formData.lexileLevel || ""}
                onChange={(e) => setFormData({ ...formData, lexileLevel: parseInt(e.target.value) })}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Target Reading Level</label>
            <Input
              placeholder="e.g., Grade level, 3.0"
              value={formData.targetReadingLevel || ""}
              onChange={(e) => setFormData({ ...formData, targetReadingLevel: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Intervention Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Intervention Settings</CardTitle>
          <CardDescription>
            Configure the structured literacy intervention program
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Intervention Program</label>
              <Select
                value={formData.interventionProgram}
                onValueChange={(value) => setFormData({ ...formData, interventionProgram: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select program" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Orton-Gillingham">Orton-Gillingham</SelectItem>
                  <SelectItem value="Wilson Reading">Wilson Reading System</SelectItem>
                  <SelectItem value="Barton Reading">Barton Reading & Spelling</SelectItem>
                  <SelectItem value="Lindamood-Bell">Lindamood-Bell</SelectItem>
                  <SelectItem value="SPIRE">S.P.I.R.E.</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Current Phonics Level (1-12)</label>
              <Select
                value={formData.currentPhonicsLevel.toString()}
                onValueChange={(value) => setFormData({ ...formData, currentPhonicsLevel: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((level) => (
                    <SelectItem key={level} value={level.toString()}>
                      Level {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Sessions Per Week</label>
              <Select
                value={formData.sessionsPerWeek.toString()}
                onValueChange={(value) => setFormData({ ...formData, sessionsPerWeek: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} session{num > 1 ? "s" : ""} per week
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Session Duration (minutes)</label>
              <Select
                value={formData.sessionDurationMinutes.toString()}
                onValueChange={(value) => setFormData({ ...formData, sessionDurationMinutes: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  {[30, 45, 60, 90].map((mins) => (
                    <SelectItem key={mins} value={mins.toString()}>
                      {mins} minutes
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Learning Preferences</CardTitle>
          <CardDescription>
            Select preferred learning modalities for multisensory instruction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Preferred Modalities</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {MODALITY_OPTIONS.map((option) => (
                <div
                  key={option.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                    formData.preferredModalities.includes(option.value)
                      ? "border-theme-primary bg-theme-primary/10"
                      : "border-gray-200 hover:border-theme-primary/20"
                  }`}
                  onClick={() => handleModalityToggle(option.value)}
                >
                  {option.icon}
                  <span className="text-sm font-medium">{option.label}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assistive Technology */}
      <Card>
        <CardHeader>
          <CardTitle>Assistive Technology</CardTitle>
          <CardDescription>
            Select tools and accommodations the learner uses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {ASSISTIVE_TECH_OPTIONS.map((tech) => (
              <Badge
                key={tech}
                variant={formData.assistiveTechnology.includes(tech) ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => handleAssistiveTechToggle(tech)}
              >
                {tech}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSubmit} disabled={saving} size="lg">
          {saving ? "Saving..." : existingProfile ? "Update Profile" : "Create Profile"}
        </Button>
      </div>
    </div>
  );
}

export default DyslexiaProfileSetup;
