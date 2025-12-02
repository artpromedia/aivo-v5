"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Eye, 
  Ear, 
  Hand, 
  Sparkles,
  Play,
  Clock,
  Star,
  Printer,
  Video
} from "lucide-react";

type SensoryModality = "VISUAL" | "AUDITORY" | "KINESTHETIC" | "TACTILE" | "MULTISENSORY_VAKT";
type PhonicsCategory = 
  | "SINGLE_CONSONANTS"
  | "SHORT_VOWELS"
  | "CONSONANT_DIGRAPHS"
  | "CONSONANT_BLENDS"
  | "LONG_VOWELS_CVCe"
  | "VOWEL_TEAMS"
  | "R_CONTROLLED_VOWELS";

interface MultisensoryActivity {
  id: string;
  name: string;
  description: string;
  category?: PhonicsCategory;
  targetSkills: string[];
  primaryModality: SensoryModality;
  modalities: SensoryModality[];
  instructions: string;
  materials: string[];
  setupTimeMinutes: number;
  activityMinutes: number;
  difficultyLevel: number;
  gradeRange: string[];
  phonicsLevels: number[];
  imageUrl?: string;
  videoUrl?: string;
  printableUrl?: string;
  variations?: Array<{ name: string; description: string }>;
  usageCount: number;
  avgRating?: number;
}

interface MultisensoryActivityLibraryProps {
  activities: MultisensoryActivity[];
  currentPhonicsLevel: number;
  onSelectActivity: (activity: MultisensoryActivity) => void;
  onLogUsage: (activityId: string, rating?: number) => void;
}

const MODALITY_CONFIG: Record<SensoryModality, { icon: React.ReactNode; label: string; color: string }> = {
  VISUAL: { icon: <Eye className="h-4 w-4" />, label: "Visual", color: "bg-blue-100 text-blue-700" },
  AUDITORY: { icon: <Ear className="h-4 w-4" />, label: "Auditory", color: "bg-green-100 text-green-700" },
  KINESTHETIC: { icon: <Hand className="h-4 w-4" />, label: "Kinesthetic", color: "bg-orange-100 text-orange-700" },
  TACTILE: { icon: <Hand className="h-4 w-4" />, label: "Tactile", color: "bg-theme-primary/10 text-theme-primary" },
  MULTISENSORY_VAKT: { icon: <Sparkles className="h-4 w-4" />, label: "Multisensory", color: "bg-pink-100 text-pink-700" },
};

