"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { 
  Save, BookOpen, Ear, MessageSquare,
  CheckCircle2, XCircle, HelpCircle
} from "lucide-react";

interface LanguageAssessmentFormProps {
  learnerId: string;
  sessionId?: string;
  assessmentMode: "receptive" | "expressive";
  onSave: (data: LanguageAssessmentData) => Promise<void>;
  isSubmitting?: boolean;
}

interface LanguageAssessmentData {
  learnerId: string;
  sessionId?: string;
  assessmentType: string;
  skillArea: string;
  taskDescription: string;
  // Receptive fields
  stimulusType?: string;
  totalItems?: number;
  correctItems?: number;
  responseLatencyAvgMs?: number;
  comprehensionLevel?: string;
  supportsNeeded?: string[];
  errorPatterns?: string[];
  // Expressive fields
  sampleUtterances?: string[];
  meanLengthUtterance?: number;
  vocabularyDiversity?: number;
  grammaticalAccuracy?: number;
  morphemeUsage?: Record<string, boolean>;
  sentenceStructuresUsed?: string[];
  wordFindingDifficulties?: number;
  selfCorrections?: number;
  promptsNeeded?: number;
  communicationEffectiveness?: number;
  // Common
  therapistNotes?: string;
  assessedAt: string;
}

const receptiveSkillAreas = [
  { value: "following_directions", label: "Following Directions" },
  { value: "vocabulary_comprehension", label: "Vocabulary Comprehension" },
  { value: "sentence_comprehension", label: "Sentence Comprehension" },
  { value: "paragraph_comprehension", label: "Paragraph Comprehension" },
  { value: "inferencing", label: "Inferencing" },
  { value: "auditory_memory", label: "Auditory Memory" },
  { value: "wh_questions", label: "WH-Questions" },
  { value: "concepts", label: "Basic/Temporal Concepts" },
];

const expressiveSkillAreas = [
  { value: "naming_labeling", label: "Naming/Labeling" },
  { value: "sentence_formulation", label: "Sentence Formulation" },
  { value: "narrative_skills", label: "Narrative Skills" },
  { value: "describing", label: "Describing" },
  { value: "explaining", label: "Explaining/Reasoning" },
  { value: "vocabulary_use", label: "Vocabulary Use" },
  { value: "grammar_morphology", label: "Grammar/Morphology" },
  { value: "conversational_skills", label: "Conversational Skills" },
];

const stimulusTypes = [
  { value: "verbal_only", label: "Verbal Only" },
  { value: "visual_pictures", label: "Pictures/Images" },
  { value: "objects", label: "Real Objects" },
  { value: "written", label: "Written Text" },
  { value: "story_context", label: "Story Context" },
  { value: "video", label: "Video" },
];

const comprehensionLevels = [
  { value: "WORD", label: "Word Level" },
  { value: "PHRASE", label: "Phrase Level" },
  { value: "SENTENCE", label: "Sentence Level" },
  { value: "PARAGRAPH", label: "Paragraph Level" },
  { value: "DISCOURSE", label: "Discourse Level" },
];

const supportOptions = [
  "Repetition",
  "Slower rate",
  "Visual support",
  "Gestures/pointing",
  "Simplified language",
  "Additional time",
  "Chunking information",
  "Context cues",
];

const morphemes = [
  { key: "present_progressive", label: "-ing" },
  { key: "regular_plural", label: "-s (plural)" },
  { key: "irregular_plural", label: "Irregular plural" },
  { key: "possessive", label: "'s (possessive)" },
  { key: "regular_past", label: "-ed (past)" },
  { key: "irregular_past", label: "Irregular past" },
  { key: "third_person", label: "-s (3rd person)" },
  { key: "copula_be", label: "Copula be" },
  { key: "auxiliary_be", label: "Auxiliary be" },
  { key: "articles", label: "Articles (a, the)" },
];

const sentenceStructures = [
  "Simple declarative",
  "Simple interrogative",
  "Compound sentences",
  "Complex sentences",
  "Embedded clauses",
  "Passive voice",
  "Negation",
  "Conjunctions",
];

