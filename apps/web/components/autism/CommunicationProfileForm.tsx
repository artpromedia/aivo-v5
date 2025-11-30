"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}>
    {children}
  </label>
);
import { MessageSquare, Save, Plus, X, Check, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CommunicationProfile {
  id: string;
  autismProfileId: string;
  primaryExpressiveMode: string;
  speechClarity?: number;
  averageUtteranceLength?: number;
  vocabularyLevel?: string;
  canRequestHelp: boolean;
  canExpressNeeds: boolean;
  canAskQuestions: boolean;
  canTellStories: boolean;
  followsSimpleDirections: boolean;
  followsMultiStepDirections: boolean;
  understandsQuestions: boolean;
  understandsSarcasm: boolean;
  understandsIdioms: boolean;
  needsVisualSupports: boolean;
  needsSimplifiedLanguage: boolean;
  processingTime?: number;
  makesEyeContact: boolean;
  initiatesConversation: boolean;
  maintainsConversation: boolean;
  takesTurns: boolean;
  understoodByFamiliar?: number;
  understoodByUnfamiliar?: number;
  aacDeviceType?: string;
  aacAppOrSystem?: string;
  aacVocabularySize?: number;
  aacProficiency?: number;
  aacSupportsNeeded: string[];
  currentGoals: string[];
  targetSkills: string[];
  effectiveStrategies: string[];
  ineffectiveApproaches: string[];
  createdAt: string;
  updatedAt: string;
}

interface CommunicationProfileFormProps {
  autismProfileId: string;
  initialProfile?: Partial<CommunicationProfile>;
  onSave: (profile: Partial<CommunicationProfile>) => Promise<void>;
  className?: string;
}

const expressiveModes = [
  { value: "speech", label: "Speech", description: "Spoken words" },
  { value: "sign", label: "Sign Language", description: "ASL or other sign system" },
  { value: "AAC", label: "AAC Device", description: "Communication device or app" },
  { value: "gestures", label: "Gestures", description: "Pointing, leading, showing" },
  { value: "mixed", label: "Mixed", description: "Combination of methods" },
];

const vocabularyLevels = ["limited", "functional", "age-appropriate", "advanced"];

export function CommunicationProfileForm({
  autismProfileId,
  initialProfile,
  onSave,
  className,
}: CommunicationProfileFormProps) {
  const [profile, setProfile] = useState<Partial<CommunicationProfile>>({
    autismProfileId,
    primaryExpressiveMode: "speech",
    canRequestHelp: false,
    canExpressNeeds: false,
    canAskQuestions: false,
    canTellStories: false,
    followsSimpleDirections: true,
    followsMultiStepDirections: false,
    understandsQuestions: true,
    understandsSarcasm: false,
    understandsIdioms: false,
    needsVisualSupports: true,
    needsSimplifiedLanguage: false,
    makesEyeContact: true,
    initiatesConversation: false,
    maintainsConversation: false,
    takesTurns: false,
    aacSupportsNeeded: [],
    currentGoals: [],
    targetSkills: [],
    effectiveStrategies: [],
    ineffectiveApproaches: [],
    ...initialProfile,
  });

  const [saving, setSaving] = useState(false);
  const [newItem, setNewItem] = useState("");
  const [activeSection, setActiveSection] = useState("expressive");

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(profile);
    } finally {
      setSaving(false);
    }
  };

  const addToArray = (field: keyof CommunicationProfile) => {
    if (!newItem.trim()) return;
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: [...current, newItem.trim()] });
    setNewItem("");
  };

  const removeFromArray = (field: keyof CommunicationProfile, index: number) => {
    const current = (profile[field] as string[]) || [];
    setProfile({ ...profile, [field]: current.filter((_, i) => i !== index) });
  };

  const BooleanToggle = ({ 
    field, 
    label, 
    description 
  }: { 
    field: keyof CommunicationProfile; 
    label: string; 
    description?: string;
  }) => (
    <div className="flex items-center justify-between p-3 border rounded-lg">
      <div>
        <div className="font-medium">{label}</div>
        {description && <div className="text-sm text-muted-foreground">{description}</div>}
      </div>
      <Button
        variant={profile[field] ? "default" : "outline"}
        size="sm"
        onClick={() => setProfile({ ...profile, [field]: !profile[field] })}
      >
        {profile[field] ? <Check className="h-4 w-4 mr-1" /> : null}
        {profile[field] ? "Yes" : "No"}
      </Button>
    </div>
  );

  const sections = [
    { id: "expressive", label: "Expressive" },
    { id: "receptive", label: "Receptive" },
    { id: "pragmatic", label: "Pragmatic/Social" },
    { id: "aac", label: "AAC" },
    { id: "strategies", label: "Strategies & Goals" },
  ];

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Communication Profile
        </CardTitle>
        <CardDescription>
          Detailed assessment of communication abilities and needs
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
              {section.label}
            </Button>
          ))}
        </div>

        {/* Expressive Communication */}
        {activeSection === "expressive" && (
          <div className="space-y-4">
            <div>
              <Label>Primary Expressive Mode</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                {expressiveModes.map((mode) => (
                  <Button
                    key={mode.value}
                    variant={profile.primaryExpressiveMode === mode.value ? "default" : "outline"}
                    onClick={() => setProfile({ ...profile, primaryExpressiveMode: mode.value })}
                    className="justify-start h-auto py-2"
                  >
                    <div className="text-left">
                      <div className="font-medium">{mode.label}</div>
                      <div className="text-xs opacity-70">{mode.description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {profile.primaryExpressiveMode === "speech" && (
              <div>
                <Label>Speech Clarity (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.speechClarity === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, speechClarity: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  1 = Very difficult to understand, 5 = Clear speech
                </p>
              </div>
            )}

            <div>
              <Label>Vocabulary Level</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {vocabularyLevels.map((level) => (
                  <Button
                    key={level}
                    variant={profile.vocabularyLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, vocabularyLevel: level })}
                  >
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Expressive Abilities</Label>
              <BooleanToggle field="canRequestHelp" label="Can Request Help" />
              <BooleanToggle field="canExpressNeeds" label="Can Express Basic Needs" />
              <BooleanToggle field="canAskQuestions" label="Can Ask Questions" />
              <BooleanToggle field="canTellStories" label="Can Tell Stories/Narratives" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Understood by Familiar People (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.understoodByFamiliar === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, understoodByFamiliar: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Understood by Unfamiliar People (1-5)</Label>
                <div className="flex gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Button
                      key={n}
                      variant={profile.understoodByUnfamiliar === n ? "default" : "outline"}
                      size="sm"
                      onClick={() => setProfile({ ...profile, understoodByUnfamiliar: n })}
                    >
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Receptive Communication */}
        {activeSection === "receptive" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Receptive Abilities</Label>
              <BooleanToggle 
                field="followsSimpleDirections" 
                label="Follows Simple Directions"
                description="One-step directions"
              />
              <BooleanToggle 
                field="followsMultiStepDirections" 
                label="Follows Multi-Step Directions"
                description="Two or more steps"
              />
              <BooleanToggle 
                field="understandsQuestions" 
                label="Understands Questions"
              />
              <BooleanToggle 
                field="understandsSarcasm" 
                label="Understands Sarcasm"
              />
              <BooleanToggle 
                field="understandsIdioms" 
                label="Understands Idioms/Figurative Language"
              />
            </div>

            <div className="space-y-2">
              <Label>Support Needs</Label>
              <BooleanToggle 
                field="needsVisualSupports" 
                label="Needs Visual Supports"
                description="Pictures, written words, gestures"
              />
              <BooleanToggle 
                field="needsSimplifiedLanguage" 
                label="Needs Simplified Language"
                description="Short, clear sentences"
              />
            </div>

            <div>
              <Label>Processing Time (seconds)</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Time needed to process and respond to language
              </p>
              <div className="flex gap-2">
                {[3, 5, 10, 15, 20, 30].map((sec) => (
                  <Button
                    key={sec}
                    variant={profile.processingTime === sec ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, processingTime: sec })}
                  >
                    {sec}s
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pragmatic/Social Communication */}
        {activeSection === "pragmatic" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Social Communication Skills</Label>
              <BooleanToggle 
                field="makesEyeContact" 
                label="Makes Eye Contact"
                description="Appropriate eye contact during interactions"
              />
              <BooleanToggle 
                field="initiatesConversation" 
                label="Initiates Conversation"
                description="Starts conversations with others"
              />
              <BooleanToggle 
                field="maintainsConversation" 
                label="Maintains Conversation"
                description="Stays on topic, responds appropriately"
              />
              <BooleanToggle 
                field="takesTurns" 
                label="Takes Turns in Conversation"
                description="Waits for others, doesn't interrupt"
              />
            </div>
          </div>
        )}

        {/* AAC Section */}
        {activeSection === "aac" && (
          <div className="space-y-4">
            <div>
              <Label>AAC Device Type</Label>
              <Input
                value={profile.aacDeviceType || ""}
                onChange={(e) => setProfile({ ...profile, aacDeviceType: e.target.value })}
                placeholder="e.g., iPad, dedicated device, paper-based"
              />
            </div>

            <div>
              <Label>AAC App or System</Label>
              <Input
                value={profile.aacAppOrSystem || ""}
                onChange={(e) => setProfile({ ...profile, aacAppOrSystem: e.target.value })}
                placeholder="e.g., Proloquo2Go, TouchChat, PECS"
              />
            </div>

            <div>
              <Label>AAC Vocabulary Size</Label>
              <Input
                type="number"
                value={profile.aacVocabularySize || ""}
                onChange={(e) => setProfile({ ...profile, aacVocabularySize: parseInt(e.target.value) || undefined })}
                placeholder="Number of symbols/words available"
              />
            </div>

            <div>
              <Label>AAC Proficiency (1-5)</Label>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Button
                    key={n}
                    variant={profile.aacProficiency === n ? "default" : "outline"}
                    size="sm"
                    onClick={() => setProfile({ ...profile, aacProficiency: n })}
                  >
                    {n}
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                1 = Emerging user, 5 = Independent communicator
              </p>
            </div>

            <div>
              <Label>AAC Supports Needed</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add support need..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("aacSupportsNeeded")}
                />
                <Button onClick={() => addToArray("aacSupportsNeeded")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.aacSupportsNeeded?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("aacSupportsNeeded", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Strategies & Goals */}
        {activeSection === "strategies" && (
          <div className="space-y-4">
            <div>
              <Label>Effective Strategies</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add strategy..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("effectiveStrategies")}
                />
                <Button onClick={() => addToArray("effectiveStrategies")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.effectiveStrategies?.map((item, i) => (
                  <Badge key={i} className="gap-1 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("effectiveStrategies", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Ineffective Approaches</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add approach to avoid..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("ineffectiveApproaches")}
                />
                <Button onClick={() => addToArray("ineffectiveApproaches")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.ineffectiveApproaches?.map((item, i) => (
                  <Badge key={i} variant="destructive" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("ineffectiveApproaches", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Current Goals</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add goal..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("currentGoals")}
                />
                <Button onClick={() => addToArray("currentGoals")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.currentGoals?.map((item, i) => (
                  <Badge key={i} variant="outline" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("currentGoals", i)}
                    />
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <Label>Target Skills</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Add target skill..."
                  onKeyDown={(e) => e.key === "Enter" && addToArray("targetSkills")}
                />
                <Button onClick={() => addToArray("targetSkills")}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {profile.targetSkills?.map((item, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {item}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => removeFromArray("targetSkills", i)}
                    />
                  </Badge>
                ))}
              </div>
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
