"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { GameDefinition, GameElement } from "@/lib/ai/game-types";

interface FocusBreakGameProps {
  definition: GameDefinition;
  onComplete?: () => void;
}

export function FocusBreakGame({ definition, onComplete }: FocusBreakGameProps) {
  const body = useMemo(() => {
    switch (definition.gameType) {
      case "MEMORY":
        return <MemoryGame pairs={definition.gameElements.filter(isMemoryPair)} onComplete={onComplete} />;
      case "QUIZ":
        return <QuizGame questions={definition.gameElements.filter(isQuizQuestion)} onComplete={onComplete} />;
      case "MOVEMENT":
        return <MovementGame steps={definition.gameElements.filter(isMovementStep)} onComplete={onComplete} />;
      case "CREATIVE":
        return <CreativeGame prompts={definition.gameElements.filter(isCreativePrompt)} onComplete={onComplete} />;
      case "PUZZLE":
      default:
        return <PuzzleGame puzzles={definition.gameElements.filter(isPuzzle)} onComplete={onComplete} />;
    }
  }, [definition, onComplete]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-theme-primary/10 via-pink-50 to-rose-100 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="rounded-3xl bg-white/90 p-6 shadow-2xl">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-theme-primary/60">Brain break</p>
              <h1 className="text-3xl font-bold text-slate-900">{definition.title}</h1>
              <p className="mt-2 text-slate-600">{definition.instructions}</p>
              <p className="mt-2 text-sm text-slate-500">Goal: {definition.educationalGoal}</p>
            </div>
            <div className="rounded-2xl border border-theme-primary/10 bg-theme-primary/10 px-4 py-2 text-sm font-semibold text-theme-primary">
              {definition.duration}-minute game
            </div>
          </div>
        </div>
        {body}
      </div>
    </div>
  );
}

