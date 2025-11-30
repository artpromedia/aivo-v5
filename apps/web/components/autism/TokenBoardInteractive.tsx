"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { 
  Star, 
  Sparkles,
  RotateCcw,
  Volume2,
  Trophy,
  Gift,
  Plus,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface TokenBoard {
  id?: string;
  learnerId: string;
  name: string;
  targetBehavior: string;
  tokensRequired: number;
  currentTokens: number;
  tokenIcon: string;
  reward: string;
  rewardImageUrl?: string;
  isActive: boolean;
  backgroundColor?: string;
}

interface TokenBoardInteractiveProps {
  board: TokenBoard;
  onTokenChange?: (newCount: number) => void;
  onComplete?: () => void;
  onReset?: () => void;
  readOnly?: boolean;
  className?: string;
}

const TOKEN_ICONS: Record<string, typeof Star> = {
  star: Star,
  sparkle: Sparkles,
  trophy: Trophy,
  gift: Gift,
};

const CELEBRATION_SOUNDS = [
  "🎉", "🎊", "🌟", "✨", "🏆", "🎁",
];

export function TokenBoardInteractive({
  board,
  onTokenChange,
  onComplete,
  onReset,
  readOnly = false,
  className,
}: TokenBoardInteractiveProps) {
  const [tokens, setTokens] = useState(board.currentTokens || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastEarnedIndex, setLastEarnedIndex] = useState<number | null>(null);

  const TokenIcon = TOKEN_ICONS[board.tokenIcon] || Star;
  const isComplete = tokens >= board.tokensRequired;

  // Play celebration when complete
  useEffect(() => {
    if (isComplete && !showCelebration) {
      setShowCelebration(true);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance("Great job! You earned your reward!");
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
      onComplete?.();
    }
  }, [isComplete, showCelebration, onComplete]);

  const handleAddToken = useCallback(() => {
    if (readOnly || tokens >= board.tokensRequired) return;
    
    const newCount = tokens + 1;
    setLastEarnedIndex(newCount - 1);
    setIsAnimating(true);
    setTokens(newCount);
    onTokenChange?.(newCount);

    // Play sound feedback
    if ("speechSynthesis" in window) {
      const phrases = ["Good job!", "Way to go!", "Awesome!", "Great work!", "Nice!"];
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      const utterance = new SpeechSynthesisUtterance(phrase);
      utterance.rate = 1.1;
      window.speechSynthesis.speak(utterance);
    }

    setTimeout(() => {
      setIsAnimating(false);
      setLastEarnedIndex(null);
    }, 600);
  }, [tokens, board.tokensRequired, readOnly, onTokenChange]);

  const handleRemoveToken = useCallback(() => {
    if (readOnly || tokens <= 0) return;
    
    const newCount = tokens - 1;
    setTokens(newCount);
    onTokenChange?.(newCount);
  }, [tokens, readOnly, onTokenChange]);

  const handleReset = useCallback(() => {
    setTokens(0);
    setShowCelebration(false);
    onReset?.();
    onTokenChange?.(0);
  }, [onReset, onTokenChange]);

  const handleReadTarget = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `I am working on ${board.targetBehavior}. When I get ${board.tokensRequired} ${board.tokenIcon}s, I can have ${board.reward}.`
      );
      utterance.rate = 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <Card 
      className={cn(
        "w-full overflow-hidden transition-all",
        showCelebration && "ring-4 ring-yellow-400",
        board.backgroundColor && `bg-[${board.backgroundColor}]`,
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TokenIcon className="h-5 w-5 text-yellow-500" />
            {board.name}
          </span>
          <Button variant="ghost" size="sm" onClick={handleReadTarget}>
            <Volume2 className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Target Behavior */}
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
          <div className="text-sm text-muted-foreground mb-1">I am working on:</div>
          <div className="text-xl font-semibold">{board.targetBehavior}</div>
        </div>

        {/* Token Grid */}
        <div className="flex flex-wrap justify-center gap-3">
          {Array.from({ length: board.tokensRequired }).map((_, i) => {
            const isEarned = i < tokens;
            const isLatest = lastEarnedIndex === i;
            
            return (
              <div
                key={i}
                className={cn(
                  "w-16 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                  isEarned 
                    ? "border-yellow-400 bg-yellow-100 dark:bg-yellow-900/50" 
                    : "border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800",
                  isLatest && "scale-125 shadow-lg",
                  isAnimating && isLatest && "animate-bounce"
                )}
                onClick={!readOnly && !isEarned ? handleAddToken : undefined}
                role={!readOnly && !isEarned ? "button" : undefined}
                style={{ cursor: !readOnly && !isEarned ? "pointer" : "default" }}
              >
                {isEarned ? (
                  <TokenIcon className={cn(
                    "h-10 w-10 text-yellow-500",
                    isLatest && "animate-pulse"
                  )} />
                ) : (
                  <span className="text-2xl text-gray-400">{i + 1}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <div className="text-center">
          <Badge variant="secondary" className="text-lg px-4 py-1">
            {tokens} / {board.tokensRequired}
          </Badge>
        </div>

        {/* Reward Preview */}
        <div className={cn(
          "p-4 rounded-xl text-center transition-all",
          isComplete 
            ? "bg-green-100 dark:bg-green-900/30 ring-2 ring-green-400" 
            : "bg-gray-100 dark:bg-gray-800"
        )}>
          <div className="text-sm text-muted-foreground mb-2">
            {isComplete ? "🎉 You earned:" : "When I'm done, I get:"}
          </div>
          {board.rewardImageUrl ? (
            <div className="w-24 h-24 mx-auto rounded-xl bg-white dark:bg-gray-700 overflow-hidden mb-2">
              <img src={board.rewardImageUrl} alt={board.reward} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center mb-2">
              <Gift className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="text-xl font-semibold">{board.reward}</div>
        </div>

        {/* Celebration overlay */}
        {showCelebration && (
          <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-50">
            <div className="text-9xl animate-bounce">
              {CELEBRATION_SOUNDS[Math.floor(Math.random() * CELEBRATION_SOUNDS.length)]}
            </div>
          </div>
        )}

        {/* Controls */}
        {!readOnly && (
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="lg"
              onClick={handleRemoveToken}
              disabled={tokens <= 0}
            >
              <Minus className="h-5 w-5" />
            </Button>
            <Button
              size="lg"
              onClick={handleAddToken}
              disabled={isComplete}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Token
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleReset}
            >
              <RotateCcw className="h-5 w-5" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
