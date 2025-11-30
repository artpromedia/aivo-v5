"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, Volume2, Mic, Activity,
  AlertTriangle, Droplets, Wind
} from "lucide-react";

interface VoiceAssessmentFormProps {
  learnerId: string;
  sessionId?: string;
  onSave: (data: VoiceAssessmentData) => Promise<void>;
  isSubmitting?: boolean;
}

interface VoiceAssessmentData {
  learnerId: string;
  sessionId?: string;
  assessmentType: string;
  pitchLevel?: string;
  loudnessLevel?: string;
  voiceQuality?: string;
  resonance?: string;
  maximumPhonationTime?: number;
  szRatio?: number;
  habitualPitchHz?: number;
  pitchRangeLowHz?: number;
  pitchRangeHighHz?: number;
  jitterPercent?: number;
  shimmerPercent?: number;
  harmonicNoiseRatio?: number;
  vocalAbuseBehaviors?: string[];
  hydrationRating?: number;
  vocalHygieneCompliance?: number;
  strainRating?: number;
  breathinessRating?: number;
  hoarsenessRating?: number;
  therapistNotes?: string;
  assessedAt: string;
}

const pitchLevels = [
  { value: "TOO_LOW", label: "Too Low" },
  { value: "LOW", label: "Low" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "High" },
  { value: "TOO_HIGH", label: "Too High" },
];

const loudnessLevels = [
  { value: "TOO_SOFT", label: "Too Soft" },
  { value: "SOFT", label: "Soft" },
  { value: "NORMAL", label: "Normal" },
  { value: "LOUD", label: "Loud" },
  { value: "TOO_LOUD", label: "Too Loud" },
];

const voiceQualities = [
  { value: "NORMAL", label: "Normal", description: "Clear voice quality" },
  { value: "HOARSE", label: "Hoarse", description: "Rough, raspy quality" },
  { value: "BREATHY", label: "Breathy", description: "Air escape during phonation" },
  { value: "STRAINED", label: "Strained", description: "Effortful, tense quality" },
  { value: "HARSH", label: "Harsh", description: "Unpleasant, grating quality" },
  { value: "TREMULOUS", label: "Tremulous", description: "Shaky, wavering voice" },
];

const resonanceTypes = [
  { value: "NORMAL", label: "Normal" },
  { value: "HYPERNASAL", label: "Hypernasal", description: "Too much nasal resonance" },
  { value: "HYPONASAL", label: "Hyponasal", description: "Too little nasal resonance" },
  { value: "CUL_DE_SAC", label: "Cul-de-sac", description: "Muffled quality" },
  { value: "MIXED", label: "Mixed", description: "Variable resonance" },
];

const vocalAbuseBehaviors = [
  "Yelling/screaming",
  "Throat clearing",
  "Coughing",
  "Talking over noise",
  "Whispering",
  "Excessive talking",
  "Singing without warmup",
  "Straining to talk",
  "Caffeine intake",
  "Dehydration",
  "Smoking/vaping",
  "Acid reflux",
];

const assessmentTypes = [
  { value: "PERCEPTUAL", label: "Perceptual Assessment" },
  { value: "ACOUSTIC", label: "Acoustic Analysis" },
  { value: "AERODYNAMIC", label: "Aerodynamic Measures" },
  { value: "BASELINE", label: "Baseline Evaluation" },
  { value: "PROGRESS", label: "Progress Check" },
];

