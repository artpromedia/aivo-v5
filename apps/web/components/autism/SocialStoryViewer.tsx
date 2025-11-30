"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  BookOpen, 
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  RotateCcw,
  Image,
  Check,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SocialStory, SocialStorySentence, ComprehensionQuestion } from "./SocialStoryEditor";

interface SocialStoryViewerProps {
  story: SocialStory;
  onComplete?: (comprehensionAnswers?: { questionIndex: number; answer: string; isCorrect: boolean }[]) => void;
  className?: string;
}

const fontSizeClasses = {
  medium: "text-lg",
  large: "text-xl",
  "x-large": "text-2xl",
};

export function SocialStoryViewer({
  story,
  onComplete,
  className,
}: SocialStoryViewerProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [answers, setAnswers] = useState<{ questionIndex: number; answer: string; isCorrect: boolean }[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const sentences = story.sentences || [];
  const totalPages = story.pagePerSentence ? sentences.length : 1;
  const questions = story.comprehensionQuestions || [];

  const getCurrentSentences = (): SocialStorySentence[] => {
    if (story.pagePerSentence) {
      return sentences[currentPage] ? [sentences[currentPage]] : [];
    }
    return sentences;
  };

  const handleReadAloud = () => {
    if (!story.readAloud) return;
    
    const currentSentences = getCurrentSentences();
    const text = currentSentences.map((s) => s.text).join(". ");
    
    if ("speechSynthesis" in window) {
      if (isReading) {
        window.speechSynthesis.cancel();
        setIsReading(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.8; // Slower for comprehension
        utterance.onend = () => setIsReading(false);
        window.speechSynthesis.speak(utterance);
        setIsReading(true);
      }
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (questions.length > 0) {
      setShowQuiz(true);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleAnswerSubmit = () => {
    if (selectedAnswer === null) return;
    
    const question = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correctAnswer;
    
    const newAnswers = [
      ...answers,
      { questionIndex: currentQuestionIndex, answer: selectedAnswer, isCorrect },
    ];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      onComplete?.(newAnswers);
    }
  };

  const handleRestart = () => {
    setCurrentPage(0);
    setShowQuiz(false);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
  };

  // Quiz view
  if (showQuiz && questions.length > 0) {
    const question = questions[currentQuestionIndex];
    const hasAnswered = answers.length > currentQuestionIndex;
    const score = answers.filter((a) => a.isCorrect).length;

    if (hasAnswered && currentQuestionIndex === questions.length - 1) {
      // Show results
      return (
        <Card className={cn("w-full", className)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Quiz Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-6xl font-bold mb-4">
              {score}/{questions.length}
            </div>
            <p className="text-muted-foreground mb-6">
              You got {score} out of {questions.length} questions correct!
            </p>
            <div className="space-y-2 mb-6">
              {answers.map((answer, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center gap-2 p-3 rounded-lg",
                    answer.isCorrect ? "bg-green-100 dark:bg-green-900" : "bg-red-100 dark:bg-red-900"
                  )}
                >
                  {answer.isCorrect ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <X className="h-5 w-5 text-red-600" />
                  )}
                  <span>Question {i + 1}: {questions[i].question}</span>
                </div>
              ))}
            </div>
            <Button onClick={handleRestart}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Read Again
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Comprehension Check
            </span>
            <Badge variant="outline">
              Question {currentQuestionIndex + 1} of {questions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-6">{question.question}</h3>
            <div className="grid gap-3 max-w-md mx-auto">
              {question.options?.map((option, i) => (
                <Button
                  key={i}
                  variant={selectedAnswer === option ? "default" : "outline"}
                  className="w-full py-6 text-lg"
                  onClick={() => setSelectedAnswer(option)}
                >
                  {option}
                </Button>
              )) || (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="w-full p-3 border rounded-lg text-lg"
                    placeholder="Type your answer..."
                    value={selectedAnswer || ""}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleAnswerSubmit}
              disabled={!selectedAnswer}
            >
              Submit Answer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Story view
  const currentSentences = getCurrentSentences();

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {story.title}
        </CardTitle>
        <div className="flex items-center gap-2">
          {story.readAloud && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReadAloud}
            >
              {isReading ? (
                <>
                  <VolumeX className="h-4 w-4 mr-1" />
                  Stop
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-1" />
                  Read
                </>
              )}
            </Button>
          )}
          {totalPages > 1 && (
            <Badge variant="outline">
              {currentPage + 1} / {totalPages}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress */}
        {totalPages > 1 && (
          <div className="mb-6">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${((currentPage + 1) / totalPages) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="min-h-[300px] flex flex-col items-center justify-center text-center px-4">
          {currentSentences.map((sentence, i) => (
            <div key={i} className="mb-6">
              {story.showImages && sentence.imageUrl && (
                <div className="w-48 h-48 mx-auto rounded-xl bg-muted flex items-center justify-center overflow-hidden mb-4">
                  <img src={sentence.imageUrl} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              {story.showImages && !sentence.imageUrl && (
                <div className="w-32 h-32 mx-auto rounded-xl bg-muted flex items-center justify-center mb-4">
                  <Image className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <p className={cn(
                "leading-relaxed",
                fontSizeClasses[story.fontSize as keyof typeof fontSizeClasses] || "text-xl",
                sentence.emphasis && "font-bold"
              )}>
                {sentence.text}
              </p>
            </div>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <Button onClick={handleNext}>
            {currentPage === totalPages - 1 ? (
              questions.length > 0 ? "Take Quiz" : "Finish"
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
