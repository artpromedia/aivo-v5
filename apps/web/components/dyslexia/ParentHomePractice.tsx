"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Textarea } from "@/components/ui/Textarea";
import { 
  Home, 
  BookOpen, 
  Clock, 
  CheckCircle2,
  Circle,
  Star,
  Calendar,
  Video,
  FileText,
  Download,
  MessageSquare,
  TrendingUp,
  Target,
  Heart,
  Lightbulb
} from "lucide-react";

interface HomePracticeActivity {
  id: string;
  title: string;
  description: string;
  type: "reading" | "phonics" | "sight_words" | "writing" | "fluency" | "game";
  duration: number;
  materials: string[];
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  completed: boolean;
  completedAt?: string;
  parentNotes?: string;
  difficulty: "easy" | "medium" | "challenging";
}

interface WeeklyPlan {
  weekOf: string;
  activities: HomePracticeActivity[];
  focusAreas: string[];
  teacherMessage?: string;
  completedCount: number;
}

interface ParentHomePracticeProps {
  profileId: string;
  studentName: string;
  weeklyPlan: WeeklyPlan;
  onCompleteActivity: (activityId: string, notes?: string) => void;
  onAddFeedback: (feedback: string) => void;
}

const TYPE_CONFIG: Record<HomePracticeActivity["type"], { icon: React.ReactNode; color: string; label: string }> = {
  reading: { icon: <BookOpen className="h-4 w-4" />, color: "bg-blue-100 text-blue-700", label: "Reading" },
  phonics: { icon: <Target className="h-4 w-4" />, color: "bg-purple-100 text-purple-700", label: "Phonics" },
  sight_words: { icon: <Star className="h-4 w-4" />, color: "bg-yellow-100 text-yellow-700", label: "Sight Words" },
  writing: { icon: <FileText className="h-4 w-4" />, color: "bg-green-100 text-green-700", label: "Writing" },
  fluency: { icon: <TrendingUp className="h-4 w-4" />, color: "bg-orange-100 text-orange-700", label: "Fluency" },
  game: { icon: <Heart className="h-4 w-4" />, color: "bg-pink-100 text-pink-700", label: "Game" },
};

const DIFFICULTY_CONFIG: Record<HomePracticeActivity["difficulty"], { label: string; color: string }> = {
  easy: { label: "Easy", color: "bg-green-100 text-green-700" },
  medium: { label: "Medium", color: "bg-yellow-100 text-yellow-700" },
  challenging: { label: "Challenging", color: "bg-orange-100 text-orange-700" },
};

// Sample weekly activities based on Orton-Gillingham approach
const SAMPLE_ACTIVITIES: HomePracticeActivity[] = [
  {
    id: "1",
    title: "Letter Sound Practice",
    description: "Practice saying the sounds of letters while tracing them",
    type: "phonics",
    duration: 10,
    materials: ["Letter cards", "Sand tray or salt tray"],
    instructions: [
      "Show letter card to your child",
      "Have them say the letter name and sound",
      "Trace the letter in sand while saying the sound",
      "Repeat with 5-10 letters"
    ],
    tips: [
      "Use a calm, patient voice",
      "Celebrate effort, not just accuracy",
      "If they struggle, give the answer and move on"
    ],
    difficulty: "easy",
    completed: false
  },
  {
    id: "2",
    title: "Sight Word Flashcards",
    description: "Practice this week's sight words using flashcards",
    type: "sight_words",
    duration: 5,
    materials: ["This week's sight word cards"],
    instructions: [
      "Show each card for 3 seconds",
      "Have child read the word",
      "If correct, put in 'known' pile",
      "If incorrect, say the word together and practice"
    ],
    tips: [
      "Keep sessions short to maintain focus",
      "End on a success",
      "Use words in sentences for context"
    ],
    difficulty: "medium",
    completed: false
  },
  {
    id: "3",
    title: "Partner Reading",
    description: "Read a decodable book together",
    type: "reading",
    duration: 15,
    materials: ["This week's decodable reader"],
    instructions: [
      "You read one page, child reads the next",
      "Point to words as you read",
      "Help with tricky words by sounding out",
      "Discuss the story together"
    ],
    tips: [
      "Choose a quiet, comfortable spot",
      "Be patient with mistakes",
      "Praise good reading behaviors"
    ],
    difficulty: "medium",
    completed: false
  }
];

