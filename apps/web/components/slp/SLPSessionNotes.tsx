"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, FileText, Clock, Calendar,
  Target, MessageSquare, Home, CheckCircle2
} from "lucide-react";

interface SLPSessionNotesProps {
  learnerId: string;
  learnerName?: string;
  slpId?: string;
  onSave: (data: SLPSessionData) => Promise<void>;
  isSubmitting?: boolean;
  existingGoals?: GoalSummary[];
}

interface GoalSummary {
  id: string;
  goalArea: string;
  shortDescription: string;
}

interface SLPSessionData {
  learnerId: string;
  slpId?: string;
  sessionType: string;
  sessionDate: string;
  durationMinutes: number;
  location?: string;
  sessionFormat: string;
  goalsAddressed: string[];
  activitiesCompleted: string[];
  materialsUsed: string[];
  learnerEngagementRating: number;
  learnerMood?: string;
  progressNotes: string;
  clinicalObservations?: string;
  parentCommunication?: string;
  homeworkAssigned?: string;
  nextSessionFocus?: string;
  billingCode?: string;
  isBillable: boolean;
}

const sessionTypes = [
  { value: "ARTICULATION", label: "Articulation", color: "bg-theme-primary/10 text-theme-primary-dark" },
  { value: "FLUENCY", label: "Fluency", color: "bg-blue-100 text-blue-800" },
  { value: "RECEPTIVE_LANGUAGE", label: "Receptive Language", color: "bg-green-100 text-green-800" },
  { value: "EXPRESSIVE_LANGUAGE", label: "Expressive Language", color: "bg-teal-100 text-teal-800" },
  { value: "PRAGMATIC_LANGUAGE", label: "Pragmatic/Social", color: "bg-orange-100 text-orange-800" },
  { value: "VOICE", label: "Voice", color: "bg-cyan-100 text-cyan-800" },
  { value: "AAC", label: "AAC", color: "bg-pink-100 text-pink-800" },
  { value: "FEEDING_SWALLOWING", label: "Feeding/Swallowing", color: "bg-yellow-100 text-yellow-800" },
  { value: "MIXED", label: "Mixed Goals", color: "bg-gray-100 text-gray-800" },
  { value: "EVALUATION", label: "Evaluation", color: "bg-red-100 text-red-800" },
];

const sessionFormats = [
  { value: "IN_PERSON", label: "In-Person" },
  { value: "TELETHERAPY", label: "Teletherapy" },
  { value: "HYBRID", label: "Hybrid" },
  { value: "CONSULTATION", label: "Consultation" },
];

const locations = [
  { value: "THERAPY_ROOM", label: "Therapy Room" },
  { value: "CLASSROOM", label: "Classroom" },
  { value: "HOME", label: "Home" },
  { value: "VIRTUAL", label: "Virtual/Online" },
  { value: "COMMUNITY", label: "Community Setting" },
];

const moods = [
  { value: "HAPPY", label: "😊 Happy" },
  { value: "CALM", label: "😌 Calm" },
  { value: "TIRED", label: "😴 Tired" },
  { value: "DISTRACTED", label: "😵 Distracted" },
  { value: "ANXIOUS", label: "😰 Anxious" },
  { value: "FRUSTRATED", label: "😤 Frustrated" },
  { value: "EXCITED", label: "🤩 Excited" },
  { value: "UNWELL", label: "🤒 Unwell" },
];

const commonActivities = [
  "Drill practice",
  "Game-based practice",
  "Book reading",
  "Conversation practice",
  "Role play",
  "Video modeling",
  "App-based activities",
  "Craft activities",
  "Movement activities",
  "Social stories",
  "Barrier games",
  "Narrative retell",
];

const commonMaterials = [
  "Articulation cards",
  "Picture books",
  "Toys/manipulatives",
  "iPad/tablet apps",
  "Flashcards",
  "Board games",
  "Mirror",
  "Audio recorder",
  "Visual supports",
  "Social stories",
  "Worksheets",
  "AAC device",
];

