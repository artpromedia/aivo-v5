'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AssessmentDomainName, Question } from '@/lib/types/assessment';
import type { QuestionValidationResult } from '@/lib/types/assessment';
import { AudioRecorder } from '@/components/audio-recorder';

const ASSESSMENT_DOMAINS = [
  {
    id: 'speech_language',
    name: 'Speech & Language',
    icon: '💬',
    components: ['articulation', 'receptive', 'expressive', 'pragmatic']
  },
  {
    id: 'reading',
    name: 'Reading & Literacy',
    icon: '📚',
    components: ['phonics', 'fluency', 'comprehension', 'vocabulary']
  },
  {
    id: 'math',
    name: 'Mathematics',
    icon: '🔢',
    components: ['number_sense', 'operations', 'geometry', 'problem_solving']
  },
  {
    id: 'science',
    name: 'Science & Social Studies',
    icon: '🔬',
    components: ['life_science', 'physical_science', 'earth_social']
  },
  {
    id: 'sel',
    name: 'Social-Emotional',
    icon: '❤️',
    components: ['self_awareness', 'self_management', 'social_awareness']
  }
] as const;

type BaselineDomainId = (typeof ASSESSMENT_DOMAINS)[number]['id'];

const DOMAIN_TO_ASSESSMENT: Record<BaselineDomainId, AssessmentDomainName> = {
  speech_language: 'SPEECH',
  reading: 'READING',
  math: 'MATH',
  science: 'SCIENCE',
  sel: 'SEL'
};

type ComponentEvidence = {
  prompt: string;
  response: string;
  modality: 'text' | 'audio' | 'visual';
  score?: number;
  metadata?: Record<string, unknown>;
};

type ComponentState = {
  evidence: ComponentEvidence[];
  score?: number;
  completed: boolean;
  aiNotes?: string;
};

type AssessmentData = Record<string, { components: Record<string, ComponentState> }>;

type StoredResponse = { answer: string; isCorrect?: boolean };

type ComponentCompletion = {
  evidence: ComponentEvidence[];
  score?: number;
  modality: 'text' | 'audio' | 'visual';
  responses?: Record<string, unknown>;
  aiNotes?: string;
  confidence?: number;
};

interface SpeechAnalysisResult {
  transcription?: string;
  notes?: string;
  scores: {
    intelligibility: number;
    phonemeAccuracy?: number;
    pace?: number;
    ageAppropriate?: boolean;
  };
  phonemes?: Array<{ symbol: string; accuracy: number }>;
}

