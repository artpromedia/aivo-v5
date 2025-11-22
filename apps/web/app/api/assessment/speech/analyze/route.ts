import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SpeechAnalysisEngine } from "@/lib/speech/analysis-engine";
import { baselineAssessmentService } from "@/lib/assessments/baseline-service";
import { BaselineDomainEnum } from "@/types/baseline";

const analyzer = new SpeechAnalysisEngine();

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const learner = await prisma.learner.findFirst({
    where: { userId: session.user.id },
    select: { id: true, dateOfBirth: true }
  });

  if (!learner) {
    return NextResponse.json({ error: "Learner profile not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const audioFile = formData.get("audio");
  if (!(audioFile instanceof File)) {
    return NextResponse.json({ error: "Audio blob missing" }, { status: 400 });
  }

  const taskType = String(formData.get("taskType") ?? "articulation");
  const component = String(formData.get("component") ?? taskType);
  const expectedResponse = formData.get("expectedResponse")?.toString();
  const providedSessionId = formData.get("sessionId")?.toString();

  const buffer = Buffer.from(await audioFile.arrayBuffer());

  const [analysis, phonemes] = await Promise.all([
    analyzer.analyze({ audioBuffer: buffer, taskType, expectedResponse }),
    analyzer.analyzePhonemes(buffer)
  ]);
  const errors = analyzer.identifyErrors(phonemes);
  const ageYears = calculateAge(learner.dateOfBirth);
  const ageAppropriate = analyzer.isAgeAppropriate(errors, ageYears);

  const base64 = buffer.toString("base64");

  const sessionRecord = await resolveSessionId(learner.id, providedSessionId);

  const sample = await baselineAssessmentService.recordSpeechSample({
    learnerId: learner.id,
    sessionId: sessionRecord.id,
    taskType,
    component,
    audioFormat: audioFile.type || "audio/webm",
    audioBase64: base64,
    durationMs: analysis.durationMs,
    articulation: analysis.articulationScore,
    fluency: analysis.fluencyScore,
    intelligibility: analysis.intelligibilityRating,
    analysis: {
      transcription: analysis.transcription,
      notes: analysis.notes,
      phonemes
    },
    metadata: {
      expectedResponse,
      size: buffer.length,
      mimeType: audioFile.type,
      ageYears
    }
  });

  await baselineAssessmentService.recordDomainResult({
    sessionId: sessionRecord.id,
    domain: BaselineDomainEnum.SPEECH_LANGUAGE,
    component,
    modality: "audio",
    responses: {
      transcription: analysis.transcription,
      errors,
      taskType
    },
    score: analysis.intelligibilityRating,
    confidence: ageAppropriate ? 0.9 : 0.6,
    aiNotes: analysis.notes
  });

  const scores = {
    articulation: analysis.articulationScore,
    fluency: analysis.fluencyScore,
    prosody: analysis.prosodyScore,
    intelligibility: analysis.intelligibilityRating,
    errors,
    ageAppropriate
  };

  return NextResponse.json({
    sampleId: sample.id,
    sessionId: sessionRecord.id,
    transcription: analysis.transcription,
    scores,
    phonemes,
    notes: analysis.notes,
    durationMs: analysis.durationMs
  });
}

async function resolveSessionId(learnerId: string, sessionId?: string | null) {
  if (sessionId) {
    const existing = await prisma.baselineAssessmentSession.findFirst({
      where: { id: sessionId, learnerId }
    });
    if (existing) {
      return existing;
    }
  }

  return baselineAssessmentService.getOrCreateSession(learnerId);
}

function calculateAge(dateOfBirth?: Date | null) {
  if (!dateOfBirth) return 10;
  const now = new Date();
  let age = now.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = now.getMonth() - dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dateOfBirth.getDate())) {
    age -= 1;
  }
  return Math.max(3, age);
}
