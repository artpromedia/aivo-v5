"use client";

import React, { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, Users, User, School, Home,
  CheckCircle2, AlertCircle, TrendingUp
} from "lucide-react";

interface PragmaticSkillData {
  skillType: string;
  skillName: string;
  socialSetting: string;
  baselineRating?: string;
  currentRating: string;
  goalRating?: string;
  observationContext?: string;
  specificBehaviorsObserved?: string[];
  promptsStrategiesUsed?: string[];
  peerInteractionQuality?: number;
  adultInteractionQuality?: number;
}

interface PragmaticSkillsMatrixProps {
  learnerId: string;
  sessionId?: string;
  existingSkills?: PragmaticSkillData[];
  onSave: (skills: PragmaticSkillData[]) => Promise<void>;
  isSubmitting?: boolean;
}

const skillTypes = [
  { 
    value: "TURN_TAKING", 
    label: "Turn Taking",
    description: "Appropriate exchange of speaker/listener roles",
    behaviors: ["Waits for turn", "Doesn't interrupt", "Yields floor appropriately", "Recognizes cues"]
  },
  { 
    value: "TOPIC_MAINTENANCE", 
    label: "Topic Maintenance",
    description: "Staying on topic during conversation",
    behaviors: ["Stays on topic", "Makes relevant comments", "Asks on-topic questions", "Notices topic shifts"]
  },
  { 
    value: "TOPIC_INITIATION", 
    label: "Topic Initiation",
    description: "Starting conversations appropriately",
    behaviors: ["Initiates conversation", "Chooses appropriate topics", "Uses greetings", "Gets attention first"]
  },
  { 
    value: "REQUESTING", 
    label: "Requesting",
    description: "Asking for things appropriately",
    behaviors: ["Uses polite forms", "Asks clearly", "Uses appropriate volume", "Accepts 'no'"]
  },
  { 
    value: "COMMENTING", 
    label: "Commenting",
    description: "Making appropriate comments",
    behaviors: ["Relevant comments", "Appropriate timing", "Considers listener", "Not too much/little"]
  },
  { 
    value: "CLARIFICATION", 
    label: "Clarification",
    description: "Asking for and providing clarification",
    behaviors: ["Asks when confused", "Rephrases when needed", "Checks understanding", "Uses clarifying questions"]
  },
  { 
    value: "NONVERBAL", 
    label: "Nonverbal Communication",
    description: "Using and reading body language",
    behaviors: ["Eye contact", "Facial expressions", "Gestures", "Body orientation", "Personal space"]
  },
  { 
    value: "PERSPECTIVE_TAKING", 
    label: "Perspective Taking",
    description: "Understanding others' viewpoints",
    behaviors: ["Considers feelings", "Predicts reactions", "Adjusts language", "Shows empathy"]
  },
  { 
    value: "NARRATIVE", 
    label: "Narrative Skills",
    description: "Telling stories and recounting events",
    behaviors: ["Logical sequence", "Includes details", "Considers listener knowledge", "Uses cohesion"]
  },
  { 
    value: "PROBLEM_SOLVING", 
    label: "Social Problem Solving",
    description: "Resolving social conflicts",
    behaviors: ["Identifies problems", "Generates solutions", "Considers consequences", "Compromises"]
  },
];

const socialSettings = [
  { value: "ONE_ON_ONE_ADULT", label: "1:1 with Adult", icon: User },
  { value: "ONE_ON_ONE_PEER", label: "1:1 with Peer", icon: User },
  { value: "SMALL_GROUP", label: "Small Group (2-4)", icon: Users },
  { value: "LARGE_GROUP", label: "Large Group (5+)", icon: Users },
  { value: "CLASSROOM", label: "Classroom", icon: School },
  { value: "UNSTRUCTURED", label: "Unstructured (Recess)", icon: Home },
];

const ratingLevels = [
  { value: "EMERGING", label: "Emerging", color: "bg-red-100 text-red-800", score: 1 },
  { value: "DEVELOPING", label: "Developing", color: "bg-yellow-100 text-yellow-800", score: 2 },
  { value: "PROFICIENT", label: "Proficient", color: "bg-blue-100 text-blue-800", score: 3 },
  { value: "ADVANCED", label: "Advanced", color: "bg-green-100 text-green-800", score: 4 },
];

const promptStrategies = [
  "Visual support",
  "Verbal cue",
  "Modeling",
  "Role play",
  "Social story",
  "Video modeling",
  "Self-monitoring checklist",
  "Peer support",
  "Direct instruction",
];

