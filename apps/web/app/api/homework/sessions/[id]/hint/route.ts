/**
 * Homework Hint API Route
 * 
 * POST - Request a hint for the current step
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyRateLimit, addRateLimitHeaders } from "@/lib/middleware/rate-limit";
import { 
  getHomeworkSessionById, 
  createHomeworkHint,
  countHintsForSessionStep,
  incrementHomeworkHints,
  getLatestWorkProductForStep
} from "@aivo/persistence";
import type { 
  RequestHintRequest,
  HomeworkHintType,
  HomeworkSessionStatus
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

    // Apply rate limiting (AI tier: 20 requests per minute per user)
    const { response: rateLimitResponse, result: rateLimitResult } = await applyRateLimit(
      request,
      { tier: 'ai', userId: session.user.id }
    );
    
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    const { id: sessionId } = await params;
    const body: RequestHintRequest = await request.json();

    // Verify session exists
    const homeworkSession = await getHomeworkSessionById(sessionId, true);
    if (!homeworkSession) {
      return NextResponse.json(
        { error: "Homework session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if session is complete
    if (homeworkSession.status === "COMPLETE") {
      return NextResponse.json(
        { error: "Cannot request hints for a completed session", code: "SESSION_ALREADY_COMPLETE" },
        { status: 400 }
      );
    }

    const currentStep = body.step || homeworkSession.status;
    
    // Count existing hints for this step
    const hintsUsed = await countHintsForSessionStep(sessionId, currentStep);
    const maxHints = homeworkSession.maxHintsPerStep;

    if (hintsUsed >= maxHints) {
      return NextResponse.json(
        { 
          error: `Maximum hints (${maxHints}) reached for this step`,
          code: "MAX_HINTS_REACHED",
          hintsRemaining: 0
        },
        { status: 400 }
      );
    }

    // Get work product for context
    const workProduct = await getLatestWorkProductForStep(sessionId, currentStep);
    
    // Determine hint type based on progression
    // First hint: NUDGE (gentle push)
    // Second hint: EXPLANATION (more detailed)
    // Third hint: EXAMPLE or DIRECT (most help)
    const hintType = body.hintType || determineHintType(hintsUsed);
    
    // Generate hint content based on step and context
    const hintContent = await generateHint(
      currentStep,
      hintType,
      workProduct?.outputData as Record<string, unknown> | undefined,
      body.context,
      homeworkSession.difficultyMode
    );

    // Create hint record
    const hint = await createHomeworkHint({
      sessionId,
      step: currentStep,
      hintNumber: hintsUsed + 1,
      hintType,
      content: hintContent.hint
    });

    // Increment hint counters
    await incrementHomeworkHints(sessionId);

    const response = NextResponse.json({
      hint: {
        ...hint,
        createdAt: hint.createdAt.toISOString()
      },
      hintsRemaining: maxHints - hintsUsed - 1,
      suggestions: hintContent.suggestions
    });
    
    return addRateLimitHeaders(response, rateLimitResult);
  } catch (error) {
    console.error("Request hint error:", error);
    return NextResponse.json(
      { error: "Failed to generate hint" },
      { status: 500 }
    );
  }
}

/**
 * Determine hint type based on progression
 */
function determineHintType(hintsUsed: number): HomeworkHintType {
  if (hintsUsed === 0) return "NUDGE";
  if (hintsUsed === 1) return "EXPLANATION";
  return "EXAMPLE";
}

/**
 * Generate hint content based on context
 * In production, this would call an AI service
 */
async function generateHint(
  step: HomeworkSessionStatus,
  hintType: HomeworkHintType,
  workProduct: Record<string, unknown> | undefined,
  context: string | undefined,
  difficultyMode: string
): Promise<{ hint: string; suggestions: string[] }> {
  // Get step-specific hints
  const stepHints = getStepHints(step, hintType, difficultyMode);
  
  // Add context-specific information if available
  if (workProduct) {
    const problemType = workProduct.problemType as string;
    if (problemType) {
      const typeHints = getTypeSpecificHints(problemType, step, hintType);
      return {
        hint: typeHints.hint,
        suggestions: typeHints.suggestions
      };
    }
  }

  return stepHints;
}