// Sample multisensory activities based on Orton-Gillingham approach
const SAMPLE_ACTIVITIES: MultisensoryActivity[] = [
  {
    id: "sky-writing",
    name: "Sky Writing",
    description: "Write letters in the air using large arm movements while saying the sound",
    targetSkills: ["Letter formation", "Sound-symbol association"],
    primaryModality: "KINESTHETIC",
    modalities: ["KINESTHETIC", "VISUAL", "AUDITORY"],
    instructions: "1. Stand with arm extended\n2. Say the letter name\n3. Write the letter in the air using your whole arm\n4. Say the sound\n5. Say a word that starts with that sound",
    materials: ["None required"],
    setupTimeMinutes: 0,
    activityMinutes: 10,
    difficultyLevel: 1,
    gradeRange: ["K", "1", "2"],
    phonicsLevels: [1, 2],
    usageCount: 145,
    avgRating: 4.8,
  },
  {
    id: "sand-tray",
    name: "Sand/Salt Tray Writing",
    description: "Write letters and words in sand or salt while saying sounds",
    targetSkills: ["Letter formation", "Spelling", "Tactile learning"],
    primaryModality: "TACTILE",
    modalities: ["TACTILE", "VISUAL", "AUDITORY"],
    instructions: "1. Spread sand/salt evenly in the tray\n2. Teacher says the sound\n3. Student traces the letter in the sand\n4. Student says the letter name and sound\n5. Smooth the sand and repeat",
    materials: ["Shallow tray", "Sand or salt", "Letter cards (optional)"],
    setupTimeMinutes: 5,
    activityMinutes: 15,
    difficultyLevel: 1,
    gradeRange: ["K", "1", "2"],
    phonicsLevels: [1, 2, 3],
    usageCount: 203,
    avgRating: 4.9,
  },
  {
    id: "arm-tapping",
    name: "Arm Tapping",
    description: "Tap sounds on arm while blending words",
    targetSkills: ["Phoneme segmentation", "Blending"],
    primaryModality: "KINESTHETIC",
    modalities: ["KINESTHETIC", "AUDITORY"],
    instructions: "1. Touch shoulder for first sound\n2. Slide down arm for middle sound\n3. Touch wrist for last sound\n4. Slide back up while blending the word",
    materials: ["None required"],
    setupTimeMinutes: 0,
    activityMinutes: 10,
    difficultyLevel: 2,
    gradeRange: ["K", "1", "2"],
    phonicsLevels: [1, 2, 3],
    usageCount: 178,
    avgRating: 4.7,
  },
  {
    id: "letter-tiles",
    name: "Magnetic Letter Tiles",
    description: "Build and manipulate words using magnetic letter tiles",
    targetSkills: ["Word building", "Spelling patterns", "Phoneme manipulation"],
    primaryModality: "TACTILE",
    modalities: ["TACTILE", "VISUAL"],
    instructions: "1. Select consonant and vowel tiles\n2. Build CVC word\n3. Read the word\n4. Change one letter to make new word\n5. Read new word",
    materials: ["Magnetic letter tiles", "Magnetic board"],
    setupTimeMinutes: 2,
    activityMinutes: 15,
    difficultyLevel: 2,
    gradeRange: ["K", "1", "2", "3"],
    phonicsLevels: [1, 2, 3, 4],
    usageCount: 256,
    avgRating: 4.8,
  },
  {
    id: "sound-boxes",
    name: "Elkonin Sound Boxes",
    description: "Push counters into boxes as you segment sounds in words",
    targetSkills: ["Phoneme segmentation", "Sound counting"],
    primaryModality: "KINESTHETIC",
    modalities: ["KINESTHETIC", "VISUAL", "AUDITORY"],
    instructions: "1. Draw boxes (one per sound)\n2. Say the word slowly\n3. Push a counter into each box as you say each sound\n4. Touch each counter and blend the word",
    materials: ["Sound box template", "Small counters or chips"],
    setupTimeMinutes: 2,
    activityMinutes: 10,
    difficultyLevel: 2,
    gradeRange: ["K", "1"],
    phonicsLevels: [1, 2],
    printableUrl: "/printables/sound-boxes.pdf",
    usageCount: 189,
    avgRating: 4.6,
  },
  {
    id: "rainbow-writing",
    name: "Rainbow Writing",
    description: "Trace words multiple times in different colors while saying sounds",
    targetSkills: ["Spelling", "Visual memory", "Letter formation"],
    primaryModality: "VISUAL",
    modalities: ["VISUAL", "KINESTHETIC", "AUDITORY"],
    instructions: "1. Write the word in pencil\n2. Trace with red crayon saying each sound\n3. Trace with orange saying each sound\n4. Continue with yellow, green, blue\n5. Read the completed rainbow word",
    materials: ["Paper", "Crayons or colored pencils"],
    setupTimeMinutes: 1,
    activityMinutes: 10,
    difficultyLevel: 1,
    gradeRange: ["K", "1", "2"],
    phonicsLevels: [1, 2, 3, 4],
    usageCount: 134,
    avgRating: 4.5,
  },
];

