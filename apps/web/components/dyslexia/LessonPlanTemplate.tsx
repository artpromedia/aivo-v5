'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import {
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  Circle,
  Save,
  Download,
  Eye,
  Hand,
  Volume2,
  Sparkles,
  Printer,
} from 'lucide-react';

// Types matching Prisma enums
type DyslexiaLessonType =
  | 'PHONEMIC_AWARENESS'
  | 'PHONICS_DECODING'
  | 'SIGHT_WORDS'
  | 'FLUENCY'
  | 'VOCABULARY'
  | 'COMPREHENSION'
  | 'SPELLING'
  | 'WRITING'
  | 'MULTISENSORY_REVIEW';

type SensoryModality = 'VISUAL' | 'AUDITORY' | 'KINESTHETIC' | 'TACTILE' | 'MULTISENSORY_VAKT';

interface LessonPlan {
  id?: string;
  title: string;
  lessonType: DyslexiaLessonType;
  targetSkills: string[];
  duration: number;
  objectives: string[];
  materials: string[];
  modalitiesUsed: SensoryModality[];
  warmUp: string;
  introduction: string;
  guidedPractice: string;
  independentPractice: string;
  multisensoryActivities: string[];
  review: string;
  assessment: string;
  differentiation: string;
  notes?: string;
}

interface LessonPlanTemplateProps {
  profileId?: string;
  initialLesson?: Partial<LessonPlan>;
  onSave: (lesson: LessonPlan) => void;
  onExport?: (lesson: LessonPlan) => void;
}

const LESSON_TYPE_CONFIG: Record<
  DyslexiaLessonType,
  { label: string; color: string; defaultDuration: number }
> = {
  PHONEMIC_AWARENESS: {
    label: 'Phonemic Awareness',
    color: 'bg-theme-primary/10 text-theme-primary',
    defaultDuration: 15,
  },
  PHONICS_DECODING: {
    label: 'Phonics & Decoding',
    color: 'bg-blue-100 text-blue-700',
    defaultDuration: 20,
  },
  SIGHT_WORDS: { label: 'Sight Words', color: 'bg-green-100 text-green-700', defaultDuration: 10 },
  FLUENCY: {
    label: 'Fluency Practice',
    color: 'bg-orange-100 text-orange-700',
    defaultDuration: 15,
  },
  VOCABULARY: { label: 'Vocabulary', color: 'bg-teal-100 text-teal-700', defaultDuration: 15 },
  COMPREHENSION: {
    label: 'Comprehension',
    color: 'bg-indigo-100 text-indigo-700',
    defaultDuration: 20,
  },
  SPELLING: { label: 'Spelling', color: 'bg-pink-100 text-pink-700', defaultDuration: 15 },
  WRITING: { label: 'Writing', color: 'bg-amber-100 text-amber-700', defaultDuration: 20 },
  MULTISENSORY_REVIEW: {
    label: 'Multisensory Review',
    color: 'bg-rose-100 text-rose-700',
    defaultDuration: 30,
  },
};

const MODALITY_CONFIG: Record<SensoryModality, { icon: React.ReactNode; label: string }> = {
  VISUAL: { icon: <Eye className="h-4 w-4" />, label: 'Visual' },
  AUDITORY: { icon: <Volume2 className="h-4 w-4" />, label: 'Auditory' },
  KINESTHETIC: { icon: <Hand className="h-4 w-4" />, label: 'Kinesthetic' },
  TACTILE: { icon: <Hand className="h-4 w-4" />, label: 'Tactile' },
  MULTISENSORY_VAKT: { icon: <Sparkles className="h-4 w-4" />, label: 'VAKT Combined' },
};

// Orton-Gillingham lesson structure template
const OG_LESSON_TEMPLATE: Partial<LessonPlan> = {
  warmUp: 'Review previously learned concepts with quick drill (2-3 minutes)',
  introduction:
    'Introduce new concept with explicit instruction using visual, auditory, and kinesthetic channels',
  guidedPractice: 'Practice new skill with teacher support, immediate corrective feedback',
  independentPractice: 'Student practices independently while teacher observes',
  multisensoryActivities: [
    'Sky writing - trace letters in the air while saying the sound',
    'Sand/salt tray - write letters while saying the sound',
    'Arm tapping - tap syllables on arm while saying word',
    'Sound boxes - push tokens into boxes for each sound',
  ],
  review: 'Review all concepts covered in the lesson',
  assessment: 'Quick check for understanding - have student demonstrate skill independently',
  differentiation:
    'Adjust pacing, provide additional multisensory supports, reduce number of new concepts if needed',
};