export function VoiceAssessmentForm({
  learnerId,
  sessionId,
  onSave,
  isSubmitting = false,
}: VoiceAssessmentFormProps) {
  // Assessment type
  const [assessmentType, setAssessmentType] = useState("PERCEPTUAL");
  
  // Perceptual measures
  const [pitchLevel, setPitchLevel] = useState("NORMAL");
  const [loudnessLevel, setLoudnessLevel] = useState("NORMAL");
  const [voiceQuality, setVoiceQuality] = useState("NORMAL");
  const [resonance, setResonance] = useState("NORMAL");
  
  // Acoustic measures
  const [mpt, setMpt] = useState<number | undefined>();
  const [sValue, setSValue] = useState<number | undefined>();
  const [zValue, setZValue] = useState<number | undefined>();
  const [habitualPitch, setHabitualPitch] = useState<number | undefined>();
  const [pitchLow, setPitchLow] = useState<number | undefined>();
  const [pitchHigh, setPitchHigh] = useState<number | undefined>();
  const [jitter, setJitter] = useState<number | undefined>();
  const [shimmer, setShimmer] = useState<number | undefined>();
  const [hnr, setHnr] = useState<number | undefined>();
  
  // Quality ratings (0-10 scale)
  const [strainRating, setStrainRating] = useState<number>(0);
  const [breathinessRating, setBreathinessRating] = useState<number>(0);
  const [hoarsenessRating, setHoarsenessRating] = useState<number>(0);
  
  // Vocal hygiene
  const [selectedAbuseBehaviors, setSelectedAbuseBehaviors] = useState<string[]>([]);
  const [hydrationRating, setHydrationRating] = useState<number>(5);
  const [hygieneCompliance, setHygieneCompliance] = useState<number>(50);
  
  // Notes
  const [therapistNotes, setTherapistNotes] = useState("");

  // Calculate S/Z ratio
  const szRatio = sValue && zValue && zValue > 0 
    ? (sValue / zValue).toFixed(2) 
    : null;

  const toggleAbuseBehavior = useCallback((behavior: string) => {
    setSelectedAbuseBehaviors(prev =>
      prev.includes(behavior)
        ? prev.filter(b => b !== behavior)
        : [...prev, behavior]
    );
  }, []);

  const handleSave = useCallback(async () => {
    const data: VoiceAssessmentData = {
      learnerId,
      sessionId,
      assessmentType,
      pitchLevel,
      loudnessLevel,
      voiceQuality,
      resonance,
      maximumPhonationTime: mpt,
      szRatio: szRatio ? parseFloat(szRatio) : undefined,
      habitualPitchHz: habitualPitch,
      pitchRangeLowHz: pitchLow,
      pitchRangeHighHz: pitchHigh,
      jitterPercent: jitter,
      shimmerPercent: shimmer,
      harmonicNoiseRatio: hnr,
      vocalAbuseBehaviors: selectedAbuseBehaviors,
      hydrationRating,
      vocalHygieneCompliance: hygieneCompliance,
      strainRating,
      breathinessRating,
      hoarsenessRating,
      therapistNotes,
      assessedAt: new Date().toISOString(),
    };

    await onSave(data);
  }, [
    learnerId, sessionId, assessmentType, pitchLevel, loudnessLevel, voiceQuality,
    resonance, mpt, szRatio, habitualPitch, pitchLow, pitchHigh, jitter, shimmer,
    hnr, selectedAbuseBehaviors, hydrationRating, hygieneCompliance, strainRating,
    breathinessRating, hoarsenessRating, therapistNotes, onSave
  ]);

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Assessment Type */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Volume2 className="h-5 w-5 text-teal-500" />
            Voice Assessment
          </h3>
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-2">
            {assessmentTypes.map((type) => (
              <button
                key={type.value}
                onClick={() => setAssessmentType(type.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  assessmentType === type.value
                    ? "bg-teal-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Perceptual Assessment */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold">Perceptual Assessment</h3>
        </CardHeader>
        <CardContent className="p-4 space-y-6">
          {/* Pitch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pitch Level
            </label>
            <div className="flex gap-2">
              {pitchLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setPitchLevel(level.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    pitchLevel === level.value
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Loudness */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Loudness Level
            </label>
            <div className="flex gap-2">
              {loudnessLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => setLoudnessLevel(level.value)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    loudnessLevel === level.value
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          {/* Voice Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Voice Quality
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {voiceQualities.map((quality) => (
                <button
                  key={quality.value}
                  onClick={() => setVoiceQuality(quality.value)}
                  className={`p-3 rounded-lg text-left transition-all border-2 ${
                    voiceQuality === quality.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{quality.label}</div>
                  {quality.description && (
                    <div className="text-xs text-gray-500">{quality.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Resonance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resonance
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {resonanceTypes.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setResonance(type.value)}
                  className={`p-3 rounded-lg text-left transition-all border-2 ${
                    resonance === type.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  {type.description && (
                    <div className="text-xs text-gray-500">{type.description}</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Quality Ratings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Strain (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={strainRating}
                onChange={(e) => setStrainRating(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-medium">{strainRating}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Breathiness (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={breathinessRating}
                onChange={(e) => setBreathinessRating(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-medium">{breathinessRating}</div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hoarseness (0-10)
              </label>
              <input
                type="range"
                min="0"
                max="10"
                value={hoarsenessRating}
                onChange={(e) => setHoarsenessRating(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-center text-sm font-medium">{hoarsenessRating}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Acoustic/Aerodynamic Measures */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-500" />
            Acoustic & Aerodynamic Measures
          </h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* MPT and S/Z Ratio */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                MPT (seconds)
              </label>
              <input
                type="number"
                value={mpt || ""}
                onChange={(e) => setMpt(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.1"
                placeholder="e.g., 15.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                /s/ Duration (sec)
              </label>
              <input
                type="number"
                value={sValue || ""}
                onChange={(e) => setSValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.1"
                placeholder="e.g., 12"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                /z/ Duration (sec)
              </label>
              <input
                type="number"
                value={zValue || ""}
                onChange={(e) => setZValue(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.1"
                placeholder="e.g., 10"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* S/Z Ratio Display */}
          {szRatio && (
            <div className={`p-4 rounded-lg ${parseFloat(szRatio) > 1.4 ? 'bg-orange-50 border border-orange-200' : 'bg-green-50 border border-green-200'}`}>
              <div className="flex items-center gap-2">
                {parseFloat(szRatio) > 1.4 && <AlertTriangle className="h-5 w-5 text-orange-500" />}
                <span className="font-medium">S/Z Ratio: {szRatio}</span>
                <span className="text-sm text-gray-600">
                  {parseFloat(szRatio) > 1.4 
                    ? "(May indicate laryngeal pathology)"
                    : "(Within normal limits)"}
                </span>
              </div>
            </div>
          )}

          {/* Pitch Measures */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Habitual Pitch (Hz)
              </label>
              <input
                type="number"
                value={habitualPitch || ""}
                onChange={(e) => setHabitualPitch(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 120"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Range Low (Hz)
              </label>
              <input
                type="number"
                value={pitchLow || ""}
                onChange={(e) => setPitchLow(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 80"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pitch Range High (Hz)
              </label>
              <input
                type="number"
                value={pitchHigh || ""}
                onChange={(e) => setPitchHigh(e.target.value ? parseInt(e.target.value) : undefined)}
                placeholder="e.g., 250"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Perturbation Measures */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jitter (%)
              </label>
              <input
                type="number"
                value={jitter || ""}
                onChange={(e) => setJitter(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.01"
                placeholder="e.g., 0.5"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Shimmer (%)
              </label>
              <input
                type="number"
                value={shimmer || ""}
                onChange={(e) => setShimmer(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.01"
                placeholder="e.g., 3.0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HNR (dB)
              </label>
              <input
                type="number"
                value={hnr || ""}
                onChange={(e) => setHnr(e.target.value ? parseFloat(e.target.value) : undefined)}
                step="0.1"
                placeholder="e.g., 20"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vocal Hygiene */}
      <Card>
        <CardHeader className="border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <Droplets className="h-5 w-5 text-cyan-500" />
            Vocal Hygiene Assessment
          </h3>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Hydration */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hydration Level (1-10)
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={hydrationRating}
              onChange={(e) => setHydrationRating(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Poor</span>
              <span className="font-medium text-sm">{hydrationRating}/10</span>
              <span>Excellent</span>
            </div>
          </div>

          {/* Compliance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vocal Hygiene Compliance (%)
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={hygieneCompliance}
              onChange={(e) => setHygieneCompliance(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="text-center text-sm font-medium">{hygieneCompliance}%</div>
          </div>

          {/* Vocal Abuse Behaviors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Vocal Abuse/Misuse Behaviors Reported
            </label>
            <div className="flex flex-wrap gap-2">
              {vocalAbuseBehaviors.map((behavior) => (
                <button
                  key={behavior}
                  onClick={() => toggleAbuseBehavior(behavior)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    selectedAbuseBehaviors.includes(behavior)
                      ? "bg-red-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {behavior}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Therapist Notes */}
      <Card>
        <CardContent className="p-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Therapist Notes
          </label>
          <textarea
            value={therapistNotes}
            onChange={(e) => setTherapistNotes(e.target.value)}
            placeholder="Additional observations, recommendations, treatment notes..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </CardContent>
      </Card>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isSubmitting}
        className="w-full py-3 bg-teal-600 text-white rounded-lg font-semibold hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Save className="h-5 w-5" />
        {isSubmitting ? "Saving..." : "Save Voice Assessment"}
      </button>
    </div>
  );
}
