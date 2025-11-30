"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}>
    {children}
  </label>
);
import { 
  User, 
  MessageSquare, 
  Users, 
  Clock, 
  Star, 
  AlertTriangle,
  Heart,
  Save,
  Plus,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CommunicationStyle = "VERBAL" | "MINIMAL_VERBAL" | "NON_VERBAL" | "AAC_USER";
export type SocialInteractionLevel = "VERY_LIMITED" | "LIMITED" | "EMERGING" | "DEVELOPING" | "AGE_APPROPRIATE";
export type ChangeFlexibility = "VERY_RIGID" | "RIGID" | "MODERATELY_FLEXIBLE" | "FLEXIBLE" | "VERY_FLEXIBLE";

export interface SpecialInterest {
  topic: string;
  intensity: number;
  canUseForRewards: boolean;
  notes?: string;
}

export interface AutismProfile {
  id: string;
  learnerId: string;
  diagnosisDate?: string;
  diagnosedBy?: string;
  supportLevel?: number;
  assessmentNotes?: string;
  communicationStyle: CommunicationStyle;
  expressiveLanguage?: number;
  receptiveLanguage?: number;
  usesAAC: boolean;
  aacSystemType?: string;
  communicationStrengths: string[];
  communicationChallenges: string[];
  socialInteractionLevel: SocialInteractionLevel;
  jointAttention?: number;
  peerInteraction?: number;
  adultInteraction?: number;
  socialStrengths: string[];
  socialChallenges: string[];
  changeFlexibility: ChangeFlexibility;
  needsVisualSchedule: boolean;
  needsTransitionWarnings: boolean;
  preferredWarningTime: number;
  specialInterests: SpecialInterest[];
  commonTriggers: string[];
  calmingStrategies: string[];
  reinforcers: string[];
  needsSocialStories: boolean;
  needsTokenSystem: boolean;
  tokenGoalSize?: number;
  parentNotes?: string;
  teacherNotes?: string;
  therapistNotes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AutismProfileSetupProps {
  learnerId: string;
  initialProfile?: Partial<AutismProfile>;
  onSave: (profile: Partial<AutismProfile>) => Promise<void>;
  className?: string;
}

const communicationStyleOptions: { value: CommunicationStyle; label: string; description: string }[] = [
  { value: "VERBAL", label: "Verbal", description: "Uses spoken language as primary communication" },
  { value: "MINIMAL_VERBAL", label: "Minimal Verbal", description: "Limited spoken language, may use some words/phrases" },
  { value: "NON_VERBAL", label: "Non-Verbal", description: "Does not use spoken language" },
  { value: "AAC_USER", label: "AAC User", description: "Uses augmentative/alternative communication device" },
];

const socialLevelOptions: { value: SocialInteractionLevel; label: string }[] = [
  { value: "VERY_LIMITED", label: "Very Limited" },
  { value: "LIMITED", label: "Limited" },
  { value: "EMERGING", label: "Emerging" },
  { value: "DEVELOPING", label: "Developing" },
  { value: "AGE_APPROPRIATE", label: "Age Appropriate" },
];

const flexibilityOptions: { value: ChangeFlexibility; label: string }[] = [
  { value: "VERY_RIGID", label: "Very Rigid" },
  { value: "RIGID", label: "Rigid" },
  { value: "MODERATELY_FLEXIBLE", label: "Moderately Flexible" },
  { value: "FLEXIBLE", label: "Flexible" },
  { value: "VERY_FLEXIBLE", label: "Very Flexible" },
];

export function AutismProfileSetup({
  learnerId,
  initialProfile,
  onSave,
  className,
}: AutismProfileSetupProps) {
  const [profile, setProfile] = useState<Partial<AutismProfile>>({
    learnerId,
    communicationStyle: "VERBAL",
    socialInteractionLevel: "DEVELOPING",
    changeFlexibility: "MODERATELY_FLEXIBLE",
    needsVisualSchedule: true,
    needsTransitionWarnings: true,
    preferredWarningTime: 5,
    usesAAC: false,
    communicationStrengths: [],
    communicationChallenges: [],
    socialStrengths: [],
    socialChallenges: [],
    specialInterests: [],
    commonTriggers: [],
    calmingStrategies: [],
    reinforcers: [],
    needsSocialStories: true,
    needsTokenSystem: false,
    ...initialProfile,
  });

  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("diagnosis");
  const [newItem, setNewItem] = useState("");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(profile);
    } finally {
      setSaving(false);
    }
  };

  const addToArray = (field: keyof AutismProfile) => {
    if (!newItem.trim()) return;
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: [...current, newItem.trim()] });
    setNewItem("");
  };

  const removeFromArray = (field: keyof AutismProfile, index: number) => {
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: current.filter((_, i) => i !== index) });
  };

  const addSpecialInterest = () => {
    if (!newItem.trim()) return;
    const interests = profile.specialInterests || [];
    setProfile({
      ...profile,
      specialInterests: [
        ...interests,
        { topic: newItem.trim(), intensity: 3, canUseForRewards: true },
      ],
    });
    setNewItem("");
  };

  const sections = [
    { id: "diagnosis", label: "Diagnosis", icon: User },
    { id: "communication", label: "Communication", icon: MessageSquare },
    { id: "social", label: "Social", icon: Users },
    { id: "flexibility", label: "Flexibility", icon: Clock },
    { id: "interests", label: "Interests", icon: Star },
    { id: "behavior", label: "Behavior", icon: AlertTriangle },
    { id: "notes", label: "Team Notes", icon: Heart },
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Autism Profile Setup
        </CardTitle>
        <CardDescription>
          Configure support preferences and assessment information
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Section Navigation */}
        <div className="flex flex-wrap gap-2 mb-6">
          {sections.map((section) => (
            <Button
              key={section.id}
              variant={activeSection === section.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection(section.id)}
            >
              <section.icon className="h-4 w-4 mr-1" />
              {section.label}
            </Button>
          ))}
        </div>

        {/* Diagnosis Section */}
        {activeSection === "diagnosis" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Diagnosis Date</Label>
                <Input
                  type="date"
                  value={profile.diagnosisDate?.split("T")[0] || ""}
                  onChange={(e) => setProfile({ ...profile, diagnosisDate: e.target.value })}
                />
              </div>
              <div>
                <Label>Diagnosed By</Label>
                <Input
                  value={profile.diagnosedBy || ""}
                  onChange={(e) => setProfile({ ...profile, diagnosedBy: e.target.value })}
                  placeholder="Clinician name"
                />
              </div>
            </div>
            <div>
              <Label>DSM-5 Support Level (1-3)</Label>
              <div className="flex gap-2 mt-2">
                {[1, 2, 3].map((level) => (
                  <Button
                    key={level}
                    variant={profile.supportLevel === level ? "default" : "outline"}
                    onClick={() => setProfile({ ...profile, supportLevel: level })}
                    className="flex-1"
                  >
                    Level {level}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Level 1: Requiring support | Level 2: Requiring substantial support | Level 3: Requiring very substantial support
              </p>
            </div>
            <div>
              <Label>Assessment Notes</Label>
              <Textarea
                value={profile.assessmentNotes || ""}
                onChange={(e) => setProfile({ ...profile, assessmentNotes: e.target.value })}
                placeholder="Additional assessment information..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Communication Section */}
        {activeSection === "communication" && (
          <div className="space-y-4">
            <div>
              <Label>Communication Style</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {communicationStyleOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={profile.communicationStyle === option.value ? "default" : "outline"}
                    onClick={() => setProfile({ ...profile, communicationStyle: option.value })}
                    className="justify-start h-auto py-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs opacity-70">{option.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Expressive Language (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.expressiveLanguage === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, expressiveLanguage: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Receptive Language (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.receptiveLanguage === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, receptiveLanguage: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Communication Strengths</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add strength..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("communicationStrengths")}
                />
                <Button onClick={() => addToArray("communicationStrengths")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.communicationStrengths?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("communicationStrengths", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Communication Challenges</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add challenge..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("communicationChallenges")}
                />
                <Button onClick={() => addToArray("communicationChallenges")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.communicationChallenges?.map((item, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("communicationChallenges", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Social Section */}
        {activeSection === "social" && (
          <div className="space-y-4">
            <div>
              <Label>Social Interaction Level</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {socialLevelOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={profile.socialInteractionLevel === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, socialInteractionLevel: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Joint Attention (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.jointAttention === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, jointAttention: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Peer Interaction (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.peerInteraction === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, peerInteraction: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Adult Interaction (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.adultInteraction === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, adultInteraction: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label>Social Strengths</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add strength..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("socialStrengths")}
                />
                <Button onClick={() => addToArray("socialStrengths")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.socialStrengths?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("socialStrengths", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Flexibility Section */}
        {activeSection === "flexibility" && (
          <div className="space-y-4">
            <div>
              <Label>Change Flexibility</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {flexibilityOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={profile.changeFlexibility === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, changeFlexibility: option.value })}
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Needs Visual Schedule</Label>
                <Button
                  variant={profile.needsVisualSchedule ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfile({ ...profile, needsVisualSchedule: !profile.needsVisualSchedule })}
                >
                  {profile.needsVisualSchedule ? "Yes" : "No"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <Label>Needs Transition Warnings</Label>
                <Button
                  variant={profile.needsTransitionWarnings ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfile({ ...profile, needsTransitionWarnings: !profile.needsTransitionWarnings })}
                >
                  {profile.needsTransitionWarnings ? "Yes" : "No"}
                </Button>
              </div>
            </div>

            {profile.needsTransitionWarnings && (
              <div>
                <Label>Preferred Warning Time (minutes)</Label>
                <div className="flex gap-2 mt-2">
                  {[2, 5, 10, 15, 20].map((mins) => (
                    <Button
                      key={mins}
                      variant={profile.preferredWarningTime === mins ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, preferredWarningTime: mins })}
                    >
                      {mins}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Special Interests Section */}
        {activeSection === "interests" && (
          <div className="space-y-4">
            <div>
              <Label>Special Interests</Label>
              <p className="text-sm text-muted-foreground">
                These can be used for engagement and rewards
              </p>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add interest..."
                  onKeyDown={(e) => e.key === "Enter" && addSpecialInterest()}
                />
                <Button onClick={addSpecialInterest}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-3">
                {profile.specialInterests?.map((interest, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 border rounded-lg">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium flex-1">{interest.topic}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-sm text-muted-foreground">Intensity:</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          className={cn(
                            "w-6 h-6 rounded text-xs",
                            interest.intensity >= n
                              ? "bg-yellow-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700"
                          )}
                          onClick={() => {
                            const updated = [...(profile.specialInterests || [])];
                            updated[i] = { ...interest, intensity: n };
                            setProfile({ ...profile, specialInterests: updated });
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const updated = profile.specialInterests?.filter((_, idx) => idx !== i);
                        setProfile({ ...profile, specialInterests: updated });
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label>Effective Reinforcers</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add reinforcer..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("reinforcers")}
                />
                <Button onClick={() => addToArray("reinforcers")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.reinforcers?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("reinforcers", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Behavior Section */}
        {activeSection === "behavior" && (
          <div className="space-y-4">
            <div>
              <Label>Common Triggers</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add trigger..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("commonTriggers")}
                />
                <Button onClick={() => addToArray("commonTriggers")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.commonTriggers?.map((item, i) => (
                  <Badge key={i} variant="destructive" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("commonTriggers", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Calming Strategies</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add strategy..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("calmingStrategies")}
                />
                <Button onClick={() => addToArray("calmingStrategies")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.calmingStrategies?.map((item, i) => (
                  <Badge key={i} className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("calmingStrategies", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Needs Social Stories</Label>
                  <p className="text-sm text-muted-foreground">For new situations and skills</p>
                </div>
                <Button
                  variant={profile.needsSocialStories ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfile({ ...profile, needsSocialStories: !profile.needsSocialStories })}
                >
                  {profile.needsSocialStories ? "Yes" : "No"}
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Needs Token System</Label>
                  <p className="text-sm text-muted-foreground">Visual reinforcement board</p>
                </div>
                <Button
                  variant={profile.needsTokenSystem ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProfile({ ...profile, needsTokenSystem: !profile.needsTokenSystem })}
                >
                  {profile.needsTokenSystem ? "Yes" : "No"}
                </Button>
              </div>
            </div>

            {profile.needsTokenSystem && (
              <div>
                <Label>Token Goal Size</Label>
                <div className="flex gap-2 mt-2">
                  {[3, 5, 7, 10].map((n) => (
                    <Button
                      key={n}
                      variant={profile.tokenGoalSize === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, tokenGoalSize: n })}
                    >
                      {n} tokens
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Team Notes Section */}
        {activeSection === "notes" && (
          <div className="space-y-4">
            <div>
              <Label>Parent Notes</Label>
              <Textarea
                value={profile.parentNotes || ""}
                onChange={(e) => setProfile({ ...profile, parentNotes: e.target.value })}
                placeholder="Notes from parents/guardians..."
                rows={4}
              />
            </div>
            <div>
              <Label>Teacher Notes</Label>
              <Textarea
                value={profile.teacherNotes || ""}
                onChange={(e) => setProfile({ ...profile, teacherNotes: e.target.value })}
                placeholder="Notes from teachers..."
                rows={4}
              />
            </div>
            <div>
              <Label>Therapist Notes</Label>
              <Textarea
                value={profile.therapistNotes || ""}
                onChange={(e) => setProfile({ ...profile, therapistNotes: e.target.value })}
                placeholder="Notes from therapists (OT, SLP, BCBA, etc.)..."
                rows={4}
              />
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end mt-6">
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