/**
 * Get hints specific to the current step
 */
function getStepHints(
  step: HomeworkSessionStatus,
  hintType: HomeworkHintType,
  difficultyMode: string
): { hint: string; suggestions: string[] } {
  const isSimplified = difficultyMode === "SIMPLIFIED";
  
  const hints: Record<HomeworkSessionStatus, Record<HomeworkHintType, { hint: string; suggestions: string[] }>> = {
    UNDERSTAND: {
      NUDGE: {
        hint: isSimplified 
          ? "Let's read the problem together. What words do you already know?"
          : "Take your time reading the problem. What is it asking you to find?",
        suggestions: ["Read the problem slowly", "Circle important numbers", "Underline what you need to find"]
      },
      EXPLANATION: {
        hint: isSimplified
          ? "Good job! Now let's find the important parts. Look for numbers and key words like 'total', 'left', or 'each'."
          : "Look for key information: What numbers are given? What operation words do you see (total, difference, product)?",
        suggestions: ["List what you know", "List what you need to find", "Draw a picture if it helps"]
      },
      EXAMPLE: {
        hint: isSimplified
          ? "Here's an example: If a problem says 'Sam has 3 apples and gets 2 more', the key parts are: Sam's apples (3), more apples (2), and we need to find the total."
          : "Example: 'Maria has 15 stickers and gives away 7.' Key parts: starting amount (15), amount given away (7), need to find what's left.",
        suggestions: ["Try marking up the problem like this", "Write down what you know and don't know"]
      },
      DIRECT: {
        hint: isSimplified
          ? "I'll help you break it down step by step. First, let's identify every number in the problem together."
          : "Let me help you identify the key components. The problem is asking for...",
        suggestions: ["Follow along with my example", "Ask if anything is confusing"]
      }
    },
    PLAN: {
      NUDGE: {
        hint: isSimplified
          ? "What kind of math might we use? Adding, subtracting, multiplying, or dividing?"
          : "Think about what operation you need. Are you combining, separating, sharing equally, or making groups?",
        suggestions: ["Think about the action in the problem", "What math words do you see?"]
      },
      EXPLANATION: {
        hint: isSimplified
          ? "Keywords can help! 'More', 'total', 'altogether' usually mean adding. 'Left', 'remaining', 'difference' usually mean subtracting."
          : "Match the problem to an operation: Addition (combining), Subtraction (taking away), Multiplication (equal groups), Division (sharing equally).",
        suggestions: ["Make a keyword list", "Draw what's happening", "Write a number sentence"]
      },
      EXAMPLE: {
        hint: isSimplified
          ? "Example plan: 1) Write down the numbers. 2) Decide if we add or subtract. 3) Do the math. 4) Check if it makes sense."
          : "Example plan for a word problem: 1) Identify given values. 2) Determine operation needed. 3) Set up equation. 4) Solve. 5) Verify answer makes sense.",
        suggestions: ["Follow these steps", "Adjust for your specific problem"]
      },
      DIRECT: {
        hint: isSimplified
          ? "Let's make a plan together. We'll use [operation] because [reason]. Our steps will be..."
          : "Here's a suggested approach based on the problem type...",
        suggestions: ["Try this plan", "Modify as needed"]
      }
    },
    SOLVE: {
      NUDGE: {
        hint: isSimplified
          ? "You can do this! Start with the first step in your plan. What number do you write first?"
          : "Begin with your first step. Write out each part of your work - it helps you stay organized!",
        suggestions: ["Write out each step", "Show your work", "Take it one step at a time"]
      },
      EXPLANATION: {
        hint: isSimplified
          ? "Let's work through it together. When we add, we can count up. When we subtract, we can count back."
          : "Remember your strategies: For addition, you can count on or use place value. For subtraction, you can count back or find the difference.",
        suggestions: ["Use a number line if it helps", "Break big numbers into smaller parts"]
      },
      EXAMPLE: {
        hint: isSimplified
          ? "Watch how I solve a similar problem: [Step-by-step example with simple numbers]"
          : "Here's a worked example with similar numbers: [Detailed solution showing work]",
        suggestions: ["Follow the same steps", "Check each calculation"]
      },
      DIRECT: {
        hint: isSimplified
          ? "Here's the next step in the calculation... Try finishing from here!"
          : "For this specific problem, the next step would be... Can you continue from here?",
        suggestions: ["Complete the remaining steps", "Double-check your arithmetic"]
      }
    },
    CHECK: {
      NUDGE: {
        hint: isSimplified
          ? "Great job getting an answer! Now let's make sure it's right. Does your answer make sense?"
          : "Time to verify! Does your answer seem reasonable given the problem context?",
        suggestions: ["Read the problem again", "Check if your answer fits the question"]
      },
      EXPLANATION: {
        hint: isSimplified
          ? "To check, try the opposite operation! If you added, subtract your answer. Do you get back to the starting number?"
          : "Verify using inverse operations or estimation. You can also plug your answer back into the original problem.",
        suggestions: ["Use inverse operations", "Estimate to check reasonableness", "Re-read what the question asked"]
      },
      EXAMPLE: {
        hint: isSimplified
          ? "Example check: If 5 + 3 = 8, we can check by doing 8 - 3 = 5. It matches!"
          : "Example verification: Problem asked for total cost. Answer: $25. Check: $15 + $10 = $25 ✓ And $25 is reasonable for buying two items.",
        suggestions: ["Try this checking method", "Make sure units match"]
      },
      DIRECT: {
        hint: isSimplified
          ? "Let me help you check. Your answer was [X]. Let's verify by..."
          : "Let's verify your answer step by step. We'll use [method] to confirm...",
        suggestions: ["Follow the verification steps", "Correct if needed"]
      }
    },
    COMPLETE: {
      NUDGE: { hint: "Great work completing this problem!", suggestions: [] },
      EXPLANATION: { hint: "You've finished! Review what you learned.", suggestions: [] },
      EXAMPLE: { hint: "Problem complete! Try a similar one to practice.", suggestions: [] },
      DIRECT: { hint: "Excellent job! You've mastered this problem.", suggestions: [] }
    }
  };

  return hints[step][hintType];
}