const billingCodes = [
  { value: "92507", label: "92507 - Treatment" },
  { value: "92508", label: "92508 - Group Treatment" },
  { value: "92521", label: "92521 - Fluency Eval" },
  { value: "92522", label: "92522 - Speech Eval" },
  { value: "92523", label: "92523 - Speech-Lang Eval" },
  { value: "92524", label: "92524 - Voice/Resonance Eval" },
];

export function SLPSessionNotes({
  learnerId,
  learnerName,
  slpId,
  onSave,
  isSubmitting = false,
  existingGoals = [],
}: SLPSessionNotesProps) {
  // Session basics
  const [sessionType, setSessionType] = useState("ARTICULATION");
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [location, setLocation] = useState("THERAPY_ROOM");
  const [sessionFormat, setSessionFormat] = useState("IN_PERSON");
  
  // Goals and activities
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [customActivity, setCustomActivity] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  
  // Learner state
  const [engagementRating, setEngagementRating] = useState(4);
  const [mood, setMood] = useState("HAPPY");
  
  // Notes
  const [progressNotes, setProgressNotes] = useState("");
  const [clinicalObservations, setClinicalObservations] = useState("");
  const [parentCommunication, setParentCommunication] = useState("");
  const [homeworkAssigned, setHomeworkAssigned] = useState("");
  const [nextSessionFocus, setNextSessionFocus] = useState("");
  
  // Billing
  const [billingCode, setBillingCode] = useState("92507");
  const [isBillable, setIsBillable] = useState(true);

  const toggleGoal = useCallback((goalId: string) => {
    setSelectedGoals(prev =>
      prev.includes(goalId)
        ? prev.filter(g => g !== goalId)
        : [...prev, goalId]
    );
  }, []);

  const toggleActivity = useCallback((activity: string) => {
    setActivities(prev =>
      prev.includes(activity)
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  }, []);

  const addCustomActivity = useCallback(() => {
    if (customActivity.trim() && !activities.includes(customActivity.trim())) {
      setActivities(prev => [...prev, customActivity.trim()]);
      setCustomActivity("");
    }
  }, [customActivity, activities]);

  const toggleMaterial = useCallback((material: string) => {
    setMaterials(prev =>
      prev.includes(material)
        ? prev.filter(m => m !== material)
        : [...prev, material]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const data: SLPSessionData = {
      learnerId,
      slpId,
      sessionType,
      sessionDate: `${sessionDate}T${startTime}:00.000Z`,
      durationMinutes,
      location,
      sessionFormat,
      goalsAddressed: selectedGoals,
      activitiesCompleted: activities,
      materialsUsed: materials,
      learnerEngagementRating: engagementRating,
      learnerMood: mood,
      progressNotes,
      clinicalObservations,
      parentCommunication,
      homeworkAssigned,
      nextSessionFocus,
      billingCode,
      isBillable,
    };

    await onSave(data);
  }, [
    learnerId, slpId, sessionType, sessionDate, startTime, durationMinutes,
    location, sessionFormat, selectedGoals, activities, materials,
    engagementRating, mood, progressNotes, clinicalObservations,
    parentCommunication, homeworkAssigned, nextSessionFocus,
    billingCode, isBillable, onSave
  ]);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Session Header */}
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                SLP Session Notes
              </h3>
              {learnerName && (
                <p className="text-sm text-gray-500 mt-1">Learner: {learnerName}</p>
              )}
            </div>
            <Badge variant="outline" className={sessionTypes.find(t => t.value === sessionType)?.color}>
              {sessionTypes.find(t => t.value === sessionType)?.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Session Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Type
            </label>
            <div className="flex flex-wrap gap-2">
              {sessionTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSessionType(type.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    sessionType === type.value
                      ? type.color + " ring-2 ring-offset-1 ring-indigo-400"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date, Time, Duration */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="h-4 w-4 inline mr-1" />
                Date
              </label>
              <input
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="h-4 w-4 inline mr-1" />
                Start Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (min)
              </label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {[15, 20, 25, 30, 45, 60, 90].map((mins) => (
                  <option key={mins} value={mins}>{mins} minutes</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <select
                value={sessionFormat}
                onChange={(e) => setSessionFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {sessionFormats.map((format) => (
                  <option key={format.value} value={format.value}>{format.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setLocation(loc.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    location === loc.value
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Goals Addressed */}
      {existingGoals.length > 0 && (
        <Card>
          <CardHeader className="border-b">
            <h3 className="font-semibold flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Goals Addressed
            </h3>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-2">
              {existingGoals.map((goal) => (
                <button
                  key={goal.id}
                  onClick={() => toggleGoal(goal.id)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    selectedGoals.includes(goal.id)
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {selectedGoals.includes(goal.id) && (
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    )}
                    <Badge variant="outline">{goal.goalArea}</Badge>
                    <span className="text-sm">{goal.shortDescription}</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Learner Status */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Learner Status</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Mood */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Learner Mood
            </label>
            <div className="flex flex-wrap gap-2">
              {moods.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMood(m.value)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    mood === m.value
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Engagement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Engagement Level (1-5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => setEngagementRating(rating)}
                  className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                    engagementRating === rating
                      ? "bg-indigo-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Low engagement</span>
              <span>High engagement</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities & Materials */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Activities & Materials</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Activities */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activities Completed
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {commonActivities.map((activity) => (
                <button
                  key={activity}
                  onClick={() => toggleActivity(activity)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    activities.includes(activity)
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {activity}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customActivity}
                onChange={(e) => setCustomActivity(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && addCustomActivity()}
                placeholder="Add custom activity..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addCustomActivity}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          </div>

          {/* Materials */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Materials Used
            </label>
            <div className="flex flex-wrap gap-2">
              {commonMaterials.map((material) => (
                <button
                  key={material}
                  onClick={() => toggleMaterial(material)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    materials.includes(material)
                      ? "bg-theme-primary text-theme-primary-contrast"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {material}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clinical Notes */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-500" />
            Clinical Notes
          </h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Progress Notes *
            </label>
            <textarea
              value={progressNotes}
              onChange={(e) => setProgressNotes(e.target.value)}
              placeholder="Document session progress, accuracy data, learner performance..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Clinical Observations
            </label>
            <textarea
              value={clinicalObservations}
              onChange={(e) => setClinicalObservations(e.target.value)}
              placeholder="Note any clinical observations, behaviors, concerns..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Home className="h-4 w-4 inline mr-1" />
                Homework Assigned
              </label>
              <textarea
                value={homeworkAssigned}
                onChange={(e) => setHomeworkAssigned(e.target.value)}
                placeholder="Describe any homework or carryover activities..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Next Session Focus
              </label>
              <textarea
                value={nextSessionFocus}
                onChange={(e) => setNextSessionFocus(e.target.value)}
                placeholder="Plan for next session..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parent Communication
            </label>
            <textarea
              value={parentCommunication}
              onChange={(e) => setParentCommunication(e.target.value)}
              placeholder="Notes for or from parents/caregivers..."
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Billing */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Billing Information</h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-center gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CPT Code
              </label>
              <select
                value={billingCode}
                onChange={(e) => setBillingCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {billingCodes.map((code) => (
                  <option key={code.value} value={code.value}>{code.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="billable"
                checked={isBillable}
                onChange={(e) => setIsBillable(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="billable" className="text-sm font-medium text-gray-700">
                Billable Session
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSubmitting || !progressNotes.trim()}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save className="h-5 w-5" />
        {isSubmitting ? "Saving..." : "Save Session Notes"}
      </button>
    </div>
  );
}