export default function BaselineAssessmentComplete() {
  const router = useRouter();
  const { data: session } = useSession();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [assessmentData, setAssessmentData] = useState<AssessmentData>({});
  const [currentDomain, setCurrentDomain] = useState(0);
  const [currentComponent, setCurrentComponent] = useState(0);
  const [questionsByDomain, setQuestionsByDomain] = useState<Record<AssessmentDomainName, Question[]>>({
    READING: [],
    MATH: [],
    SPEECH: [],
    SEL: [],
    SCIENCE: []
  });
  const [responses, setResponses] = useState<Record<string, StoredResponse>>({});
  const [domainGrades, setDomainGrades] = useState<Record<AssessmentDomainName, number>>({
    READING: 4,
    MATH: 4,
    SPEECH: 4,
    SEL: 4,
    SCIENCE: 4
  });
  const lastResultsRef = useRef<Record<AssessmentDomainName, boolean | undefined>>({
    READING: undefined,
    MATH: undefined,
    SPEECH: undefined,
    SEL: undefined,
    SCIENCE: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalComponents = useMemo(
    () => ASSESSMENT_DOMAINS.reduce((sum, domain) => sum + domain.components.length, 0),
    []
  );

  const completedComponents = useMemo(() => {
    return Object.values(assessmentData).reduce((domainTotal, domain) => {
      return (
        domainTotal +
        Object.values(domain.components).filter((component) => component.completed).length
      );
    }, 0);
  }, [assessmentData]);

  const progress = Math.round((completedComponents / totalComponents) * 100);

  const activeDomain = ASSESSMENT_DOMAINS[currentDomain];
  const activeComponentId = activeDomain.components[currentComponent];
  const isFinalStep =
    currentDomain === ASSESSMENT_DOMAINS.length - 1 &&
    currentComponent === activeDomain.components.length - 1;

  const ensureSession = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const response = await fetch('/api/assessment/baseline/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: {
            domains: ASSESSMENT_DOMAINS,
            startedAt: new Date().toISOString()
          }
        })
      });
      if (!response.ok) {
        throw new Error('Unable to allocate assessment session');
      }
      const record = (await response.json()) as { id: string };
      setSessionId(record.id);
    } catch (err) {
      console.warn(err);
      setError('Unable to start the baseline session. Please refresh and try again.');
    } finally {
      setSessionReady(true);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    if (!sessionReady && session?.user?.id) {
      void ensureSession();
    }
  }, [ensureSession, session?.user?.id, sessionReady]);

  useEffect(() => {
    setCurrentComponent(0);
  }, [currentDomain]);

  const updateAssessmentData = useCallback(
    (domainId: BaselineDomainId, componentId: string, patch: Partial<ComponentState> & { evidence?: ComponentEvidence | ComponentEvidence[] }) => {
      setAssessmentData((prev) => {
        const domain = prev[domainId] ?? { components: {} };
        const component = domain.components[componentId] ?? { evidence: [], completed: false };
        const evidence = patch.evidence
          ? [
              ...component.evidence,
              ...(Array.isArray(patch.evidence) ? patch.evidence : [patch.evidence])
            ]
          : component.evidence;

        return {
          ...prev,
          [domainId]: {
            components: {
              ...domain.components,
              [componentId]: {
                ...component,
                ...patch,
                evidence,
                completed: patch.completed ?? component.completed
              }
            }
          }
        };
      });
    },
    []
  );

  const persistComponentResult = useCallback(
    async (
      domainId: BaselineDomainId,
      componentId: string,
      payload: { modality: string; responses?: Record<string, unknown>; score?: number; confidence?: number; aiNotes?: string }
    ) => {
      if (!sessionId) return;
      try {
        await fetch('/api/assessment/baseline/components', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            domain: domainId,
            component: componentId,
            modality: payload.modality,
            responses: payload.responses,
            score: payload.score,
            confidence: payload.confidence,
            aiNotes: payload.aiNotes
          })
        });
      } catch (error) {
        console.warn('Unable to persist component result', error);
      }
    },
    [sessionId]
  );

  const registerQuestion = useCallback((question: Question) => {
    setQuestionsByDomain((prev) => ({
      ...prev,
      [question.domain]: [...(prev[question.domain] ?? []), question]
    }));
  }, []);

  const recordAnswer = useCallback(
    (question: Question, answer: string, validation: QuestionValidationResult) => {
      setResponses((prev) => ({
        ...prev,
        [question.id]: { answer, isCorrect: validation.isCorrect }
      }));
      setDomainGrades((prev) => ({
        ...prev,
        [question.domain]: validation.updatedDifficulty
      }));
      lastResultsRef.current[question.domain] = validation.isCorrect;
    },
    []
  );

  const registerSyntheticQuestion = useCallback(
    (domainId: BaselineDomainId, componentId: string, prompt: string, response: string, score?: number) => {
      const assessmentDomain = DOMAIN_TO_ASSESSMENT[domainId];
      const synthetic: Question = {
        id: `synthetic-${componentId}-${Date.now()}`,
        domain: assessmentDomain,
        content: prompt,
        type: 'OPEN_ENDED',
        difficulty: domainGrades[assessmentDomain],
        rubric: 'Speech sample reasoning'
      };
      registerQuestion(synthetic);
      setResponses((prev) => ({
        ...prev,
        [synthetic.id]: { answer: response, isCorrect: score ? score >= 0.7 : undefined }
      }));
    },
    [domainGrades, registerQuestion]
  );

  const handleComponentComplete = useCallback(
    async (domainId: BaselineDomainId, componentId: string, payload: ComponentCompletion) => {
      updateAssessmentData(domainId, componentId, {
        evidence: payload.evidence,
        score: payload.score,
        aiNotes: payload.aiNotes,
        completed: true
      });

      await persistComponentResult(domainId, componentId, payload);

      if (currentComponent < activeDomain.components.length - 1) {
        setCurrentComponent((prev) => prev + 1);
      } else if (currentDomain < ASSESSMENT_DOMAINS.length - 1) {
        setCurrentDomain((prev) => prev + 1);
      }
    },
    [activeDomain.components.length, currentComponent, currentDomain, persistComponentResult, updateAssessmentData]
  );

  const goPrevious = () => {
    if (currentComponent > 0) {
      setCurrentComponent((prev) => prev - 1);
      return;
    }
    if (currentDomain > 0) {
      const prevDomainIndex = currentDomain - 1;
      const prevDomain = ASSESSMENT_DOMAINS[prevDomainIndex];
      setCurrentDomain(prevDomainIndex);
      setCurrentComponent(prevDomain.components.length - 1);
    }
  };

  const submitAssessment = async () => {
    if (!session?.user?.id) return;
    setIsSubmitting(true);
    setError(null);
    const payloadQuestions = {
      READING: questionsByDomain.READING,
      MATH: questionsByDomain.MATH,
      SPEECH: questionsByDomain.SPEECH,
      SEL: questionsByDomain.SEL,
      SCIENCE: questionsByDomain.SCIENCE
    } satisfies Record<AssessmentDomainName, Question[]>;

    try {
      const response = await fetch('/api/assessment/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learnerId: session.user.id,
          questions: payloadQuestions,
          responses
        })
      });

      if (!response.ok) {
        throw new Error('Failed to complete assessment');
      }

      const result = await response.json();

      if (sessionId) {
        await fetch('/api/assessment/baseline/session', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            summary: assessmentData,
            multiModalPlan: {
              completedComponents,
              totalComponents,
              updatedAt: new Date().toISOString()
            }
          })
        }).catch((error) => console.warn('Unable to mark session complete', error));
      }

      router.push(`/learn/assessment/results/${result.id ?? result.results?.id ?? ''}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderActiveComponent = () => {
    const domainKey = activeDomain.id;
    const assessmentDomain = DOMAIN_TO_ASSESSMENT[domainKey];

    if (domainKey === 'speech_language') {
      return (
        <SpeechAssessment
          key={`${domainKey}-${activeComponentId}`}
          componentId={activeComponentId}
          sessionId={sessionId}
          onComplete={(payload) => handleComponentComplete(domainKey, activeComponentId, payload)}
          registerSyntheticQuestion={registerSyntheticQuestion}
        />
      );
    }

    if (domainKey === 'reading') {
      return (
        <ReadingAssessment
          key={`${domainKey}-${activeComponentId}`}
          componentId={activeComponentId}
          domain={assessmentDomain}
          gradeLevel={domainGrades[assessmentDomain]}
          registerQuestion={registerQuestion}
          recordAnswer={recordAnswer}
          lastResult={lastResultsRef.current[assessmentDomain]}
          onComplete={(payload) => handleComponentComplete(domainKey, activeComponentId, payload)}
        />
      );
    }

    if (domainKey === 'math') {
      return (
        <AdaptiveSkillCard
          key={`${domainKey}-${activeComponentId}`}
          domain={assessmentDomain}
          componentId={activeComponentId}
          badge="Problem solving"
          promptVariant="math"
          gradeLevel={domainGrades[assessmentDomain]}
          registerQuestion={registerQuestion}
          recordAnswer={recordAnswer}
          lastResult={lastResultsRef.current[assessmentDomain]}
          onComplete={(payload) => handleComponentComplete(domainKey, activeComponentId, payload)}
        />
      );
    }

    if (domainKey === 'science') {
      return (
        <AdaptiveSkillCard
          key={`${domainKey}-${activeComponentId}`}
          domain={assessmentDomain}
          componentId={activeComponentId}
          badge="Inquiry"
          promptVariant="science"
          gradeLevel={domainGrades[assessmentDomain]}
          registerQuestion={registerQuestion}
          recordAnswer={recordAnswer}
          lastResult={lastResultsRef.current[assessmentDomain]}
          onComplete={(payload) => handleComponentComplete(domainKey, activeComponentId, payload)}
        />
      );
    }

    return (
      <AdaptiveSkillCard
        key={`${domainKey}-${activeComponentId}`}
        domain={assessmentDomain}
        componentId={activeComponentId}
        badge="Emotion check"
        promptVariant="sel"
        gradeLevel={domainGrades[assessmentDomain]}
        registerQuestion={registerQuestion}
        recordAnswer={recordAnswer}
        lastResult={lastResultsRef.current[assessmentDomain]}
        onComplete={(payload) => handleComponentComplete(domainKey, activeComponentId, payload)}
      />
    );
  };

  if (!sessionReady) {
    return <ScreenMessage>Preparing your multi-modal baseline experience…</ScreenMessage>;
  }

  if (!session?.user) {
    return <ScreenMessage>Please sign in to continue.</ScreenMessage>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-theme-primary/5">
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>
              {activeDomain.name} · {activeComponentId.replace('_', ' ')}
            </span>
            <span>{progress}% complete</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3">
            <motion.div
              className="bg-gradient-to-r from-theme-primary to-pink-500 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </div>

      <div className="pt-24 pb-10 px-4">
        <div className="mx-auto max-w-5xl space-y-6">
          <header className="space-y-2">
            <p className="text-sm uppercase tracking-wide text-theme-primary">Comprehensive Baseline</p>
            <h1 className="text-4xl font-semibold text-slate-900">Multi-domain discovery</h1>
            <p className="text-slate-600">
              We will explore how you express ideas, solve problems, and navigate feelings using text, audio, and visuals. Take breaks as needed.
            </p>
          </header>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <p>{error}</p>
            </div>
          )}

          <AnimatePresence mode="wait">{renderActiveComponent()}</AnimatePresence>

          <div className="mt-8 flex flex-wrap gap-3 justify-between">
            <button
              onClick={goPrevious}
              disabled={currentDomain === 0 && currentComponent === 0}
              className="px-6 py-3 bg-white rounded-xl shadow-md disabled:opacity-50"
            >
              ← Previous
            </button>
            <div className="flex gap-3">
              {!isFinalStep && (
                <button
                  onClick={() => {
                    if (currentComponent < activeDomain.components.length - 1) {
                      setCurrentComponent((prev) => prev + 1);
                    } else if (currentDomain < ASSESSMENT_DOMAINS.length - 1) {
                      setCurrentDomain((prev) => prev + 1);
                    }
                  }}
                  className="px-6 py-3 bg-gradient-to-r from-theme-primary to-pink-500 text-white rounded-xl shadow-md"
                >
                  Next →
                </button>
              )}
              {isFinalStep && (
                <button
                  onClick={submitAssessment}
                  disabled={isSubmitting || completedComponents !== totalComponents}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Finishing…' : 'Finish Baseline'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ScreenMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950/80 p-6 text-slate-50">
      <div className="rounded-2xl bg-slate-900/80 p-8 text-center text-lg shadow-xl">{children}</div>
    </div>
  );
}

interface AdaptiveSkillCardProps {
  domain: AssessmentDomainName;
  componentId: string;
  promptVariant: 'math' | 'science' | 'sel' | 'reading';
  gradeLevel: number;
  badge: string;
  registerQuestion: (question: Question) => void;
  recordAnswer: (question: Question, answer: string, validation: QuestionValidationResult) => void;
  lastResult?: boolean;
  onComplete: (payload: ComponentCompletion) => void;
}

function AdaptiveSkillCard({
  domain,
  componentId,
  promptVariant,
  gradeLevel,
  badge,
  registerQuestion,
  recordAnswer,
  lastResult,
  onComplete
}: AdaptiveSkillCardProps) {
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState('');
  const [audioAnswer, setAudioAnswer] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchQuestion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/assessment/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          domain,
          gradeLevel,
          questionNumber: 0,
          previousResult: lastResult
        })
      });
      if (!response.ok) throw new Error('Unable to prepare the next prompt');
      const q = (await response.json()) as Question;
      setQuestion(q);
      registerQuestion(q);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [domain, gradeLevel, lastResult, registerQuestion]);

  useEffect(() => {
    setQuestion(null);
    setAnswer('');
    setAudioAnswer('');
    void fetchQuestion();
  }, [componentId, fetchQuestion]);

  const handleSubmit = async () => {
    if (!question) return;
    const submission = question.type === 'AUDIO_RESPONSE' ? audioAnswer : answer;
    if (!submission) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/assessment/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId: question.id, answer: submission })
      });
      if (!response.ok) throw new Error('Unable to score your response');
      const validation = (await response.json()) as QuestionValidationResult;
      recordAnswer(question, submission, validation);
      onComplete({
        evidence: [
          {
            prompt: question.content,
            response: submission,
            modality: question.type === 'AUDIO_RESPONSE' ? 'audio' : 'text',
            score: validation.isCorrect ? 1 : 0
          }
        ],
        score: validation.isCorrect ? 1 : 0,
        modality: question.type === 'AUDIO_RESPONSE' ? 'audio' : 'text',
        responses: { questionId: question.id, promptVariant }
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const canSubmit = question && (question.type === 'AUDIO_RESPONSE' ? Boolean(audioAnswer) : answer.trim().length > 0);

  return (
    <motion.div
      key={`${domain}-${componentId}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="rounded-3xl bg-white p-8 shadow-xl"
    >
      <div className="flex items-center gap-3 mb-4">
        <span className="rounded-full border border-theme-primary/20 px-3 py-1 text-xs font-semibold text-theme-primary uppercase">
          {badge}
        </span>
        <p className="text-sm text-slate-500">Grade target G{gradeLevel}</p>
      </div>

      {loading && !question && <p className="text-slate-500">Loading question…</p>}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {question && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getDomainIcon(domain)}</span>
            <div>
              <p className="text-sm uppercase tracking-wide text-theme-primary">{componentId.replace('_', ' ')}</p>
              <h2 className="text-2xl font-semibold text-slate-900">{question.content}</h2>
            </div>
          </div>

          {question.mediaUrl && (
            <div className="overflow-hidden rounded-2xl bg-slate-50">
              <Image
                src={question.mediaUrl}
                alt="Visual support"
                width={900}
                height={500}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {question.type === 'MULTIPLE_CHOICE' && question.options && (
            <div className="space-y-3">
              {question.options.map((option, idx) => (
                <button
                  key={option}
                  onClick={() => setAnswer(option)}
                  className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                    answer === option ? 'border-theme-primary bg-theme-primary/5' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="mr-3 font-semibold">{String.fromCharCode(65 + idx)}.</span>
                  {option}
                </button>
              ))}
            </div>
          )}

          {question.type === 'OPEN_ENDED' && (
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              className="w-full rounded-2xl border-2 border-slate-200 p-4 text-base shadow-inner focus:border-theme-primary focus:outline-none"
              rows={4}
              placeholder="Explain your thinking…"
            />
          )}

          {question.type === 'AUDIO_RESPONSE' && (
            <AudioRecorder onRecordComplete={(value) => setAudioAnswer(value)} />
          )}

          <div className="flex justify-end">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || loading}
              className="rounded-full bg-gradient-to-r from-theme-primary to-blue-500 px-8 py-3 font-semibold text-white shadow-lg transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              Submit response
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

interface ReadingAssessmentProps {
  componentId: string;
  domain: AssessmentDomainName;
  gradeLevel: number;
  registerQuestion: (question: Question) => void;
  recordAnswer: (question: Question, answer: string, validation: QuestionValidationResult) => void;
  lastResult?: boolean;
  onComplete: (payload: ComponentCompletion) => void;
}

function ReadingAssessment(props: ReadingAssessmentProps) {
  return (
    <div className="space-y-6">
      <AdaptiveSkillCard {...props} promptVariant="reading" badge="Reading" onComplete={props.onComplete} />
    </div>
  );
}

interface SpeechAssessmentProps {
  componentId: string;
  sessionId: string | null;
  registerSyntheticQuestion: (
    domainId: BaselineDomainId,
    componentId: string,
    prompt: string,
    response: string,
    score?: number
  ) => void;
  onComplete: (payload: ComponentCompletion) => void;
}

function SpeechAssessment({ componentId, sessionId, registerSyntheticQuestion, onComplete }: SpeechAssessmentProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [analysis, setAnalysis] = useState<SpeechAnalysisResult | null>(null);
  const [status, setStatus] = useState<string>('Ready to record');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioResult, setAudioResult] = useState<SpeechAnalysisResult | null>(null);
  const [namingResult, setNamingResult] = useState<{ evidence: ComponentEvidence[]; responses: string[]; score: number } | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setAnalysis(null);
    setAudioResult(null);
    setNamingResult(null);
    setHasSubmitted(false);
    setStatus('Ready to record');
  }, [componentId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await analyzeSpeech(blob);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setStatus('Recording…');
    } catch (error) {
      console.error(error);
      setStatus('Microphone unavailable');
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setIsRecording(false);
    setStatus('Processing sample…');
  };

  const analyzeSpeech = async (blob: Blob) => {
    const formData = new FormData();
    formData.append('audio', blob);
    formData.append('taskType', componentId);
    formData.append('component', componentId);
    if (sessionId) {
      formData.append('sessionId', sessionId);
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/assessment/speech/analyze', {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Unable to analyze speech sample');
      const result = await response.json();
      setAnalysis(result);
      setAudioResult(result);
      setStatus('Analysis complete');
      registerSyntheticQuestion(
        'speech_language',
        componentId,
        `Speech sample (${componentId})`,
        result.transcription,
        result.scores.intelligibility
      );
    } catch (error) {
      console.error(error);
      setStatus('Unable to analyze speech. Please retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const requiresNaming = componentId === 'expressive' || componentId === 'pragmatic';

  useEffect(() => {
    if (hasSubmitted) return;
    if (!audioResult) return;
    if (requiresNaming && !namingResult) return;

    const evidence: ComponentEvidence[] = [
      {
        prompt: `Speech sample (${componentId})`,
        response: audioResult.transcription ?? 'Sample captured',
        modality: 'audio',
        score: audioResult.scores?.intelligibility
      },
      ...(namingResult?.evidence ?? [])
    ];

    onComplete({
      evidence,
      score: Math.min(
        1,
        (audioResult.scores?.intelligibility ?? 0) * 0.6 + (namingResult?.score ?? 0) * 0.4
      ),
      modality: requiresNaming ? 'visual' : 'audio',
      responses: {
        audio: audioResult,
        naming: namingResult
      },
      aiNotes: audioResult.notes,
      confidence: audioResult.scores?.ageAppropriate ? 0.9 : 0.6
    });
    setHasSubmitted(true);
  }, [audioResult, componentId, hasSubmitted, namingResult, onComplete, requiresNaming]);

  return (
    <motion.div
      key={`speech-${componentId}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6 rounded-3xl bg-white p-8 shadow-xl"
    >
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-semibold text-slate-900">{componentId.replace('_', ' ')} focus</h2>
        <p className="text-slate-600">Practice with playful recordings then name the picture cards.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-theme-primary/10 bg-theme-primary/5 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Target sounds</h3>
          <div className="grid grid-cols-3 gap-3">
            {['buh', 'puh', 'muh', 'duh', 'tuh', 'kuh'].map((sound) => (
              <button
                key={sound}
                className="rounded-2xl bg-white/80 p-4 text-lg font-semibold shadow-sm hover:shadow"
                onClick={() => playTargetSound(sound)}
              >
                {sound}
              </button>
            ))}
          </div>
          <div className="mt-6 flex flex-col items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={isSubmitting}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-theme-primary to-pink-500 text-white font-semibold shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                🎤 {isSubmitting ? 'Analyzing…' : 'Start recording'}
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="px-8 py-3 rounded-full bg-red-500 text-white font-semibold shadow-lg animate-pulse"
              >
                ⏹️ Stop recording
              </button>
            )}
            <p className="text-sm text-slate-500">{status}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/60 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Picture naming</h3>
          <PictureNaming
            componentId={componentId}
            disabled={!requiresNaming}
            onFinished={(summary) => {
              registerSyntheticQuestion(
                'speech_language',
                `${componentId}-picture`,
                'Picture naming',
                summary.responses.join(', '),
                summary.score
              );
              setNamingResult(summary);
            }}
          />
        </div>
      </div>

      {analysis && (
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-6 text-sm text-emerald-800">
          <p className="font-semibold mb-2">AI insight</p>
          <p>{analysis.notes}</p>
        </div>
      )}
    </motion.div>
  );
}

function PictureNaming({
  componentId,
  disabled,
  onFinished
}: {
  componentId: string;
  disabled?: boolean;
  onFinished: (payload: { evidence: ComponentEvidence[]; responses: string[]; score: number }) => void;
}) {
  const cards = [
    { emoji: '🐱', label: 'cat' },
    { emoji: '🌳', label: 'tree' },
    { emoji: '🚀', label: 'rocket' }
  ];
  const [index, setIndex] = useState(0);
  const [responses, setResponses] = useState<string[]>([]);
  const [current, setCurrent] = useState('');

  useEffect(() => {
    setIndex(0);
    setResponses([]);
    setCurrent('');
  }, [componentId]);

  if (disabled) {
    return (
      <div className="rounded-2xl bg-white/70 p-6 text-center text-slate-500">
        Expressive naming is not required for this target. Focus on recording a clear sample.
      </div>
    );
  }

  const submit = () => {
    if (!current.trim()) return;
    const nextResponses = [...responses, current.trim()];
    setResponses(nextResponses);
    setCurrent('');
    if (index === cards.length - 1) {
      const score = nextResponses.filter((value, idx) => value.toLowerCase().includes(cards[idx].label)).length / cards.length;
      onFinished({
        responses: nextResponses,
        score,
        evidence: nextResponses.map((value, idx) => ({
          prompt: `Name the picture ${cards[idx].label}`,
          response: value,
          modality: 'visual',
          score: value.toLowerCase().includes(cards[idx].label) ? 1 : 0
        }))
      });
    } else {
      setIndex((prev) => prev + 1);
    }
  };

  const card = cards[index];
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-2 rounded-2xl bg-white/80 p-6 text-5xl shadow">
        <span>{card.emoji}</span>
        <p className="text-base text-slate-500">Describe this picture</p>
      </div>
      <input
        value={current}
        onChange={(event) => setCurrent(event.target.value)}
        placeholder="Type what you would say"
        className="w-full rounded-2xl border-2 border-slate-200 p-3 focus:border-theme-primary focus:outline-none"
      />
      <button
        onClick={submit}
        className="w-full rounded-2xl bg-theme-primary py-3 font-semibold text-white"
      >
        {index === cards.length - 1 ? 'Done' : 'Next card'}
      </button>
    </div>
  );
}

function playTargetSound(text: string) {
  if (typeof window === 'undefined') return;
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }
}

function getDomainIcon(domain: AssessmentDomainName) {
  switch (domain) {
    case 'READING':
      return '📖';
    case 'MATH':
      return '🔢';
    case 'SPEECH':
      return '💬';
    case 'SCIENCE':
      return '🔬';
    case 'SEL':
      return '❤️';
    default:
      return '🧠';
  }
}
