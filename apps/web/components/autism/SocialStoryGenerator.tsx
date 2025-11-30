"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { 
  Sparkles, 
  Wand2,
  Loader2,
  Book,
  Target,
  Users,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialStory, SocialStorySentence } from "./SocialStoryEditor";

interface SocialStoryGeneratorProps {
  learnerId: string;
  onStoryGenerated?: (story: Partial<SocialStory>) => void;
  className?: string;
}

const STORY_TEMPLATES = [
  { id: "new-situation", label: "New Situation", icon: AlertCircle },
  { id: "social-skill", label: "Social Skill", icon: Users },
  { id: "routine-change", label: "Routine Change", icon: Target },
  { id: "emotion-regulation", label: "Emotion Regulation", icon: Target },
  { id: "safety", label: "Safety", icon: AlertCircle },
  { id: "custom", label: "Custom Topic", icon: Book },
];

const SUGGESTED_TOPICS = [
  "Going to the dentist",
  "Making a friend",
  "Waiting my turn",
  "Fire drill at school",
  "Getting a haircut",
  "Doctor visit",
  "First day of school",
  "Taking a test",
  "Asking for help",
  "Dealing with losing a game",
  "Sharing toys",
  "Following classroom rules",
];

export function SocialStoryGenerator({
  learnerId,
  onStoryGenerated,
  className,
}: SocialStoryGeneratorProps) {
  const [step, setStep] = useState<"template" | "details" | "generating" | "preview">("template");
  const [template, setTemplate] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [context, setContext] = useState("");
  const [readingLevel, setReadingLevel] = useState<string>("elementary");
  const [perspective, setPerspective] = useState<string>("first");
  const [generatedStory, setGeneratedStory] = useState<Partial<SocialStory> | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTemplateSelect = (templateId: string) => {
    setTemplate(templateId);
    setStep("details");
  };

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    
    setIsGenerating(true);
    setError(null);
    setStep("generating");

    try {
      const response = await fetch(`/api/autism/social-stories/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          learner_id: learnerId,
          topic,
          context,
          template,
          reading_level: readingLevel,
          perspective,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate story");
      }

      const data = await response.json();
      
      // Map the AI response to our story format
      const story: Partial<SocialStory> = {
        title: data.title,
        topic,
        targetBehavior: data.target_behavior || topic,
        sentences: data.sentences?.map((s: { text: string; type: string; order: number }, i: number) => ({
          text: s.text,
          type: s.type,
          order: i,
        })) || [],
        readAloud: true,
        showImages: true,
        pagePerSentence: true,
        fontSize: "large",
      };

      setGeneratedStory(story);
      setStep("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("details");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseStory = () => {
    if (generatedStory) {
      onStoryGenerated?.(generatedStory);
    }
  };

  const handleRegenerate = () => {
    setStep("details");
    setGeneratedStory(null);
  };

  // Template selection
  if (step === "template") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            AI Social Story Generator
          </CardTitle>
          <CardDescription>
            Choose a template to create an evidence-based social story
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {STORY_TEMPLATES.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.id}
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => handleTemplateSelect(t.id)}
                >
                  <Icon className="h-6 w-6" />
                  <span>{t.label}</span>
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Details form
  if (step === "details") {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            Story Details
          </CardTitle>
          <CardDescription>
            Provide details to generate a personalized social story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium">Topic</label>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g., Going to the dentist"
            />
            <div className="flex flex-wrap gap-2 mt-2">
              {SUGGESTED_TOPICS.slice(0, 6).map((t) => (
                <Badge
                  key={t}
                  variant="outline"
                  className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setTopic(t)}
                >
                  {t}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Context (Optional)</label>
            <Textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Any specific details about the learner's needs, triggers, or preferences..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Reading Level</label>
              <Select value={readingLevel} onValueChange={setReadingLevel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="early">Early (K-1)</SelectItem>
                  <SelectItem value="elementary">Elementary (2-4)</SelectItem>
                  <SelectItem value="middle">Middle (5-8)</SelectItem>
                  <SelectItem value="high">High School</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Perspective</label>
              <Select value={perspective} onValueChange={setPerspective}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">First Person (I, me)</SelectItem>
                  <SelectItem value="third">Third Person (they, the child)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep("template")}>
              Back
            </Button>
            <Button onClick={handleGenerate} disabled={!topic.trim()}>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Story
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Generating state
  if (step === "generating") {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="py-16">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="relative">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <Sparkles className="h-6 w-6 absolute -top-1 -right-1 text-yellow-500" />
            </div>
            <h3 className="mt-6 text-xl font-semibold">Creating Your Social Story</h3>
            <p className="mt-2 text-muted-foreground">
              Our AI is crafting a personalized story about &quot;{topic}&quot;...
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              This usually takes 10-15 seconds
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Preview generated story
  if (step === "preview" && generatedStory) {
    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Book className="h-5 w-5" />
            {generatedStory.title || "Generated Story"}
          </CardTitle>
          <CardDescription>
            Review and customize your AI-generated social story
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Topic: {topic}</Badge>
              <Badge variant="outline">{readingLevel} level</Badge>
              <Badge variant="outline">{perspective} person</Badge>
            </div>
            
            <div className="space-y-4">
              {(generatedStory.sentences as SocialStorySentence[] || []).map((sentence, i) => (
                <div key={i} className="flex gap-3">
                  <Badge variant="secondary" className="shrink-0">
                    {sentence.type || "descriptive"}
                  </Badge>
                  <p className="text-lg">{sentence.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" onClick={handleRegenerate}>
              <Wand2 className="h-4 w-4 mr-2" />
              Regenerate
            </Button>
            <Button onClick={handleUseStory}>
              <Book className="h-4 w-4 mr-2" />
              Use This Story
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