export function ParentHomePractice({
  profileId,
  studentName,
  weeklyPlan,
  onCompleteActivity,
  onAddFeedback
}: ParentHomePracticeProps) {
  const [selectedActivity, setSelectedActivity] = useState<HomePracticeActivity | null>(null);
  const [completionNotes, setCompletionNotes] = useState("");
  const [feedback, setFeedback] = useState("");
  const [showTips, setShowTips] = useState(true);

  const completionPercentage = Math.round(
    (weeklyPlan.completedCount / weeklyPlan.activities.length) * 100
  );

  const handleComplete = () => {
    if (selectedActivity) {
      onCompleteActivity(selectedActivity.id, completionNotes);
      setSelectedActivity(null);
      setCompletionNotes("");
    }
  };

  const handleFeedback = () => {
    if (feedback.trim()) {
      onAddFeedback(feedback);
      setFeedback("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-blue-600" />
                Home Practice for {studentName}
              </CardTitle>
              <CardDescription>
                Week of {new Date(weeklyPlan.weekOf).toLocaleDateString()}
              </CardDescription>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-blue-600">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">completed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="h-3" />
          <div className="flex gap-4 mt-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              {weeklyPlan.completedCount} done
            </span>
            <span className="flex items-center gap-1">
              <Circle className="h-4 w-4 text-muted-foreground" />
              {weeklyPlan.activities.length - weeklyPlan.completedCount} remaining
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Message */}
      {weeklyPlan.teacherMessage && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm mb-1">Message from Teacher</h3>
                <p className="text-sm text-muted-foreground">{weeklyPlan.teacherMessage}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Focus Areas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            This Week's Focus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {weeklyPlan.focusAreas.map((area, idx) => (
              <Badge key={idx} variant="outline" className="bg-purple-50">
                {area}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Parent Tips */}
      {showTips && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-amber-600" />
                Tips for Success
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowTips(false)}>
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Keep sessions <strong>short</strong> (5-15 minutes) and <strong>positive</strong></span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Practice at the <strong>same time</strong> each day to build routine</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Use <strong>multisensory</strong> approaches - see it, say it, trace it</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>Praise <strong>effort and progress</strong>, not just correct answers</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5 text-amber-600 flex-shrink-0" />
                <span>End each session on a <strong>success</strong></span>
              </li>
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Activities List */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">This Week's Activities</h2>
        
        {weeklyPlan.activities.map((activity) => {
          const typeConfig = TYPE_CONFIG[activity.type];
          const difficultyConfig = DIFFICULTY_CONFIG[activity.difficulty];

          return (
            <Card 
              key={activity.id}
              className={`transition-all ${activity.completed ? "bg-green-50/50 border-green-200" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div 
                    className={`p-2 rounded-lg ${activity.completed ? "bg-green-100" : typeConfig.color}`}
                  >
                    {activity.completed 
                      ? <CheckCircle2 className="h-5 w-5 text-green-600" />
                      : typeConfig.icon
                    }
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className={`font-semibold ${activity.completed ? "text-green-700" : ""}`}>
                          {activity.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">{activity.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={difficultyConfig.color}>
                          {difficultyConfig.label}
                        </Badge>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {activity.duration} min
                        </span>
                      </div>
                    </div>

                    {selectedActivity?.id === activity.id ? (
                      <div className="mt-4 space-y-4">
                        {/* Materials */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Materials Needed:</h4>
                          <div className="flex flex-wrap gap-2">
                            {activity.materials.map((material, idx) => (
                              <Badge key={idx} variant="outline">{material}</Badge>
                            ))}
                          </div>
                        </div>

                        {/* Instructions */}
                        <div>
                          <h4 className="text-sm font-medium mb-2">Instructions:</h4>
                          <ol className="space-y-2">
                            {activity.instructions.map((instruction, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center flex-shrink-0">
                                  {idx + 1}
                                </span>
                                {instruction}
                              </li>
                            ))}
                          </ol>
                        </div>

                        {/* Tips */}
                        <div className="p-3 bg-amber-50 rounded-lg">
                          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Lightbulb className="h-4 w-4 text-amber-600" />
                            Tips:
                          </h4>
                          <ul className="space-y-1">
                            {activity.tips.map((tip, idx) => (
                              <li key={idx} className="text-sm text-muted-foreground">• {tip}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Video link if available */}
                        {activity.videoUrl && (
                          <Button variant="outline" size="sm">
                            <Video className="h-4 w-4 mr-2" />
                            Watch Demo Video
                          </Button>
                        )}

                        {/* Completion section */}
                        {!activity.completed && (
                          <div className="space-y-3 pt-3 border-t">
                            <Textarea
                              placeholder="How did the activity go? Any observations to share with the teacher?"
                              value={completionNotes}
                              onChange={(e) => setCompletionNotes(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <Button onClick={handleComplete}>
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Mark as Complete
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => setSelectedActivity(null)}
                              >
                                Close
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mt-3 flex gap-2">
                        <Button 
                          size="sm" 
                          variant={activity.completed ? "outline" : "default"}
                          onClick={() => setSelectedActivity(activity)}
                        >
                          {activity.completed ? "View Details" : "Start Activity"}
                        </Button>
                        {activity.videoUrl && (
                          <Button size="sm" variant="outline">
                            <Video className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}

                    {activity.completed && activity.completedAt && (
                      <div className="mt-2 text-xs text-green-600">
                        ✓ Completed on {new Date(activity.completedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Feedback to Teacher */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Send Feedback to Teacher
          </CardTitle>
          <CardDescription>
            Share observations, questions, or concerns about your child's progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Share how home practice is going, any challenges you're facing, or questions for the teacher..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
          />
          <Button onClick={handleFeedback} disabled={!feedback.trim()}>
            Send Feedback
          </Button>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">Parent Guide</div>
                  <div className="text-xs text-muted-foreground">Understanding dyslexia at home</div>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <Download className="h-5 w-5 text-green-600" />
                <div className="text-left">
                  <div className="font-medium">Printable Materials</div>
                  <div className="text-xs text-muted-foreground">Letter cards, word lists, etc.</div>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-purple-600" />
                <div className="text-left">
                  <div className="font-medium">Video Tutorials</div>
                  <div className="text-xs text-muted-foreground">Learn multisensory techniques</div>
                </div>
              </div>
            </Button>
            <Button variant="outline" className="h-auto p-4 justify-start">
              <div className="flex items-center gap-3">
                <Heart className="h-5 w-5 text-pink-600" />
                <div className="text-left">
                  <div className="font-medium">Encouragement Tips</div>
                  <div className="text-xs text-muted-foreground">Building confidence</div>
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ParentHomePractice;
