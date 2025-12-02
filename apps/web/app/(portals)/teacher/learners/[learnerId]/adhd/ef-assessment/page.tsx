"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, RefreshCw, Info, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { EFRadarChart, type EFDomainRatings, type ExecutiveFunctionProfile } from "@/components/adhd";

// EF Domain descriptions for the assessment
const efDomainInfo = {
  organization: {
    name: "Organization",
    description: "Ability to keep track of materials, manage belongings, and maintain order",
    indicators: [
      "Keeps desk and backpack organized",
      "Knows where materials are located",
      "Can set up workspace for tasks",
    ],
  },
  timeManagement: {
    name: "Time Management",
    description: "Ability to estimate time, pace oneself, and meet deadlines",
    indicators: [
      "Estimates how long tasks will take",
      "Uses time wisely during class",
      "Submits assignments on time",
    ],
  },
  planning: {
    name: "Planning",
    description: "Ability to set goals, create plans, and think ahead",
    indicators: [
      "Breaks down large tasks",
      "Creates step-by-step plans",
      "Thinks about future consequences",
    ],
  },
  taskInitiation: {
    name: "Task Initiation",
    description: "Ability to begin tasks without undue procrastination",
    indicators: [
      "Starts work without prompting",
      "Begins tasks even when uninteresting",
      "Doesn't wait until last minute",
    ],
  },
  workingMemory: {
    name: "Working Memory",
    description: "Ability to hold information in mind while working",
    indicators: [
      "Remembers multi-step directions",
      "Keeps track of what they're doing",
      "Can do mental math",
    ],
  },
  metacognition: {
    name: "Metacognition",
    description: "Ability to step back and evaluate own performance",
    indicators: [
      "Monitors own progress",
      "Recognizes when struggling",
      "Adjusts strategies as needed",
    ],
  },
  emotionalControl: {
    name: "Emotional Control",
    description: "Ability to manage emotions to achieve goals",
    indicators: [
      "Stays calm when frustrated",
      "Handles criticism constructively",
      "Manages test anxiety",
    ],
  },
  flexibility: {
    name: "Flexibility",
    description: "Ability to adapt to changes and shift between tasks",
    indicators: [
      "Adapts to schedule changes",
      "Transitions smoothly between activities",
      "Accepts alternative solutions",
    ],
  },
};

// Mock current profile
const mockProfile = {
  id: "profile-1",
  learnerId: "learner-1",
  organizationRating: 3,
  timeManagementRating: 2,
  planningRating: 3,
  taskInitiationRating: 2,
  workingMemoryRating: 4,
  metacognitionRating: 3,
  emotionalControlRating: 4,
  flexibilityRating: 3,
  strengthAreas: ["Working Memory", "Emotional Control"],
  challengeAreas: ["Time Management", "Task Initiation"],
  accommodations: ["Extended time on tests", "Preferential seating", "Chunked assignments"],
  notes: "Student responds well to visual timers and frequent check-ins.",
};

// Mock historical ratings for trend
const mockHistoricalRatings = {
  organization: [2, 2, 3, 3],
  timeManagement: [1, 2, 2, 2],
  planning: [2, 2, 3, 3],
  taskInitiation: [2, 2, 2, 2],
  workingMemory: [3, 4, 4, 4],
  metacognition: [2, 3, 3, 3],
  emotionalControl: [3, 3, 4, 4],
  flexibility: [3, 3, 3, 3],
};

type EFDomain = keyof typeof efDomainInfo;