export function LanguageAssessmentForm({
  learnerId,
  sessionId,
  assessmentMode,
  onSave,
  isSubmitting = false,
}: LanguageAssessmentFormProps) {
  const skillAreas = assessmentMode === "receptive" ? receptiveSkillAreas : expressiveSkillAreas;
  
  // Common state
  const [skillArea, setSkillArea] = useState(skillAreas[0].value);
  const [taskDescription, setTaskDescription] = useState("");
  const [therapistNotes, setTherapistNotes] = useState("");
  
  // Receptive state
  const [stimulusType, setStimulusType] = useState("verbal_only");
  const [totalItems, setTotalItems] = useState<number>(10);
  const [correctItems, setCorrectItems] = useState<number>(0);
  const [comprehensionLevel, setComprehensionLevel] = useState("SENTENCE");
  const [selectedSupports, setSelectedSupports] = useState<string[]>([]);
  const [errorPatterns, setErrorPatterns] = useState("");
  
  // Expressive state
  const [utterances, setUtterances] = useState<string[]>([]);
  const [newUtterance, setNewUtterance] = useState("");
  const [vocabularyDiversity, setVocabularyDiversity] = useState<number>(50);
  const [grammaticalAccuracy, setGrammaticalAccuracy] = useState<number>(50);
  const [morphemeUsage, setMorphemeUsage] = useState<Record<string, boolean>>({});
  const [selectedStructures, setSelectedStructures] = useState<string[]>([]);
  const [wordFindingDifficulties, setWordFindingDifficulties] = useState<number>(0);
  const [selfCorrections, setSelfCorrections] = useState<number>(0);
  const [promptsNeeded, setPromptsNeeded] = useState<number>(0);
  const [communicationEffectiveness, setCommunicationEffectiveness] = useState<number>(3);

  const toggleSupport = useCallback((support: string) => {
    setSelectedSupports(prev =>
      prev.includes(support)
        ? prev.filter(s => s !== support)
        : [...prev, support]
    );
  }, []);

  const toggleStructure = useCallback((structure: string) => {
    setSelectedStructures(prev =>
      prev.includes(structure)
        ? prev.filter(s => s !== structure)
        : [...prev, structure]
    );
  }, []);

  const toggleMorpheme = useCallback((key: string) => {
    setMorphemeUsage(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const addUtterance = useCallback(() => {
    if (newUtterance.trim()) {
      setUtterances(prev => [...prev, newUtterance.trim()]);
      setNewUtterance("");
    }
  }, [newUtterance]);

  const removeUtterance = useCallback((index: number) => {
    setUtterances(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Calculate MLU from utterances
  const calculatedMLU = utterances.length > 0
    ? (utterances.reduce((sum, u) => sum + u.split(/\s+/).length, 0) / utterances.length).toFixed(2)
    : null;

  const handleSave = useCallback(async () => {
    const baseData = {
      learnerId,
      sessionId,
      assessmentType: assessmentMode === "receptive" ? "INFORMAL_RECEPTIVE" : "INFORMAL_EXPRESSIVE",
      skillArea,
      taskDescription,
      therapistNotes,
      assessedAt: new Date().toISOString(),
    };

    let data: LanguageAssessmentData;

    if (assessmentMode === "receptive") {
      data = {
        ...baseData,
        stimulusType,
        totalItems,
        correctItems,
        comprehensionLevel,
        supportsNeeded: selectedSupports,
        errorPatterns: errorPatterns.split("\n").filter(p => p.trim()),
      };
    } else {
      data = {
        ...baseData,
        sampleUtterances: utterances,
        meanLengthUtterance: calculatedMLU ? parseFloat(calculatedMLU) : undefined,
        vocabularyDiversity,
        grammaticalAccuracy,
        morphemeUsage,
        sentenceStructuresUsed: selectedStructures,
        wordFindingDifficulties,
        selfCorrections,
        promptsNeeded,
        communicationEffectiveness,
      };
    }

    await onSave(data);
  }, [
    learnerId, sessionId, assessmentMode, skillArea, taskDescription, therapistNotes,
    stimulusType, totalItems, correctItems, comprehensionLevel, selectedSupports, errorPatterns,
    utterances, calculatedMLU, vocabularyDiversity, grammaticalAccuracy, morphemeUsage,
    selectedStructures, wordFindingDifficulties, selfCorrections, promptsNeeded,
    communicationEffectiveness, onSave
  ]);

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {assessmentMode === "receptive" ? (
                <Ear className="h-5 w-5 text-blue-500" />
              ) : (
                <MessageSquare className="h-5 w-5 text-green-500" />
              )}
              {assessmentMode === "receptive" ? "Receptive" : "Expressive"} Language Assessment
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {assessmentMode === "receptive" 
                ? "Assess comprehension and understanding skills"
                : "Assess verbal expression and language production"}
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {assessmentMode}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Skill Area Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skill Area
          </label>
          <select
            value={skillArea}
            onChange={(e) => setSkillArea(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {skillAreas.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}
              </option>
            ))}
          </select>
        </div>

        {/* Task Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Task Description
          </label>
          <textarea
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            placeholder="Describe the assessment task..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Receptive-specific fields */}
        {assessmentMode === "receptive" && (
          <>
            {/* Stimulus Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stimulus Type
              </label>
              <div className="flex flex-wrap gap-2">
                {stimulusTypes.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => setStimulusType(type.value)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      stimulusType === type.value
                        ? "bg-blue-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Comprehension Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comprehension Level Assessed
              </label>
              <select
                value={comprehensionLevel}
                onChange={(e) => setComprehensionLevel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {comprehensionLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Scoring */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Items
                </label>
                <input
                  type="number"
                  value={totalItems}
                  onChange={(e) => setTotalItems(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Items
                </label>
                <input
                  type="number"
                  value={correctItems}
                  onChange={(e) => setCorrectItems(parseInt(e.target.value) || 0)}
                  min="0"
                  max={totalItems}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Accuracy Display */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
              <div className="text-sm text-blue-600 mb-1">Accuracy</div>
              <div className="text-3xl font-bold text-blue-700">
                {totalItems > 0 ? Math.round((correctItems / totalItems) * 100) : 0}%
              </div>
              <div className="text-xs text-blue-500">
                {correctItems} / {totalItems} correct
              </div>
            </div>

            {/* Supports Needed */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Supports Needed
              </label>
              <div className="flex flex-wrap gap-2">
                {supportOptions.map((support) => (
                  <button
                    key={support}
                    onClick={() => toggleSupport(support)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedSupports.includes(support)
                        ? "bg-orange-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {support}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Patterns */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Error Patterns (one per line)
              </label>
              <textarea
                value={errorPatterns}
                onChange={(e) => setErrorPatterns(e.target.value)}
                placeholder="Describe observed error patterns..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </>
        )}

        {/* Expressive-specific fields */}
        {assessmentMode === "expressive" && (
          <>
            {/* Sample Utterances */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sample Utterances (for MLU calculation)
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newUtterance}
                  onChange={(e) => setNewUtterance(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addUtterance()}
                  placeholder="Type utterance and press Enter..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  onClick={addUtterance}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Add
                </button>
              </div>
              {utterances.length > 0 && (
                <div className="border rounded-lg divide-y max-h-40 overflow-y-auto">
                  {utterances.map((utterance, idx) => (
                    <div key={idx} className="px-3 py-2 flex items-center justify-between">
                      <span className="text-sm">{utterance}</span>
                      <button
                        onClick={() => removeUtterance(idx)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <XCircle className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {calculatedMLU && (
                <div className="mt-2 text-sm text-green-600">
                  Calculated MLU: <strong>{calculatedMLU}</strong> morphemes
                </div>
              )}
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vocabulary Diversity (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={vocabularyDiversity}
                  onChange={(e) => setVocabularyDiversity(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{vocabularyDiversity}%</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grammatical Accuracy (0-100)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={grammaticalAccuracy}
                  onChange={(e) => setGrammaticalAccuracy(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-sm text-gray-600">{grammaticalAccuracy}%</div>
              </div>
            </div>

            {/* Morpheme Usage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Morpheme Usage
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {morphemes.map((morpheme) => (
                  <button
                    key={morpheme.key}
                    onClick={() => toggleMorpheme(morpheme.key)}
                    className={`px-3 py-2 rounded-lg text-sm text-left transition-all ${
                      morphemeUsage[morpheme.key]
                        ? "bg-green-100 border-2 border-green-500 text-green-800"
                        : "bg-gray-100 border-2 border-transparent text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {morphemeUsage[morpheme.key] ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <HelpCircle className="h-4 w-4 text-gray-400" />
                      )}
                      {morpheme.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Sentence Structures */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sentence Structures Used
              </label>
              <div className="flex flex-wrap gap-2">
                {sentenceStructures.map((structure) => (
                  <button
                    key={structure}
                    onClick={() => toggleStructure(structure)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      selectedStructures.includes(structure)
                        ? "bg-theme-primary text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {structure}
                  </button>
                ))}
              </div>
            </div>

            {/* Counts */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Word-Finding Issues
                </label>
                <input
                  type="number"
                  value={wordFindingDifficulties}
                  onChange={(e) => setWordFindingDifficulties(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Self-Corrections
                </label>
                <input
                  type="number"
                  value={selfCorrections}
                  onChange={(e) => setSelfCorrections(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prompts Needed
                </label>
                <input
                  type="number"
                  value={promptsNeeded}
                  onChange={(e) => setPromptsNeeded(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* Communication Effectiveness */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Communication Effectiveness (1-5)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    onClick={() => setCommunicationEffectiveness(rating)}
                    className={`flex-1 py-3 rounded-lg font-bold transition-all ${
                      communicationEffectiveness === rating
                        ? "bg-green-500 text-white"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {rating}
                  </button>
                ))}
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Not effective</span>
                <span>Highly effective</span>
              </div>
            </div>
          </>
        )}

        {/* Therapist Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Therapist Notes
          </label>
          <textarea
            value={therapistNotes}
            onChange={(e) => setTherapistNotes(e.target.value)}
            placeholder="Additional observations and notes..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={isSubmitting || !taskDescription.trim()}
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="h-5 w-5" />
            {isSubmitting ? "Saving..." : "Save Assessment"}
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
