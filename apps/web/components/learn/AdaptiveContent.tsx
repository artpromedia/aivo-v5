'use client';

import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { LearningStyle } from './types';

type ReadingSpeed = 'SLOW' | 'MODERATE' | 'FAST';

type LearningConcept = {
  term: string;
  simpleDefinition: string;
  mnemonic?: string;
};

type MediaAsset = { type: 'image' | 'video'; alt: string };

type ActivityReflection = { confidence: number; reflection: string };

type ActivityCompletion = { term: string; confidence: 'low' | 'medium' | 'high' };

type AdaptiveInteractionEvent =
  | { type: 'concept_focus'; concept: LearningConcept }
  | { type: 'activity_complete'; result: ActivityCompletion }
  | { type: 'comprehension'; result: ActivityReflection };

interface AdaptiveContentProps {
  content: {
    gradeLevel: number;
    actualLevel: number;
    text: string;
    concepts: LearningConcept[];
    media?: MediaAsset[];
  };
  learnerProfile: {
    learningStyle: LearningStyle;
    readingSpeed: ReadingSpeed;
    preferences: Record<string, unknown>;
  };
  onInteraction: (data: AdaptiveInteractionEvent) => void;
}

export function AdaptiveContent({ content, learnerProfile, onInteraction }: AdaptiveContentProps) {
  const [currentSection, setCurrentSection] = useState(0);
  const [isReading, setIsReading] = useState(false);
  const [comprehensionCheck, setComprehensionCheck] = useState(false);

  const contentChunks = useMemo(() => breakIntoChunks(content.text, learnerProfile.readingSpeed), [content.text, learnerProfile.readingSpeed]);

  useEffect(() => {
    setCurrentSection(0);
  }, [content.text]);

  const renderByStyle = () => {
    switch (learnerProfile.learningStyle) {
      case 'VISUAL':
        return <VisualLearningContent chunk={contentChunks[currentSection]} concepts={content.concepts} onInteraction={onInteraction} />;
      case 'AUDITORY':
        return (
          <AuditoryLearningContent
            chunk={contentChunks[currentSection]}
            concepts={content.concepts}
            isReading={isReading}
            onStart={() => setIsReading(true)}
            onEnd={() => setIsReading(false)}
          />
        );
      case 'KINESTHETIC':
  return <KinestheticLearningContent concepts={content.concepts} actualLevel={content.actualLevel} onInteraction={onInteraction} />;
      default:
        return <MixedLearningContent chunk={contentChunks[currentSection]} concepts={content.concepts} />;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div key={currentSection} initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -24 }} transition={{ duration: 0.3 }}>
        {renderByStyle()}
        <ChunkNavigation
          current={currentSection}
          total={contentChunks.length}
          onPrev={() => setCurrentSection((prev) => Math.max(0, prev - 1))}
          onNext={() => setCurrentSection((prev) => Math.min(contentChunks.length - 1, prev + 1))}
          onComplete={() => setComprehensionCheck(true)}
        />
        {comprehensionCheck && (
          <ComprehensionCheckModal
            onClose={() => setComprehensionCheck(false)}
            onSubmit={(result) => {
              onInteraction({ type: 'comprehension', result });
              setComprehensionCheck(false);
            }}
          />
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function breakIntoChunks(text: string, speed: ReadingSpeed): string[] {
  const chunkSize = speed === 'SLOW' ? 50 : speed === 'MODERATE' ? 100 : 150;
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  const chunks: string[] = [];
  let currentChunk = '';

  sentences.forEach((sentence) => {
    if ((currentChunk + sentence).split(' ').length <= chunkSize) {
      currentChunk += `${sentence} `;
    } else {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = `${sentence} `;
    }
  });

  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

function VisualLearningContent({ chunk, concepts, onInteraction }: { chunk: string; concepts: LearningConcept[]; onInteraction: (data: AdaptiveInteractionEvent) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-sky-50 to-indigo-50 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span>🗺️</span> Concept map
        </h3>
        <VisualAids concepts={concepts} onSelect={(concept) => onInteraction({ type: 'concept_focus', concept })} />
      </div>
      <article className="rounded-3xl bg-white p-6 shadow-sm">
        <HighlightedText text={chunk} keywords={concepts.map((concept) => concept.term)} />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {concepts.slice(0, 6).map((concept) => (
            <div key={concept.term} className="rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-900">{concept.term}</p>
              <p className="text-xs text-slate-500">{concept.simpleDefinition}</p>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function AuditoryLearningContent({ chunk, concepts, isReading, onStart, onEnd }: { chunk: string; concepts: LearningConcept[]; isReading: boolean; onStart: () => void; onEnd: () => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-green-50 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span>🎧</span> Listen & learn
        </h3>
        <TextToSpeech text={chunk} onStart={onStart} onEnd={onEnd} />
        <div className={`mt-4 rounded-2xl bg-white p-4 text-slate-800 ${isReading ? 'ring-2 ring-green-400' : ''}`}>
          <ReadAlongText text={chunk} isReading={isReading} />
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm">
        <h4 className="mb-3 text-base font-semibold">🎵 Remember with rhymes</h4>
        <div className="space-y-2">
          {concepts.slice(0, 3).map((concept) => (
            <button key={concept.term} type="button" className="w-full rounded-2xl bg-green-50 p-3 text-left text-sm font-semibold text-green-700 transition hover:bg-green-100" onClick={() => playMnemonic(concept.mnemonic)}>
              {concept.term} — {concept.mnemonic ?? 'Create your own calming rhyme!'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function KinestheticLearningContent({ concepts, actualLevel, onInteraction }: { concepts: LearningConcept[]; actualLevel: number; onInteraction: (data: AdaptiveInteractionEvent) => void }) {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-orange-50 p-6">
        <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
          <span>🤸</span> Learn by doing
        </h3>
        <InteractiveElements
          items={concepts}
          onComplete={(result) => onInteraction({ type: 'activity_complete', result })}
        />
      </div>
      <div className="rounded-3xl bg-yellow-50 p-6">
        <h4 className="mb-3 text-base font-semibold">🏗️ Build your understanding</h4>
        <VirtualManipulatives concept={concepts[0]} level={actualLevel} />
      </div>
    </div>
  );
}

function MixedLearningContent({ chunk, concepts }: { chunk: string; concepts: LearningConcept[] }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <VisualLearningContent chunk={chunk} concepts={concepts} onInteraction={() => undefined} />
      <AuditoryLearningContent chunk={chunk} concepts={concepts} isReading={false} onStart={() => undefined} onEnd={() => undefined} />
    </div>
  );
}

function ChunkNavigation({ current, total, onPrev, onNext, onComplete }: { current: number; total: number; onPrev: () => void; onNext: () => void; onComplete: () => void }) {
  const isLast = current === total - 1;
  return (
    <div className="mt-6 flex items-center justify-between">
      <button type="button" onClick={onPrev} disabled={current === 0} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600 disabled:cursor-not-allowed disabled:opacity-40">
        ← Previous
      </button>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, index) => (
          <span key={index} className={`h-2 w-2 rounded-full ${index === current ? 'bg-purple-500' : index < current ? 'bg-emerald-500' : 'bg-slate-300'}`} />
        ))}
      </div>
      <button
        type="button"
        onClick={isLast ? onComplete : onNext}
        className={`rounded-full px-4 py-2 text-sm font-semibold text-white ${isLast ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-purple-500 hover:bg-purple-600'}`}
      >
        {isLast ? 'Check understanding ✓' : 'Next →'}
      </button>
    </div>
  );
}

// Supporting UI helpers -----------------------------------------------------------------

function TextToSpeech({ text, onStart, onEnd }: { text: string; onStart: () => void; onEnd: () => void }) {
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined') {
        const synth = window.speechSynthesis;
        if (synth?.speaking) synth.cancel();
      }
    };
  }, []);

  const handlePlay = () => {
    if (typeof window === 'undefined') return;
    const synth = window.speechSynthesis;
    if (!synth) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.onstart = onStart;
    utterance.onend = onEnd;
    synth.cancel();
    synth.speak(utterance);
  };

  return (
    <button type="button" onClick={handlePlay} className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-600">
      ▶ Read aloud
    </button>
  );
}

function VisualAids({ concepts, onSelect }: { concepts: LearningConcept[]; onSelect: (concept: LearningConcept) => void }) {
  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {concepts.slice(0, 6).map((concept) => (
        <button key={concept.term} type="button" onClick={() => onSelect(concept)} className="rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-purple-200 hover:shadow">
          <p className="text-sm font-semibold text-slate-900">{concept.term}</p>
          <p className="text-xs text-slate-500">{concept.simpleDefinition}</p>
        </button>
      ))}
    </div>
  );
}

function HighlightedText({ text, keywords }: { text: string; keywords: string[] }) {
  const parts = text.split(new RegExp(`(${keywords.join('|')})`, 'gi'));
  return (
    <p className="text-lg leading-relaxed text-slate-800">
      {parts.map((part, index) => {
        const match = keywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase());
        return (
          <span key={`${part}-${index}`} className={match ? 'bg-yellow-100 px-1 font-semibold text-slate-900' : undefined}>
            {part}
          </span>
        );
      })}
    </p>
  );
}

function ReadAlongText({ text, isReading }: { text: string; isReading: boolean }) {
  return <p className={`text-base leading-relaxed ${isReading ? 'text-emerald-700' : 'text-slate-700'}`}>{text}</p>;
}

function InteractiveElements({ items, onComplete }: { items: LearningConcept[]; onComplete: (result: ActivityCompletion) => void }) {
  return (
    <div>
      <p className="text-sm text-slate-700">Drag the friendly cards into the &quot;understood&quot; bucket.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {items.slice(0, 4).map((item) => (
          <button key={item.term} type="button" className="rounded-2xl border border-orange-200 bg-white p-3 text-left text-sm font-semibold text-orange-700" onClick={() => onComplete({ term: item.term, confidence: 'high' })}>
            {item.term}
          </button>
        ))}
      </div>
    </div>
  );
}

function VirtualManipulatives({ concept, level }: { concept?: LearningConcept; level: number }) {
  if (!concept) return null;
  return (
    <div className="rounded-2xl border border-yellow-200 bg-white p-4 text-sm text-slate-700">
      Build a calm model of <strong>{concept.term}</strong> using {level <= 3 ? 'blocks' : 'patterns'}. Imagine snapping pieces together while breathing slowly.
    </div>
  );
}

function ComprehensionCheckModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (result: ActivityReflection) => void }) {
  const [confidence, setConfidence] = useState(3);
  const [reflection, setReflection] = useState('');
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h3 className="text-xl font-semibold text-slate-900">Check understanding</h3>
        <p className="mt-1 text-sm text-slate-500">How comfy do you feel with today&apos;s idea?</p>
        <input type="range" min={1} max={5} value={confidence} onChange={(event) => setConfidence(Number(event.target.value))} className="mt-4 w-full" />
        <textarea
          className="mt-3 w-full rounded-2xl border border-slate-200 p-3 text-sm"
          rows={3}
          placeholder="One thing you remember..."
          value={reflection}
          onChange={(event) => setReflection(event.target.value)}
        />
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl border border-slate-200 py-2 text-sm font-semibold text-slate-600">
            Later
          </button>
          <button
            type="button"
            onClick={() => onSubmit({ confidence, reflection })}
            className="flex-1 rounded-2xl bg-emerald-500 py-2 text-sm font-semibold text-white"
          >
            Share
          </button>
        </div>
      </div>
    </div>
  );
}

function playMnemonic(mnemonic?: string) {
  if (!mnemonic) return;
  if (typeof window === 'undefined') return;
  const synth = window.speechSynthesis;
  if (!synth) return;
  const utterance = new SpeechSynthesisUtterance(mnemonic);
  synth.cancel();
  synth.speak(utterance);
}
