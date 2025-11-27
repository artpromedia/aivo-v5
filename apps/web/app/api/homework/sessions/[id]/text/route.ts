/**
 * Homework Text Input API Route
 * 
 * POST - Submit text input for a homework problem
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getHomeworkSessionById, 
  createHomeworkFile,
  createHomeworkWorkProduct,
  updateHomeworkSession
} from "@aivo/persistence";
import type { 
  SubmitTextInputRequest,
  ProblemAnalysis
} from "@aivo/api-client/src/homework-contracts";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: sessionId } = await params;
    const body: SubmitTextInputRequest = await request.json();

    if (!body.text || body.text.trim().length === 0) {
      return NextResponse.json(
        { error: "Text input is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const homeworkSession = await getHomeworkSessionById(sessionId, false);
    if (!homeworkSession) {
      return NextResponse.json(
        { error: "Homework session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Create a "virtual" file record for the text input
    const homeworkFile = await createHomeworkFile({
      sessionId,
      filename: "text-input.txt",
      mimeType: "text/plain",
      fileUrl: "",
      fileSize: body.text.length,
      inputType: "TEXT",
      extractedText: body.text.trim(),
      ocrStatus: "COMPLETE"
    });

    // Analyze the problem
    const analysis = await analyzeProblem(body.text);

    // Store the analysis as a work product
    await createHomeworkWorkProduct({
      sessionId,
      step: "UNDERSTAND",
      inputType: "text",
      inputData: { extractedText: body.text },
      outputData: analysis as unknown as Record<string, unknown>,
      confidence: analysis.confidence || 0.85
    });

    // Update session with detected subject/grade if not already set
    if (!homeworkSession.subject && analysis.subject) {
      await updateHomeworkSession(sessionId, {
        // subject: analysis.subject as string, - need to update schema
      });
    }

    return NextResponse.json({
      file: {
        ...homeworkFile,
        createdAt: homeworkFile.createdAt.toISOString(),
        updatedAt: homeworkFile.updatedAt.toISOString()
      },
      analysis
    });
  } catch (error) {
    console.error("Submit text input error:", error);
    return NextResponse.json(
      { error: "Failed to process text input" },
      { status: 500 }
    );
  }
}

/**
 * Analyze a homework problem using AI
 * This is a simplified analysis - in production, integrate with Claude/GPT
 */
async function analyzeProblem(text: string): Promise<ProblemAnalysis & { confidence?: number }> {
  const problemType = detectProblemType(text);
  const gradeLevel = estimateGradeLevel(text);
  const difficulty = estimateDifficulty(text, problemType);
  
  return {
    problemType,
    subject: inferSubject(problemType),
    gradeLevel,
    concepts: extractConcepts(text, problemType),
    prerequisites: getPrerequisites(problemType),
    difficulty,
    extractedProblem: text.trim(),
    visualElements: [],
    confidence: 0.85
  };
}

function detectProblemType(text: string): string {
  const lower = text.toLowerCase();
  
  // Math patterns
  if (/\b(solve|equation|=|find\s+x|x\s*[+=\-])\b/.test(lower)) return "algebra";
  if (/\b(area|perimeter|triangle|circle|angle|polygon|square|rectangle)\b/.test(lower)) return "geometry";
  if (/\b(fraction|numerator|denominator|mixed number)\b/.test(lower)) return "fractions";
  if (/\b(percent|%|discount|tax|interest|tip)\b/.test(lower)) return "percentages";
  if (/\b(ratio|proportion|scale)\b/.test(lower)) return "ratios";
  if (/\d+\s*[\+\-\*×÷\/]\s*\d+/.test(text)) return "arithmetic";
  if (/\b(how many|total|altogether|remaining|left|more than|less than)\b/.test(lower)) return "word_problem";
  
  // Science patterns
  if (/\b(cell|organism|photosynthesis|ecosystem)\b/.test(lower)) return "biology";
  if (/\b(atom|molecule|element|compound|reaction)\b/.test(lower)) return "chemistry";
  if (/\b(force|motion|energy|gravity|velocity)\b/.test(lower)) return "physics";
  
  // Language arts
  if (/\b(write|essay|paragraph|sentence|grammar)\b/.test(lower)) return "writing";
  if (/\b(read|comprehension|main idea|summary)\b/.test(lower)) return "reading";
  
  return "general";
}

