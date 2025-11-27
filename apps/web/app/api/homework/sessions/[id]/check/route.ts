/**
 * Homework Check Solution API Route
 * 
 * POST - Check the learner's solution
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getHomeworkSessionById, 
  updateHomeworkSession,
  createHomeworkWorkProduct,
  getLatestWorkProductForStep
} from "@aivo/persistence";
import type { 
  CheckSolutionRequest,
  VerificationResult
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
    const body: CheckSolutionRequest = await request.json();

    if (!body.solution) {
      return NextResponse.json(
        { error: "Solution is required" },
        { status: 400 }
      );
    }

    // Verify session exists
    const homeworkSession = await getHomeworkSessionById(sessionId, true);
    if (!homeworkSession) {
      return NextResponse.json(
        { error: "Homework session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Get problem analysis for context
    const understandProduct = await getLatestWorkProductForStep(sessionId, "UNDERSTAND");
    const problemData = understandProduct?.outputData as Record<string, unknown> | undefined;

    // Verify the solution
    const verification = await verifySolution(
      body.solution,
      body.showWork,
      problemData,
      homeworkSession.difficultyMode
    );

    // Create work product for verification
    const workProduct = await createHomeworkWorkProduct({
      sessionId,
      step: "CHECK",
      inputType: "solution_check",
      inputData: {
        solution: body.solution,
        showWork: body.showWork
      },
      outputData: {
        isCorrect: verification.isCorrect,
        confidence: verification.confidence,
        feedback: verification.feedback,
        explanation: verification.explanation,
        commonMistakes: verification.commonMistakes,
        nextSteps: verification.nextSteps
      },
      confidence: verification.confidence
    });

    // Update session with verification result
    const updatedSession = await updateHomeworkSession(sessionId, {
      verificationResult: JSON.stringify(verification),
      finalAnswer: JSON.stringify(body.solution),
      ...(verification.isCorrect ? { status: "COMPLETE" as const, completedAt: new Date() } : {})
    });

    return NextResponse.json({
      verification,
      workProduct: {
        ...workProduct,
        createdAt: workProduct.createdAt.toISOString()
      },
      session: {
        ...updatedSession,
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString(),
        completedAt: updatedSession.completedAt?.toISOString() ?? null
      }
    });
  } catch (error) {
    console.error("Check solution error:", error);
    return NextResponse.json(
      { error: "Failed to check solution" },
      { status: 500 }
    );
  }
}

/**
 * Verify a solution
 * In production, this would use an AI service for accurate verification
 */
async function verifySolution(
  solution: string | Record<string, unknown>,
  showWork: string | undefined,
  problemData: Record<string, unknown> | undefined,
  difficultyMode: string
): Promise<VerificationResult> {
  const isSimplified = difficultyMode === "SIMPLIFIED";
  const solutionStr = typeof solution === "string" ? solution : JSON.stringify(solution);
  
  // Extract any numerical answer from the solution
  const numericalMatch = solutionStr.match(/-?\d+\.?\d*/);
  const numericalAnswer = numericalMatch ? parseFloat(numericalMatch[0]) : null;

  // Basic validation checks
  const hasAnswer = solutionStr.trim().length > 0;
  const hasWork = showWork && showWork.trim().length > 0;
  const problemType = problemData?.problemType as string;

  // In a real implementation, we would:
  // 1. Parse the original problem
  // 2. Solve it ourselves or use an AI
  // 3. Compare answers
  // For now, we'll do basic plausibility checks

  const checks = performBasicChecks(solutionStr, showWork, problemData);
  
  // Generate appropriate feedback
  const feedback = generateFeedback(checks, isSimplified);
  const explanation = generateExplanation(checks, problemData, isSimplified);

  // Determine if correct (simplified for demo - would be AI-driven in production)
  const isCorrect = checks.hasValidFormat && checks.hasReasonableValue;
  const confidence = calculateConfidence(checks);

  return {
    isCorrect,
    confidence,
    feedback: isCorrect ? feedback.correct : feedback.incorrect,
    explanation,
    commonMistakes: getCommonMistakes(problemType, isSimplified),
    nextSteps: isCorrect 
      ? getNextStepsForCorrect(problemType, isSimplified)
      : getNextStepsForIncorrect(checks, isSimplified)
  };
}