const DEFAULT_LESSON: LessonPlan = {
  title: '',
  lessonType: 'PHONICS_DECODING',
  targetSkills: [],
  duration: 20,
  objectives: [''],
  materials: ['Whiteboard', 'Letter tiles', 'Decodable text'],
  modalitiesUsed: ['VISUAL', 'AUDITORY', 'KINESTHETIC'],
  warmUp: OG_LESSON_TEMPLATE.warmUp || '',
  introduction: OG_LESSON_TEMPLATE.introduction || '',
  guidedPractice: OG_LESSON_TEMPLATE.guidedPractice || '',
  independentPractice: OG_LESSON_TEMPLATE.independentPractice || '',
  multisensoryActivities: OG_LESSON_TEMPLATE.multisensoryActivities || [],
  review: OG_LESSON_TEMPLATE.review || '',
  assessment: OG_LESSON_TEMPLATE.assessment || '',
  differentiation: OG_LESSON_TEMPLATE.differentiation || '',
  notes: '',
};

export function LessonPlanTemplate({
  profileId: _profileId,
  initialLesson,
  onSave,
  onExport,
}: LessonPlanTemplateProps) {
  const [lesson, setLesson] = useState<LessonPlan>({
    ...DEFAULT_LESSON,
    ...initialLesson,
  });
  const [newObjective, setNewObjective] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newActivity, setNewActivity] = useState('');

  const updateLesson = (updates: Partial<LessonPlan>) => {
    setLesson((prev) => ({ ...prev, ...updates }));
  };

  const addToList = (
    field: 'objectives' | 'targetSkills' | 'materials' | 'multisensoryActivities',
    value: string,
    clearFn: (val: string) => void,
  ) => {
    if (value.trim()) {
      updateLesson({ [field]: [...lesson[field], value.trim()] });
      clearFn('');
    }
  };

  const removeFromList = (
    field: 'objectives' | 'targetSkills' | 'materials' | 'multisensoryActivities',
    index: number,
  ) => {
    updateLesson({ [field]: lesson[field].filter((_, i) => i !== index) });
  };

  const toggleModality = (modality: SensoryModality) => {
    const current = lesson.modalitiesUsed;
    if (current.includes(modality)) {
      updateLesson({ modalitiesUsed: current.filter((m) => m !== modality) });
    } else {
      updateLesson({ modalitiesUsed: [...current, modality] });
    }
  };

  const handleSave = () => {
    onSave(lesson);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Orton-Gillingham Lesson Plan
              </CardTitle>
              <CardDescription>Create structured, multisensory literacy lessons</CardDescription>
            </div>
            <div className="flex gap-2">
              {onExport && (
                <Button variant="outline" onClick={() => onExport(lesson)}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
              <Button variant="outline">
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save Lesson
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lesson Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="lesson-title" className="text-sm font-medium mb-2 block">
                Lesson Title
              </label>
              <Input
                id="lesson-title"
                placeholder="e.g., Introduction to Long A Vowel Teams"
                value={lesson.title}
                onChange={(e) => updateLesson({ title: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="lesson-duration" className="text-sm font-medium mb-2 block">
                Duration (minutes)
              </label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  id="lesson-duration"
                  type="number"
                  min={5}
                  max={120}
                  value={lesson.duration}
                  onChange={(e) => updateLesson({ duration: parseInt(e.target.value) || 20 })}
                  className="w-24"
                />
              </div>
            </div>
          </div>

          <div>
            <span className="text-sm font-medium mb-2 block">Lesson Type</span>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(LESSON_TYPE_CONFIG) as DyslexiaLessonType[]).map((type) => (
                <Badge
                  key={type}
                  variant={lesson.lessonType === type ? 'default' : 'outline'}
                  className={`cursor-pointer ${lesson.lessonType === type ? LESSON_TYPE_CONFIG[type].color : ''}`}
                  onClick={() =>
                    updateLesson({
                      lessonType: type,
                      duration: LESSON_TYPE_CONFIG[type].defaultDuration,
                    })
                  }
                >
                  {LESSON_TYPE_CONFIG[type].label}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <span className="text-sm font-medium mb-2 block">Modalities Used</span>
            <div className="flex flex-wrap gap-3">
              {(Object.keys(MODALITY_CONFIG) as SensoryModality[]).map((modality) => (
                <button
                  type="button"
                  key={modality}
                  className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                    lesson.modalitiesUsed.includes(modality)
                      ? 'bg-blue-50 border-blue-300'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => toggleModality(modality)}
                >
                  {lesson.modalitiesUsed.includes(modality) ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Circle className="h-4 w-4 text-muted-foreground" />
                  )}
                  {MODALITY_CONFIG[modality].icon}
                  <span className="text-sm">{MODALITY_CONFIG[modality].label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Objectives and Skills */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Learning Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add objective..."
                value={newObjective}
                onChange={(e) => setNewObjective(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && addToList('objectives', newObjective, setNewObjective)
                }
              />
              <Button
                size="sm"
                onClick={() => addToList('objectives', newObjective, setNewObjective)}
              >
                Add
              </Button>
            </div>
            <ul className="space-y-2">
              {lesson.objectives
                .filter((o) => o)
                .map((objective, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600 flex-shrink-0" />
                    <span className="flex-1">{objective}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromList('objectives', idx)}
                    >
                      ×
                    </Button>
                  </li>
                ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Target Skills</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Add skill..."
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyPress={(e) =>
                  e.key === 'Enter' && addToList('targetSkills', newSkill, setNewSkill)
                }
              />
              <Button size="sm" onClick={() => addToList('targetSkills', newSkill, setNewSkill)}>
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {lesson.targetSkills.map((skill, idx) => (
                <Badge key={idx} variant="outline" className="pr-1">
                  {skill}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-4 w-4 p-0 ml-1"
                    onClick={() => removeFromList('targetSkills', idx)}
                  >
                    ×
                  </Button>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Materials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Materials Needed</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add material..."
              value={newMaterial}
              onChange={(e) => setNewMaterial(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' && addToList('materials', newMaterial, setNewMaterial)
              }
            />
            <Button size="sm" onClick={() => addToList('materials', newMaterial, setNewMaterial)}>
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {lesson.materials.map((material, idx) => (
              <Badge key={idx} variant="outline" className="pr-1">
                {material}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 ml-1"
                  onClick={() => removeFromList('materials', idx)}
                >
                  ×
                </Button>
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lesson Structure */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Lesson Structure (Orton-Gillingham Format)</CardTitle>
          <CardDescription>
            Follow the systematic, sequential structure for effective instruction
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-theme-primary/10 text-theme-primary text-xs flex items-center justify-center">
                  1
                </span>
                Warm-Up / Review (2-3 min)
              </span>
              <Textarea
                placeholder="Quick review of previously learned concepts..."
                value={lesson.warmUp}
                onChange={(e) => updateLesson({ warmUp: e.target.value })}
                rows={2}
              />
            </div>

            <div>
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center">
                  2
                </span>
                Introduction / Direct Instruction
              </span>
              <Textarea
                placeholder="Introduce new concept with explicit instruction..."
                value={lesson.introduction}
                onChange={(e) => updateLesson({ introduction: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-green-100 text-green-700 text-xs flex items-center justify-center">
                  3
                </span>
                Guided Practice
              </span>
              <Textarea
                placeholder="Practice with teacher support and feedback..."
                value={lesson.guidedPractice}
                onChange={(e) => updateLesson({ guidedPractice: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-orange-100 text-orange-700 text-xs flex items-center justify-center">
                  4
                </span>
                Independent Practice
              </span>
              <Textarea
                placeholder="Student practices independently..."
                value={lesson.independentPractice}
                onChange={(e) => updateLesson({ independentPractice: e.target.value })}
                rows={3}
              />
            </div>

            <div>
              <span className="text-sm font-medium mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-700 text-xs flex items-center justify-center">
                  5
                </span>
                Review / Closure
              </span>
              <Textarea
                placeholder="Review all concepts covered..."
                value={lesson.review}
                onChange={(e) => updateLesson({ review: e.target.value })}
                rows={2}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Multisensory Activities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-pink-600" />
            Multisensory Activities
          </CardTitle>
          <CardDescription>
            VAKT (Visual, Auditory, Kinesthetic, Tactile) activities to reinforce learning
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Add multisensory activity..."
              value={newActivity}
              onChange={(e) => setNewActivity(e.target.value)}
              onKeyPress={(e) =>
                e.key === 'Enter' &&
                addToList('multisensoryActivities', newActivity, setNewActivity)
              }
            />
            <Button
              size="sm"
              onClick={() => addToList('multisensoryActivities', newActivity, setNewActivity)}
            >
              Add
            </Button>
          </div>
          <ul className="space-y-2">
            {lesson.multisensoryActivities.map((activity, idx) => (
              <li key={idx} className="flex items-start gap-2 p-2 bg-muted rounded-lg text-sm">
                <Sparkles className="h-4 w-4 mt-0.5 text-pink-600 flex-shrink-0" />
                <span className="flex-1">{activity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFromList('multisensoryActivities', idx)}
                >
                  ×
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Assessment and Differentiation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How will you assess student understanding?"
              value={lesson.assessment}
              onChange={(e) => updateLesson({ assessment: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Differentiation</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="How will you adapt for different learner needs?"
              value={lesson.differentiation}
              onChange={(e) => updateLesson({ differentiation: e.target.value })}
              rows={4}
            />
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Any additional notes, observations, or reminders..."
            value={lesson.notes}
            onChange={(e) => updateLesson({ notes: e.target.value })}
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export default LessonPlanTemplate;