function PuzzleGame({ puzzles, onComplete }: { puzzles: PuzzleElement[]; onComplete?: () => void }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const current = puzzles[index];

  if (!current) {
    return <CompletionPanel onComplete={onComplete} headline="Puzzle mastery unlocked!" />;
  }

  const handleSelect = (option: string) => {
    if (feedback === "correct") return;
    if (option === current.answer) {
      setFeedback("correct");
      setTimeout(() => {
        if (index === puzzles.length - 1) {
          onComplete?.();
        }
        setIndex((prev) => prev + 1);
        setFeedback(null);
      }, 800);
    } else {
      setFeedback("try");
      setTimeout(() => setFeedback(null), 1200);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm text-slate-500">Puzzle {index + 1} of {puzzles.length}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{current.clue}</h2>
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {current.options.map((option) => (
          <button
            key={option}
            onClick={() => handleSelect(option)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
              feedback === "correct" && option === current.answer
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : feedback === "try" && option !== current.answer
                  ? "border-rose-200 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

function MemoryGame({ pairs, onComplete }: { pairs: MemoryElement[]; onComplete?: () => void }) {
  const cards = useMemo(() => shuffleMemoryPairs(pairs), [pairs]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set<string>());

  const handleFlip = (cardId: string) => {
    if (flipped.includes(cardId) || matched.has(cardId.split("|")[0]) || flipped.length === 2) return;
    const next = [...flipped, cardId];
    setFlipped(next);

    if (next.length === 2) {
      setTimeout(() => {
        const [first, second] = next;
        const [pairA, pairB] = [first.split("|")[0], second.split("|")[0]];
        if (pairA === pairB) {
          const updated = new Set(matched);
          updated.add(pairA);
          setMatched(updated);
          if (updated.size === pairs.length) {
            onComplete?.();
          }
        }
        setFlipped([]);
      }, 900);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm text-slate-500">Match the calming pairs</p>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || matched.has(card.pairId);
          return (
            <button
              key={card.id}
              onClick={() => handleFlip(card.id)}
              className={`aspect-square rounded-2xl border text-center text-sm font-semibold transition ${
                isFlipped ? "border-theme-primary/30 bg-theme-primary/10 text-theme-primary" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              {isFlipped ? card.content : "?"}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function QuizGame({ questions, onComplete }: { questions: QuizElement[]; onComplete?: () => void }) {
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const question = questions[current];

  if (!question) {
    return <CompletionPanel onComplete={onComplete} headline={`You earned ${score}/${questions.length} stars!`} />;
  }

  const handleAnswer = (choice: string) => {
    setSelected(choice);
    if (choice === question.answer) {
      setScore((prev) => prev + 1);
    }
    setTimeout(() => {
      setSelected(null);
      if (current === questions.length - 1) {
        onComplete?.();
      }
      setCurrent((prev) => prev + 1);
    }, 900);
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm text-slate-500">Quick check {current + 1} of {questions.length}</p>
      <h2 className="mt-2 text-2xl font-semibold text-slate-900">{question.prompt}</h2>
      <div className="mt-6 grid gap-3">
        {question.choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleAnswer(choice)}
            className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
              selected === choice
                ? choice === question.answer
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : "border-rose-200 bg-rose-50 text-rose-600"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}

function MovementGame({ steps, onComplete }: { steps: MovementElement[]; onComplete?: () => void }) {
  const [completed, setCompleted] = useState<Set<string>>(new Set<string>());

  const toggleStep = (id: string) => {
    const updated = new Set(completed);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setCompleted(updated);
    if (updated.size === steps.length) {
      onComplete?.();
    }
  };

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm text-slate-500">Mark each mindful movement</p>
      <div className="mt-6 space-y-4">
        {steps.map((step) => (
          <button
            key={step.id}
            onClick={() => toggleStep(step.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
              completed.has(step.id)
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-50 text-slate-700"
            }`}
          >
            <div>
              <p className="text-sm font-semibold">{step.action}</p>
              <p className="text-xs text-slate-500">{step.description}</p>
            </div>
            <span>{completed.has(step.id) ? "✓" : "○"}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CreativeGame({ prompts, onComplete }: { prompts: CreativeElement[]; onComplete?: () => void }) {
  const [response, setResponse] = useState("");
  const ready = response.trim().length > 40;

  return (
    <div className="rounded-3xl bg-white p-6 shadow-xl">
      <p className="text-sm text-slate-500">Express then return to learning</p>
      {prompts.map((prompt) => (
        <div key={prompt.id} className="mt-4 rounded-2xl border border-theme-primary/20 bg-theme-primary/5 p-4">
          <p className="text-sm font-semibold text-theme-primary-dark">{prompt.prompt}</p>
          <ul className="mt-2 list-disc pl-5 text-xs text-theme-primary">
            {prompt.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>
        </div>
      ))}
      <textarea
        className="mt-4 w-full rounded-2xl border border-slate-200 bg-white/80 p-4 text-sm text-slate-700"
        rows={6}
        placeholder="Sketch your idea with words..."
        value={response}
        onChange={(event) => setResponse(event.target.value)}
      />
      <button
        disabled={!ready}
        onClick={onComplete}
        className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold text-white transition ${
          ready ? "bg-theme-primary hover:bg-theme-primary-dark" : "bg-slate-400"
        }`}
      >
        Return to Learning
      </button>
    </div>
  );
}

function CompletionPanel({ headline, onComplete }: { headline: string; onComplete?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 p-8 text-center shadow-xl"
    >
      <p className="text-3xl font-bold text-emerald-700">🎉 {headline}</p>
      <p className="mt-2 text-sm text-emerald-700">Your brain is refreshed and ready.</p>
      <button
        onClick={onComplete}
        className="mt-6 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg"
      >
        Return to Learning
      </button>
    </motion.div>
  );
}

function isPuzzle(element: GameElement): element is PuzzleElement {
  return element.kind === "puzzle";
}

function isMemoryPair(element: GameElement): element is MemoryElement {
  return element.kind === "memoryPair";
}

function isQuizQuestion(element: GameElement): element is QuizElement {
  return element.kind === "quizQuestion";
}

function isMovementStep(element: GameElement): element is MovementElement {
  return element.kind === "movementStep";
}

function isCreativePrompt(element: GameElement): element is CreativeElement {
  return element.kind === "creativePrompt";
}

interface PuzzleElement {
  kind: "puzzle";
  id: string;
  clue: string;
  options: string[];
  answer: string;
}

interface MemoryElement {
  kind: "memoryPair";
  id: string;
  content: string;
  match: string;
}

interface QuizElement {
  kind: "quizQuestion";
  id: string;
  prompt: string;
  choices: string[];
  answer: string;
}

interface MovementElement {
  kind: "movementStep";
  id: string;
  action: string;
  description: string;
}

interface CreativeElement {
  kind: "creativePrompt";
  id: string;
  prompt: string;
  cues: string[];
}

interface MemoryCard {
  id: string;
  content: string;
  pairId: string;
}

function shuffleMemoryPairs(pairs: MemoryElement[]): MemoryCard[] {
  const cards: MemoryCard[] = pairs.flatMap((pair) => [
    { id: `${pair.id}|a`, content: pair.content, pairId: pair.id },
    { id: `${pair.id}|b`, content: pair.match, pairId: pair.id }
  ]);
  for (let i = cards.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