export function PragmaticSkillsMatrix({
  learnerId,
  sessionId,
  existingSkills = [],
  onSave,
  isSubmitting = false,
}: PragmaticSkillsMatrixProps) {
  const [selectedSetting, setSelectedSetting] = useState(socialSettings[0].value);
  const [skillRatings, setSkillRatings] = useState<Record<string, string>>({});
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [observationContext, setObservationContext] = useState("");
  const [selectedBehaviors, setSelectedBehaviors] = useState<string[]>([]);
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([]);
  const [peerQuality, setPeerQuality] = useState<number>(3);
  const [adultQuality, setAdultQuality] = useState<number>(3);

  // Initialize ratings from existing skills
  const initialRatings = useMemo(() => {
    const ratings: Record<string, string> = {};
    existingSkills.forEach(skill => {
      ratings[skill.skillType] = skill.currentRating;
    });
    return ratings;
  }, [existingSkills]);

  const toggleBehavior = useCallback((behavior: string) => {
    setSelectedBehaviors(prev =>
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  }, []);

  const togglePrompt = useCallback((prompt: string) => {
    setSelectedPrompts(prev =>
      prev.includes(prompt)
        ? prev.filter(p => p !== prompt)
        : [...prev, prompt]
    );
  }, []);

  const handleRatingChange = useCallback((skillType: string, rating: string) => {
    setSkillRatings(prev => ({
      ...prev,
      [skillType]: rating,
    }));
  }, []);

  const handleSave = useCallback(async () => {
    const skills: PragmaticSkillData[] = Object.entries(skillRatings).map(([skillType, rating]) => {
      const skillInfo = skillTypes.find(s => s.value === skillType);
      return {
        skillType,
        skillName: skillInfo?.label || skillType,
        socialSetting: selectedSetting,
        currentRating: rating,
        observationContext,
        specificBehaviorsObserved: selectedBehaviors,
        promptsStrategiesUsed: selectedPrompts,
        peerInteractionQuality: peerQuality,
        adultInteractionQuality: adultQuality,
      };
    });

    if (skills.length > 0) {
      await onSave(skills);
    }
  }, [skillRatings, selectedSetting, observationContext, selectedBehaviors, selectedPrompts, peerQuality, adultQuality, onSave]);

  // Calculate summary stats
  const ratedSkillsCount = Object.keys(skillRatings).length;
  const averageRating = useMemo(() => {
    const ratings = Object.values(skillRatings);
    if (ratings.length === 0) return null;
    const total = ratings.reduce((sum, r) => {
      const level = ratingLevels.find(l => l.value === r);
      return sum + (level?.score || 0);
    }, 0);
    return (total / ratings.length).toFixed(1);
  }, [skillRatings]);

  const selectedSkillInfo = selectedSkill 
    ? skillTypes.find(s => s.value === selectedSkill) 
    : null;

  return (
    <div className="space-y-6">
      {/* Setting Selection */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Users className="h-5 w-5 text-theme-primary" />
            Social Setting
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {socialSettings.map((setting) => {
              const Icon = setting.icon;
              return (
                <button
                  key={setting.value}
                  onClick={() => setSelectedSetting(setting.value)}
                  className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                    selectedSetting === setting.value
                      ? "border-theme-primary bg-theme-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${selectedSetting === setting.value ? 'text-theme-primary' : 'text-gray-400'}`} />
                  <span className="text-sm font-medium">{setting.label}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skills Matrix */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Pragmatic Skills Rating</h3>
            {averageRating && (
              <Badge variant="outline">
                Avg: {averageRating}/4 ({ratedSkillsCount} skills rated)
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="space-y-3">
            {skillTypes.map((skill) => (
              <div 
                key={skill.value}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedSkill === skill.value 
                    ? 'border-theme-primary-light bg-theme-primary/5' 
                    : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedSkill(selectedSkill === skill.value ? null : skill.value)}
                  >
                    <div className="font-medium text-gray-800">{skill.label}</div>
                    <div className="text-sm text-gray-500">{skill.description}</div>
                  </div>
                  <div className="flex gap-1">
                    {ratingLevels.map((level) => (
                      <button
                        key={level.value}
                        onClick={() => handleRatingChange(skill.value, level.value)}
                        className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                          skillRatings[skill.value] === level.value
                            ? level.color + " ring-2 ring-offset-1 ring-theme-primary-light"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title={level.label}
                      >
                        {level.label.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Expanded details for selected skill */}
                {selectedSkill === skill.value && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specific Behaviors Observed
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {skill.behaviors.map((behavior) => (
                          <button
                            key={behavior}
                            onClick={() => toggleBehavior(behavior)}
                            className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                              selectedBehaviors.includes(behavior)
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {behavior}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rating Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {ratingLevels.map((level) => (
          <div key={level.value} className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${level.color}`}>
              {level.label.charAt(0)}
            </div>
            <span className="text-sm text-gray-600">{level.label}</span>
          </div>
        ))}
      </div>

      {/* Strategies Used */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Prompts/Strategies Used</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {promptStrategies.map((strategy) => (
              <button
                key={strategy}
                onClick={() => togglePrompt(strategy)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                  selectedPrompts.includes(strategy)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {strategy}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interaction Quality */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Interaction Quality Ratings</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Peer Interaction Quality (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setPeerQuality(rating)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      peerQuality === rating
                        ? "bg-theme-primary text-theme-primary-contrast"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adult Interaction Quality (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setAdultQuality(rating)}
                    className={`flex-1 py-2 rounded-lg font-bold transition-all ${
                      adultQuality === rating
                        ? "bg-theme-primary text-theme-primary-contrast"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Observation Context */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observation Context/Notes
          </label>
          <textarea
            value={observationContext}
            onChange={(e) => setObservationContext(e.target.value)}
            placeholder="Describe the observation context, activity, and any relevant notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-primary"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={ratedSkillsCount === 0 || isSubmitting}
        className="w-full py-3 bg-theme-primary text-theme-primary-contrast rounded-lg font-semibold hover:bg-theme-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save className="h-5 w-5" />
        {isSubmitting ? "Saving..." : `Save ${ratedSkillsCount} Skill Ratings`}
      </button>
    </div>
  );
}