function estimateGradeLevel(text: string): number {
  const lower = text.toLowerCase();
  
  // Advanced concepts (8th+)
  if (/\b(quadratic|polynomial|exponent|factor|theorem|proof)\b/.test(lower)) return 8;
  // Middle school (6-7)
  if (/\b(algebra|equation|variable|integer|negative)\b/.test(lower)) return 7;
  // Upper elementary (4-5)
  if (/\b(fraction|decimal|percent|division)\b/.test(lower)) return 5;
  // Lower elementary (2-3)
  if (/\b(multiplication|addition|subtraction)\b/.test(lower)) return 3;
  // Kindergarten-1st
  if (/\b(count|more|less|shape)\b/.test(lower)) return 1;
  
  // Default based on text complexity
  const words = text.split(/\s+/).length;
  if (words > 100) return 6;
  if (words > 50) return 4;
  return 3;
}

function inferSubject(problemType: string): string {
  const subjectMap: Record<string, string> = {
    algebra: "Mathematics - Algebra",
    geometry: "Mathematics - Geometry",
    fractions: "Mathematics - Fractions",
    percentages: "Mathematics - Percentages",
    ratios: "Mathematics - Ratios & Proportions",
    arithmetic: "Mathematics - Arithmetic",
    word_problem: "Mathematics - Word Problems",
    biology: "Science - Biology",
    chemistry: "Science - Chemistry",
    physics: "Science - Physics",
    writing: "Language Arts - Writing",
    reading: "Language Arts - Reading",
    general: "General Studies"
  };
  return subjectMap[problemType] || "General Studies";
}

function extractConcepts(text: string, problemType: string): string[] {
  const conceptMap: Record<string, string[]> = {
    algebra: ["Variables", "Equations", "Solving for unknowns", "Order of operations"],
    geometry: ["Shapes", "Measurements", "Spatial reasoning", "Formulas"],
    fractions: ["Parts of a whole", "Equivalent fractions", "Operations with fractions"],
    percentages: ["Part-whole relationships", "Ratios", "Decimal conversion"],
    ratios: ["Proportional relationships", "Cross multiplication", "Unit rates"],
    arithmetic: ["Basic operations", "Number sense", "Mental math"],
    word_problem: ["Reading comprehension", "Problem modeling", "Unit analysis", "Multi-step problems"],
    biology: ["Living organisms", "Life processes", "Classification"],
    chemistry: ["Matter", "Chemical changes", "Elements"],
    physics: ["Forces", "Energy", "Motion"],
    writing: ["Organization", "Grammar", "Expression"],
    reading: ["Comprehension", "Analysis", "Vocabulary"],
    general: ["Critical thinking", "Problem solving"]
  };
  return conceptMap[problemType] || conceptMap.general;
}

function getPrerequisites(problemType: string): string[] {
  const prerequisiteMap: Record<string, string[]> = {
    algebra: ["Basic arithmetic", "Understanding of variables", "Order of operations"],
    geometry: ["Basic shapes recognition", "Measurement units", "Basic multiplication"],
    fractions: ["Division concepts", "Part-whole understanding", "Multiplication"],
    percentages: ["Fractions", "Decimals", "Basic division"],
    ratios: ["Fractions", "Multiplication", "Division"],
    arithmetic: ["Number recognition", "Counting", "Place value"],
    word_problem: ["Reading comprehension", "Basic arithmetic", "Unit recognition"],
    biology: ["Basic scientific vocabulary", "Observation skills"],
    chemistry: ["Basic math", "Understanding of matter states"],
    physics: ["Basic math", "Measurement understanding"],
    writing: ["Basic grammar", "Vocabulary", "Sentence structure"],
    reading: ["Decoding skills", "Vocabulary knowledge"],
    general: ["Basic literacy", "Number sense"]
  };
  return prerequisiteMap[problemType] || prerequisiteMap.general;
}

function estimateDifficulty(text: string, problemType: string): "easy" | "medium" | "hard" {
  const words = text.split(/\s+/).length;
  const hasMultipleSteps = /\b(then|next|after|finally|first|second)\b/i.test(text);
  const hasLargeNumbers = /\d{4,}/.test(text);
  const hasComplexTerms = /\b(theorem|proof|derive|prove|explain why)\b/i.test(text);
  
  if (hasComplexTerms || hasMultipleSteps && hasLargeNumbers) return "hard";
  if (hasMultipleSteps || hasLargeNumbers || words > 100 || 
      problemType === "algebra" || problemType === "word_problem") return "medium";
  return "easy";
}