interface SolutionChecks {
  hasValidFormat: boolean;
  hasReasonableValue: boolean;
  hasShowWork: boolean;
  hasCorrectUnits: boolean;
  showsUnderstanding: boolean;
  potentialIssues: string[];
}

function performBasicChecks(
  solution: string,
  showWork: string | undefined,
  problemData: Record<string, unknown> | undefined
): SolutionChecks {
  const issues: string[] = [];

  // Check for valid format
  const hasValidFormat = solution.trim().length > 0 && 
    !solution.toLowerCase().includes("i don't know");

  // Check for reasonable value (basic heuristics)
  const numericalMatch = solution.match(/-?\d+\.?\d*/);
  let hasReasonableValue = true;
  if (numericalMatch) {
    const value = parseFloat(numericalMatch[0]);
    // Flag extremely large or suspicious values
    if (Math.abs(value) > 1000000) {
      hasReasonableValue = false;
      issues.push("Answer seems unusually large");
    }
    if (isNaN(value)) {
      hasReasonableValue = false;
      issues.push("Could not parse numerical answer");
    }
  }

  // Check for show work
  const hasShowWork = !!showWork && showWork.trim().length > 10;
  if (!hasShowWork) {
    issues.push("Work not shown");
  }

  // Check for units if expected
  const problemType = problemData?.problemType as string;
  const expectsUnits = ["geometry", "word_problem", "percentages"].includes(problemType);
  const hasCorrectUnits = !expectsUnits || /[a-zA-Z]+/.test(solution);
  if (expectsUnits && !hasCorrectUnits) {
    issues.push("Units may be missing");
  }

  // Check if work shows understanding
  const showsUnderstanding = hasShowWork && (
    showWork.includes("=") ||
    showWork.includes("+") ||
    showWork.includes("-") ||
    showWork.includes("*") ||
    showWork.includes("/") ||
    showWork.split("\n").length > 1
  );

  return {
    hasValidFormat,
    hasReasonableValue,
    hasShowWork,
    hasCorrectUnits,
    showsUnderstanding,
    potentialIssues: issues
  };
}

function generateFeedback(
  checks: SolutionChecks,
  isSimplified: boolean
): { correct: string; incorrect: string } {
  if (isSimplified) {
    return {
      correct: checks.hasShowWork 
        ? "Great job! You got the right answer AND showed your work! ⭐"
        : "You got the answer right! Next time, try showing your work too.",
      incorrect: checks.hasShowWork
        ? "Good try! You showed your work, which is great. Let's look at where things went differently."
        : "Let's try again! Remember to show your steps - it helps catch mistakes."
    };
  }

  return {
    correct: checks.hasShowWork
      ? "Correct! Your solution demonstrates solid understanding and clear work."
      : "Correct answer. Consider showing your work for full credit in formal settings.",
    incorrect: checks.hasShowWork
      ? "The answer appears incorrect, but your work shows good problem-solving approach. Let's identify where the error occurred."
      : "The answer doesn't appear correct. Try showing your work step-by-step to identify where the process went wrong."
  };
}

function generateExplanation(
  checks: SolutionChecks,
  problemData: Record<string, unknown> | undefined,
  isSimplified: boolean
): string {
  const problemType = problemData?.problemType as string || "general";
  const issues = checks.potentialIssues;

  if (issues.length === 0 && checks.hasValidFormat && checks.hasReasonableValue) {
    return isSimplified
      ? "Your answer looks good! The way you solved it makes sense."
      : "Your solution demonstrates correct application of the relevant concepts and procedures.";
  }

  // Build explanation based on issues
  let explanation = isSimplified
    ? "Here's what I noticed: "
    : "Analysis of your solution: ";

  if (issues.includes("Answer seems unusually large")) {
    explanation += isSimplified
      ? "Your answer is really big. Double-check your calculations! "
      : "The magnitude of your answer seems unexpectedly large. Review each calculation step. ";
  }

  if (issues.includes("Work not shown")) {
    explanation += isSimplified
      ? "Showing your work helps you (and me!) see how you got your answer. "
      : "Showing intermediate steps helps identify errors and demonstrates understanding. ";
  }

  if (issues.includes("Units may be missing")) {
    explanation += isSimplified
      ? "Don't forget to include what you're measuring (like 'cm' or 'apples')! "
      : "Include appropriate units to make your answer complete and contextually meaningful. ";
  }

  return explanation.trim();
}