export function MultisensoryActivityLibrary({ 
  activities = SAMPLE_ACTIVITIES, 
  currentPhonicsLevel,
  onSelectActivity,
  onLogUsage
}: MultisensoryActivityLibraryProps) {
  const [selectedModality, setSelectedModality] = useState<SensoryModality | "ALL">("ALL");
  const [selectedLevel, setSelectedLevel] = useState<number | "ALL">("ALL");
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (selectedModality !== "ALL" && activity.primaryModality !== selectedModality) {
      return false;
    }
    if (selectedLevel !== "ALL" && !activity.phonicsLevels.includes(selectedLevel)) {
      return false;
    }
    return true;
  });

  // Get recommended activities for current level
  const recommendedActivities = activities.filter(a => 
    a.phonicsLevels.includes(currentPhonicsLevel)
  ).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Recommended for Current Level */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Recommended for Level {currentPhonicsLevel}
          </CardTitle>
          <CardDescription>
            Activities matched to your current phonics instruction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendedActivities.map(activity => (
              <div 
                key={activity.id}
                className="p-4 rounded-lg border-2 border-yellow-200 bg-yellow-50 cursor-pointer hover:border-yellow-400 transition-all"
                onClick={() => onSelectActivity(activity)}
              >
                <div className="flex items-start justify-between">
                  <div className="font-medium">{activity.name}</div>
                  <Badge className={MODALITY_CONFIG[activity.primaryModality].color}>
                    {MODALITY_CONFIG[activity.primaryModality].icon}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 mt-1">{activity.description}</div>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                  <Clock className="h-3 w-3" />
                  {activity.activityMinutes} min
                  {activity.avgRating && (
                    <>
                      <Star className="h-3 w-3 text-yellow-500 ml-2" />
                      {activity.avgRating.toFixed(1)}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Library</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            {/* Modality Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Learning Style</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedModality === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedModality("ALL")}
                >
                  All
                </Button>
                {Object.entries(MODALITY_CONFIG).map(([key, config]) => (
                  <Button
                    key={key}
                    variant={selectedModality === key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedModality(key as SensoryModality)}
                    className="flex items-center gap-1"
                  >
                    {config.icon}
                    <span className="hidden md:inline">{config.label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Phonics Level</label>
              <div className="flex gap-2">
                <Button
                  variant={selectedLevel === "ALL" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedLevel("ALL")}
                >
                  All
                </Button>
                {[1, 2, 3, 4, 5, 6].map(level => (
                  <Button
                    key={level}
                    variant={selectedLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedLevel(level)}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4">
            {filteredActivities.map(activity => (
              <div 
                key={activity.id}
                className="border rounded-lg overflow-hidden"
              >
                {/* Activity Header */}
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => setExpandedActivity(
                    expandedActivity === activity.id ? null : activity.id
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg">{activity.name}</span>
                        <Badge className={MODALITY_CONFIG[activity.primaryModality].color}>
                          {MODALITY_CONFIG[activity.primaryModality].icon}
                          <span className="ml-1">{MODALITY_CONFIG[activity.primaryModality].label}</span>
                        </Badge>
                      </div>
                      <div className="text-gray-600 mt-1">{activity.description}</div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {activity.targetSkills.map(skill => (
                          <Badge key={skill} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {activity.avgRating && (
                          <>
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span className="font-medium">{activity.avgRating.toFixed(1)}</span>
                          </>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {activity.usageCount} uses
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded Content */}
                {expandedActivity === activity.id && (
                  <div className="p-4 bg-gray-50 border-t">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Instructions */}
                      <div>
                        <h4 className="font-medium mb-2">Instructions</h4>
                        <div className="text-sm whitespace-pre-line bg-white p-3 rounded border">
                          {activity.instructions}
                        </div>
                      </div>

                      {/* Details */}
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Materials Needed</h4>
                          <ul className="text-sm list-disc list-inside">
                            {activity.materials.map((material, i) => (
                              <li key={i}>{material}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="flex gap-4">
                          <div>
                            <span className="text-sm text-gray-500">Setup Time</span>
                            <div className="font-medium">{activity.setupTimeMinutes} min</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Activity Time</span>
                            <div className="font-medium">{activity.activityMinutes} min</div>
                          </div>
                          <div>
                            <span className="text-sm text-gray-500">Difficulty</span>
                            <div className="font-medium">
                              {"⭐".repeat(activity.difficultyLevel)}
                            </div>
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">Grade Range</span>
                          <div className="flex gap-1 mt-1">
                            {activity.gradeRange.map(grade => (
                              <Badge key={grade} variant="outline">{grade}</Badge>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm text-gray-500">Modalities Used</span>
                          <div className="flex gap-1 mt-1">
                            {activity.modalities.map(modality => (
                              <Badge key={modality} className={MODALITY_CONFIG[modality].color}>
                                {MODALITY_CONFIG[modality].icon}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Variations */}
                    {activity.variations && activity.variations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <h4 className="font-medium mb-2">Variations</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {activity.variations.map((variation, i) => (
                            <div key={i} className="text-sm bg-white p-2 rounded border">
                              <span className="font-medium">{variation.name}:</span> {variation.description}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                      <Button onClick={() => onSelectActivity(activity)}>
                        <Play className="h-4 w-4 mr-2" />
                        Use This Activity
                      </Button>
                      {activity.printableUrl && (
                        <Button variant="outline">
                          <Printer className="h-4 w-4 mr-2" />
                          Print Materials
                        </Button>
                      )}
                      {activity.videoUrl && (
                        <Button variant="outline">
                          <Video className="h-4 w-4 mr-2" />
                          Watch Demo
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default MultisensoryActivityLibrary;
