"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Badge } from "@/components/ui/Badge";
import { 
  BookOpen, 
  Save, 
  Plus, 
  X, 
  GripVertical,
  AlertTriangle,
  Check,
  Image,
} from "lucide-react";
import { cn } from "@/lib/utils";

const Label = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <label className={`text-sm font-medium leading-none ${className || ''}`}>
    {children}
  </label>
);

export type SocialStorySentenceType = 
  | "DESCRIPTIVE"
  | "PERSPECTIVE"
  | "DIRECTIVE"
  | "AFFIRMATIVE"
  | "CONTROL"
  | "COOPERATIVE";

export interface SocialStorySentence {
  order: number;
  text: string;
  type: SocialStorySentenceType;
  imageUrl?: string;
  emphasis?: boolean;
}

export interface ComprehensionQuestion {
  question: string;
  correctAnswer: string;
  options?: string[];
}

export interface SocialStory {
  id: string;
  autismProfileId: string;
  title: string;
  topic: string;
  targetSituation?: string;
  targetBehavior?: string;
  sentences: SocialStorySentence[];
  descriptiveCount: number;
  perspectiveCount: number;
  directiveCount: number;
  affirmativeCount: number;
  controlCount: number;
  cooperativeCount: number;
  ratioValid: boolean;
  fontSize: string;
  showImages: boolean;
  readAloud: boolean;
  pagePerSentence: boolean;
  comprehensionQuestions?: ComprehensionQuestion[];
  isActive: boolean;
  timesRead: number;
  lastReadAt?: string;
  comprehensionScore?: number;
  behaviorImprovement?: number;
  generatedByAI: boolean;
  aiPrompt?: string;
  wasEdited: boolean;
  isSharedWithParent: boolean;
  isTemplate: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SocialStoryEditorProps {
  autismProfileId: string;
  initialStory?: Partial<SocialStory>;
  onSave: (story: Partial<SocialStory>) => Promise<void>;
  className?: string;
}

const sentenceTypes: { value: SocialStorySentenceType; label: string; color: string; description: string }[] = [
  { value: "DESCRIPTIVE", label: "Descriptive", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100", description: "Facts about the situation" },
  { value: "PERSPECTIVE", label: "Perspective", color: "bg-theme-primary/10 text-theme-primary dark:bg-theme-primary/20 dark:text-theme-primary", description: "Others' thoughts/feelings" },
  { value: "DIRECTIVE", label: "Directive", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100", description: "Suggested response" },
  { value: "AFFIRMATIVE", label: "Affirmative", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100", description: "Reassuring statements" },
  { value: "CONTROL", label: "Control", color: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-100", description: "Learner's own strategies" },
  { value: "COOPERATIVE", label: "Cooperative", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-100", description: "What others will do to help" },
];

export function SocialStoryEditor({
  autismProfileId,
  initialStory,
  onSave,
  className,
}: SocialStoryEditorProps) {
  const [story, setStory] = useState<Partial<SocialStory>>({
    autismProfileId,
    title: "",
    topic: "",
    sentences: [],
    fontSize: "large",
    showImages: true,
    readAloud: true,
    pagePerSentence: false,
    comprehensionQuestions: [],
    isActive: true,
    isSharedWithParent: true,
    isTemplate: false,
    ...initialStory,
  });

  const [saving, setSaving] = useState(false);
  const [newSentenceText, setNewSentenceText] = useState("");
  const [newSentenceType, setNewSentenceType] = useState<SocialStorySentenceType>("DESCRIPTIVE");

  // Calculate sentence counts
  const counts = {
    descriptive: story.sentences?.filter((s) => s.type === "DESCRIPTIVE").length || 0,
    perspective: story.sentences?.filter((s) => s.type === "PERSPECTIVE").length || 0,
    directive: story.sentences?.filter((s) => s.type === "DIRECTIVE").length || 0,
    affirmative: story.sentences?.filter((s) => s.type === "AFFIRMATIVE").length || 0,
    control: story.sentences?.filter((s) => s.type === "CONTROL").length || 0,
    cooperative: story.sentences?.filter((s) => s.type === "COOPERATIVE").length || 0,
  };

  // Carol Gray's ratio: 2-5 descriptive/perspective/affirmative per directive
  const supportive = counts.descriptive + counts.perspective + counts.affirmative;
  const ratioValid = counts.directive === 0 || (supportive / counts.directive >= 2 && supportive / counts.directive <= 5);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        ...story,
        descriptiveCount: counts.descriptive,
        perspectiveCount: counts.perspective,
        directiveCount: counts.directive,
        affirmativeCount: counts.affirmative,
        controlCount: counts.control,
        cooperativeCount: counts.cooperative,
        ratioValid,
      });
    } finally {
      setSaving(false);
    }
  };

  const addSentence = () => {
    if (!newSentenceText.trim()) return;
    const sentences = story.sentences || [];
    const newSentence: SocialStorySentence = {
      order: sentences.length + 1,
      text: newSentenceText.trim(),
      type: newSentenceType,
    };
    setStory({ ...story, sentences: [...sentences, newSentence] });
    setNewSentenceText("");
  };

  const removeSentence = (index: number) => {
    const sentences = (story.sentences || [])
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    setStory({ ...story, sentences });
  };

  const updateSentenceType = (index: number, type: SocialStorySentenceType) => {
    const sentences = [...(story.sentences || [])];
    sentences[index] = { ...sentences[index], type };
    setStory({ ...story, sentences });
  };

  const moveSentence = (index: number, direction: "up" | "down") => {
    const sentences = [...(story.sentences || [])];
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sentences.length) return;
    
    [sentences[index], sentences[newIndex]] = [sentences[newIndex], sentences[index]];
    const reordered = sentences.map((s, i) => ({ ...s, order: i + 1 }));
    setStory({ ...story, sentences: reordered });
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Social Story Editor
        </CardTitle>
        <CardDescription>
          Create social stories following Carol Gray&apos;s methodology
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <div>
            <Label>Story Title</Label>
            <Input
              value={story.title}
              onChange={(e) => setStory({ ...story, title: e.target.value })}
              placeholder="e.g., Going to the Doctor"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Topic</Label>
            <Input
              value={story.topic}
              onChange={(e) => setStory({ ...story, topic: e.target.value })}
              placeholder="e.g., medical appointments, fire drills"
              className="mt-1"
            />
          </div>
          <div>
            <Label>Target Situation</Label>
            <Textarea
              value={story.targetSituation || ""}
              onChange={(e) => setStory({ ...story, targetSituation: e.target.value })}
              placeholder="Describe the situation this story addresses..."
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Target Behavior</Label>
            <Input
              value={story.targetBehavior || ""}
              onChange={(e) => setStory({ ...story, targetBehavior: e.target.value })}
              placeholder="What behavior should the story encourage?"
              className="mt-1"
            />
          </div>
        </div>

        {/* Ratio Indicator */}
        <div className={cn(
          "p-4 rounded-lg border",
          ratioValid ? "bg-green-50 dark:bg-green-950 border-green-200" : "bg-red-50 dark:bg-red-950 border-red-200"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {ratioValid ? (
              <Check className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span className="font-medium">
              Carol Gray&apos;s Ratio: {counts.directive > 0 ? (supportive / counts.directive).toFixed(1) : "N/A"}:1
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Should have 2-5 descriptive/perspective/affirmative sentences per directive sentence.
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {sentenceTypes.map((type) => {
              const count = counts[type.value.toLowerCase() as keyof typeof counts];
              return (
                <Badge key={type.value} className={type.color}>
                  {type.label}: {count}
                </Badge>
              );
            })}
          </div>
        </div>

        {/* Add Sentence */}
        <div className="space-y-3">
          <Label>Add Sentence</Label>
          <div className="flex flex-wrap gap-2">
            {sentenceTypes.map((type) => (
              <Button
                key={type.value}
                variant={newSentenceType === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setNewSentenceType(type.value)}
                title={type.description}
              >
                {type.label}
              </Button>
            ))}
          </div>
          <div className="flex gap-2">
            <Textarea
              value={newSentenceText}
              onChange={(e) => setNewSentenceText(e.target.value)}
              placeholder="Write a sentence..."
              rows={2}
              className="flex-1"
            />
            <Button onClick={addSentence} className="self-end">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sentences List */}
        <div className="space-y-2">
          <Label>Story Sentences</Label>
          {story.sentences?.map((sentence, index) => {
            const typeInfo = sentenceTypes.find((t) => t.value === sentence.type);
            return (
              <div
                key={index}
                className="flex items-start gap-3 p-3 border rounded-lg bg-background"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground mt-1 cursor-move" />
                
                <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                  {sentence.order}
                </span>

                <div className="flex-1">
                  <p className="mb-2">{sentence.text}</p>
                  <div className="flex flex-wrap gap-1">
                    {sentenceTypes.map((type) => (
                      <button
                        key={type.value}
                        className={cn(
                          "px-2 py-0.5 rounded text-xs transition-colors",
                          sentence.type === type.value ? type.color : "bg-muted text-muted-foreground"
                        )}
                        onClick={() => updateSentenceType(index, type.value)}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSentence(index, "up")}
                    disabled={index === 0}
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => moveSentence(index, "down")}
                    disabled={index === (story.sentences?.length || 0) - 1}
                  >
                    ↓
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSentence(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          {(!story.sentences || story.sentences.length === 0) && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
              No sentences yet. Add sentences above using different types.
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="space-y-3">
          <Label>Display Settings</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button
              variant={story.showImages ? "default" : "outline"}
              size="sm"
              onClick={() => setStory({ ...story, showImages: !story.showImages })}
            >
              <Image className="h-4 w-4 mr-1" />
              Images {story.showImages ? "On" : "Off"}
            </Button>
            <Button
              variant={story.readAloud ? "default" : "outline"}
              size="sm"
              onClick={() => setStory({ ...story, readAloud: !story.readAloud })}
            >
              Read Aloud {story.readAloud ? "On" : "Off"}
            </Button>
            <Button
              variant={story.pagePerSentence ? "default" : "outline"}
              size="sm"
              onClick={() => setStory({ ...story, pagePerSentence: !story.pagePerSentence })}
            >
              Page/Sentence {story.pagePerSentence ? "On" : "Off"}
            </Button>
          </div>
          <div>
            <Label className="text-xs">Font Size</Label>
            <div className="flex gap-2 mt-1">
              {["medium", "large", "x-large"].map((size) => (
                <Button
                  key={size}
                  variant={story.fontSize === size ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStory({ ...story, fontSize: size })}
                  className="capitalize"
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end gap-2">
          <Button onClick={handleSave} disabled={saving || !story.title || !story.sentences?.length}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Story"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