function calculateConfidence(checks: SolutionChecks): number {
  let confidence = 0.5; // Base confidence

  if (checks.hasValidFormat) confidence += 0.1;
  if (checks.hasReasonableValue) confidence += 0.15;
  if (checks.hasShowWork) confidence += 0.1;
  if (checks.showsUnderstanding) confidence += 0.1;
  if (checks.hasCorrectUnits) confidence += 0.05;

  // Reduce confidence for each issue
  confidence -= checks.potentialIssues.length * 0.1;

  // Clamp between 0 and 1
  return Math.max(0, Math.min(1, confidence));
}

function getCommonMistakes(problemType: string, isSimplified: boolean): string[] {
  const mistakes: Record<string, { simplified: string[]; standard: string[] }> = {
    arithmetic: {
      simplified: [
        "Forgetting to carry numbers when adding",
        "Subtracting in the wrong order",
        "Mixing up multiplication and addition"
      ],
      standard: [
        "Place value misalignment in multi-digit operations",
        "Incorrect regrouping/borrowing",
        "Order of operations errors"
      ]
    },
    algebra: {
      simplified: [
        "Doing different things to each side of the equation",
        "Forgetting negative signs",
        "Making arithmetic mistakes while solving"
      ],
      standard: [
        "Not applying operations to both sides equally",
        "Sign errors during manipulation",
        "Distribution errors with parentheses"
      ]
    },
    word_problem: {
      simplified: [
        "Using the wrong operation (adding instead of subtracting)",
        "Missing a step in multi-step problems",
        "Forgetting to answer the actual question"
      ],
      standard: [
        "Misidentifying the required operation",
        "Incomplete solution for multi-step problems",
        "Providing numerical answer without context"
      ]
    },
    geometry: {
      simplified: [
        "Using the wrong formula",
        "Forgetting to include units",
        "Mixing up area and perimeter"
      ],
      standard: [
        "Formula misapplication",
        "Unit inconsistencies",
        "Confusion between area and perimeter concepts"
      ]
    },
    fractions: {
      simplified: [
        "Forgetting to find a common denominator",
        "Only adding the top numbers",
        "Not simplifying the answer"
      ],
      standard: [
        "Adding/subtracting without common denominators",
        "Operating on numerators without adjusting denominators",
        "Not reducing to lowest terms"
      ]
    }
  };

  const typeMistakes = mistakes[problemType] || mistakes.arithmetic;
  return isSimplified ? typeMistakes.simplified : typeMistakes.standard;
}

function getNextStepsForCorrect(problemType: string, isSimplified: boolean): string[] {
  if (isSimplified) {
    return [
      "Try another problem like this one!",
      "Can you explain how you solved it?",
      "Challenge yourself with a harder version!"
    ];
  }

  return [
    "Practice similar problems to reinforce this skill",
    "Try explaining your method to someone else",
    "Attempt more challenging variations of this problem type"
  ];
}

function getNextStepsForIncorrect(checks: SolutionChecks, isSimplified: boolean): string[] {
  const steps: string[] = [];

  if (!checks.hasShowWork) {
    steps.push(isSimplified 
      ? "Write down each step as you solve"
      : "Show all intermediate steps in your work"
    );
  }

  if (!checks.hasReasonableValue) {
    steps.push(isSimplified
      ? "Check if your answer makes sense for the problem"
      : "Verify the reasonableness of your answer given the context"
    );
  }

  if (checks.potentialIssues.length > 0) {
    steps.push(isSimplified
      ? "Look back at each step carefully"
      : "Review each step of your calculation for potential errors"
    );
  }

  // Always suggest trying again
  steps.push(isSimplified
    ? "Try the problem again - you can do it!"
    : "Reattempt the problem using the feedback provided"
  );

  return steps;
}