export default function EFAssessmentPage() {
  const params = useParams();
  const router = useRouter();
  const learnerId = (params?.learnerId as string) || "";

  const [isEditing, setIsEditing] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<EFDomain | null>(null);
  const [ratings, setRatings] = useState<EFDomainRatings>({
    organization: mockProfile.organizationRating,
    timeManagement: mockProfile.timeManagementRating,
    planning: mockProfile.planningRating,
    taskInitiation: mockProfile.taskInitiationRating,
    workingMemory: mockProfile.workingMemoryRating,
    metacognition: mockProfile.metacognitionRating,
    emotionalControl: mockProfile.emotionalControlRating,
    flexibility: mockProfile.flexibilityRating,
  });
  const [strengthAreas, setStrengthAreas] = useState(mockProfile.strengthAreas.join(", "));
  const [challengeAreas, setChallengeAreas] = useState(mockProfile.challengeAreas.join(", "));
  const [accommodations, setAccommodations] = useState(mockProfile.accommodations.join("\n"));
  const [notes, setNotes] = useState(mockProfile.notes);

  // Build profile object for EFRadarChart
  const currentProfile: ExecutiveFunctionProfile = {
    id: mockProfile.id,
    learnerId: mockProfile.learnerId,
    assessmentDate: new Date().toISOString(),
    ratings,
    strengths: strengthAreas.split(",").map((s) => s.trim()).filter(Boolean),
    challenges: challengeAreas.split(",").map((s) => s.trim()).filter(Boolean),
    accommodations: accommodations.split("\n").filter((a) => a.trim()),
    strategies: [],
    notes,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const handleRatingChange = (domain: EFDomain, value: number) => {
    setRatings((prev) => ({ ...prev, [domain]: value }));
  };

  const handleSave = async () => {
    // TODO: API call to save profile
    console.log("Saving profile:", {
      ...ratings,
      strengthAreas: strengthAreas.split(",").map((s) => s.trim()),
      challengeAreas: challengeAreas.split(",").map((s) => s.trim()),
      accommodations: accommodations.split("\n").filter((a) => a.trim()),
      notes,
    });
    setIsEditing(false);
  };

  const getTrend = (domain: EFDomain) => {
    const history = mockHistoricalRatings[domain];
    if (history.length < 2) return "stable";
    const recent = history[history.length - 1];
    const previous = history[history.length - 2];
    if (recent > previous) return "improving";
    if (recent < previous) return "declining";
    return "stable";
  };

  const getTrendIcon = (domain: EFDomain) => {
    const trend = getTrend(domain);
    if (trend === "improving") return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "declining") return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const ratingLabels = ["Very Low", "Low", "Average", "High", "Very High"];

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Executive Function Assessment</h1>
            <p className="text-muted-foreground">
              Comprehensive EF profile and skill ratings
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Update Assessment
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <EFRadarChart profile={currentProfile} size="lg" />

        {/* Quick Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Profile Summary</CardTitle>
            <CardDescription>Current strengths and areas for growth</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Strength Areas</label>
              {isEditing ? (
                <Input
                  value={strengthAreas}
                  onChange={(e) => setStrengthAreas(e.target.value)}
                  placeholder="Comma-separated strength areas"
                  className="mt-1"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {mockProfile.strengthAreas.map((area) => (
                    <Badge key={area} className="bg-green-100 text-green-800">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Challenge Areas</label>
              {isEditing ? (
                <Input
                  value={challengeAreas}
                  onChange={(e) => setChallengeAreas(e.target.value)}
                  placeholder="Comma-separated challenge areas"
                  className="mt-1"
                />
              ) : (
                <div className="flex flex-wrap gap-2 mt-1">
                  {mockProfile.challengeAreas.map((area) => (
                    <Badge key={area} variant="destructive">
                      {area}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Accommodations</label>
              {isEditing ? (
                <Textarea
                  value={accommodations}
                  onChange={(e) => setAccommodations(e.target.value)}
                  placeholder="One accommodation per line"
                  className="mt-1"
                  rows={3}
                />
              ) : (
                <ul className="mt-1 space-y-1">
                  {mockProfile.accommodations.map((acc, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-theme-primary rounded-full" />
                      {acc}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <label className="text-sm font-medium">Notes</label>
              {isEditing ? (
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Additional observations or notes"
                  className="mt-1"
                  rows={2}
                />
              ) : (
                <p className="text-sm text-muted-foreground mt-1">{mockProfile.notes}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Domain Ratings Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Domain Ratings</CardTitle>
          <CardDescription>
            Click on a domain for more details and indicators
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(efDomainInfo) as EFDomain[]).map((domain) => (
              <button
                key={domain}
                onClick={() => setSelectedDomain(selectedDomain === domain ? null : domain)}
                className={`p-4 rounded-lg border text-left transition-all ${
                  selectedDomain === domain
                    ? "border-theme-primary bg-theme-primary/5 dark:bg-theme-primary/20"
                    : "hover:border-gray-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">{efDomainInfo[domain].name}</span>
                  {getTrendIcon(domain)}
                </div>
                {isEditing ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRatingChange(domain, value);
                        }}
                        className={`w-8 h-8 rounded text-sm font-medium transition-all ${
                          ratings[domain] >= value
                            ? "bg-theme-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {value}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-theme-primary rounded-full transition-all"
                        style={{ width: `${(ratings[domain] / 5) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium">{ratings[domain]}/5</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  {ratingLabels[ratings[domain] - 1]}
                </p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Domain Detail */}
      {selectedDomain && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-theme-primary" />
              <CardTitle className="text-lg">{efDomainInfo[selectedDomain].name}</CardTitle>
            </div>
            <CardDescription>{efDomainInfo[selectedDomain].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Key Indicators</h4>
              <ul className="space-y-2">
                {efDomainInfo[selectedDomain].indicators.map((indicator, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="w-2 h-2 bg-theme-primary rounded-full" />
                    {indicator}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Historical Trend</h4>
              <div className="flex items-end gap-1 h-16">
                {mockHistoricalRatings[selectedDomain].map((rating, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-theme-primary rounded-t transition-all"
                      style={{ height: `${(rating / 5) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground">Q{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