/**
 * Get type-specific hints for different problem types
 */
function getTypeSpecificHints(
  problemType: string,
  step: HomeworkSessionStatus,
  hintType: HomeworkHintType
): { hint: string; suggestions: string[] } {
  // Algebra-specific hints
  if (problemType === "algebra" && step === "SOLVE") {
    if (hintType === "NUDGE") {
      return {
        hint: "To solve for the variable, think about 'undoing' what's been done to it. Work backwards!",
        suggestions: ["Identify operations applied to the variable", "Do the opposite operation to both sides"]
      };
    }
    if (hintType === "EXPLANATION") {
      return {
        hint: "Follow these steps: 1) Simplify each side. 2) Get all variable terms on one side. 3) Get all constants on the other side. 4) Divide to isolate the variable.",
        suggestions: ["Keep the equation balanced", "Whatever you do to one side, do to the other"]
      };
    }
  }

  // Geometry-specific hints
  if (problemType === "geometry" && step === "PLAN") {
    if (hintType === "EXPLANATION") {
      return {
        hint: "Identify the shape and recall its formulas. Area formulas: Rectangle = l×w, Triangle = ½×b×h, Circle = πr²",
        suggestions: ["Draw and label the shape", "Write down the formula you need"]
      };
    }
  }

  // Word problem-specific hints
  if (problemType === "word_problem" && step === "UNDERSTAND") {
    if (hintType === "EXPLANATION") {
      return {
        hint: "For word problems: 1) Read the entire problem. 2) Identify what's being asked. 3) Find all given information. 4) Look for keywords that indicate operations.",
        suggestions: ["Highlight or underline key numbers", "Circle the question", "List known vs unknown"]
      };
    }
  }

  // Fractions-specific hints
  if (problemType === "fractions" && step === "SOLVE") {
    if (hintType === "EXPLANATION") {
      return {
        hint: "For fraction operations: Same denominators - add/subtract numerators. Different denominators - find common denominator first. Multiplying - multiply straight across. Dividing - flip the second fraction and multiply.",
        suggestions: ["Find common denominators for addition/subtraction", "Simplify your final answer"]
      };
    }
  }

  // Default to step hints
  return getStepHints(step, hintType, "SCAFFOLDED");
}
