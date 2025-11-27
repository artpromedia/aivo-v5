/**
 * Homework Step Progression API Route
 * 
 * POST - Progress to the next step in the homework workflow
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { 
  getHomeworkSessionById, 
  updateHomeworkSession,
  createHomeworkWorkProduct,
  resetCurrentStepHints,
  getLatestWorkProductForStep
} from "@aivo/persistence";
import type { 
  ProgressStepRequest,
  HomeworkSessionStatus,
  SolutionPlan,
  SolutionStep
} from "@aivo/api-client/src/homework-contracts";

export const dynamic = "force-dynamic";

// Step progression order
const STEP_ORDER: HomeworkSessionStatus[] = ["UNDERSTAND", "PLAN", "SOLVE", "CHECK", "COMPLETE"];

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
    const body: ProgressStepRequest = await request.json();

    // Verify session exists
    const homeworkSession = await getHomeworkSessionById(sessionId, true);
    if (!homeworkSession) {
      return NextResponse.json(
        { error: "Homework session not found", code: "SESSION_NOT_FOUND" },
        { status: 404 }
      );
    }

    // Check if session is already complete
    if (homeworkSession.status === "COMPLETE") {
      return NextResponse.json(
        { error: "Session is already complete", code: "SESSION_ALREADY_COMPLETE" },
        { status: 400 }
      );
    }

    const currentStep = body.currentStep || homeworkSession.status;
    const currentIndex = STEP_ORDER.indexOf(currentStep);
    
    // Validate step transition
    if (currentIndex === -1 || currentIndex >= STEP_ORDER.length - 1) {
      return NextResponse.json(
        { error: "Invalid step transition", code: "INVALID_STEP_TRANSITION" },
        { status: 400 }
      );
    }

    const nextStep = STEP_ORDER[currentIndex + 1];

    // Create work product for current step completion
    const workProduct = await createHomeworkWorkProduct({
      sessionId,
      step: currentStep,
      inputType: "step_completion",
      inputData: body.inputData,
      outputData: {
        completedAt: new Date().toISOString(),
        transitionTo: nextStep,
        ...body.inputData
      },
      confidence: 1.0
    });

    // Reset hint counter for new step
    await resetCurrentStepHints(sessionId);

    // Update session status
    const updateData: Record<string, unknown> = { status: nextStep };
    if (nextStep === "COMPLETE") {
      updateData.completedAt = new Date();
    }

    const updatedSession = await updateHomeworkSession(sessionId, updateData as { status: HomeworkSessionStatus; completedAt?: Date });

    // Generate guidance for next step
    const nextStepGuidance = await generateStepGuidance(
      nextStep, 
      sessionId,
      homeworkSession.difficultyMode
    );

    return NextResponse.json({
      session: {
        ...updatedSession,
        createdAt: updatedSession.createdAt.toISOString(),
        updatedAt: updatedSession.updatedAt.toISOString(),
        completedAt: updatedSession.completedAt?.toISOString() ?? null
      },
      workProduct: {
        ...workProduct,
        createdAt: workProduct.createdAt.toISOString()
      },
      nextStepGuidance
    });
  } catch (error) {
    console.error("Progress step error:", error);
    return NextResponse.json(
      { error: "Failed to progress to next step" },
      { status: 500 }
    );
  }
}

/**
 * Generate guidance for the next step
 */
async function generateStepGuidance(
  step: HomeworkSessionStatus,
  sessionId: string,
  difficultyMode: string
): Promise<SolutionPlan | SolutionStep[] | null> {
  const isSimplified = difficultyMode === "SIMPLIFIED";

  // Get problem analysis from UNDERSTAND step
  const understandProduct = await getLatestWorkProductForStep(sessionId, "UNDERSTAND");
  const problemData = understandProduct?.outputData as Record<string, unknown> | undefined;

  switch (step) {
    case "PLAN":
      return generatePlanGuidance(problemData, isSimplified);
    
    case "SOLVE":
      // Get plan from PLAN step
      const planProduct = await getLatestWorkProductForStep(sessionId, "PLAN");
      return generateSolveGuidance(problemData, planProduct?.outputData as Record<string, unknown> | undefined, isSimplified);
    
    case "CHECK":
      return generateCheckGuidance(problemData, isSimplified);
    
    case "COMPLETE":
      return null;
    
    default:
      return null;
  }
}

/**
 * Generate planning guidance
 */
function generatePlanGuidance(
  problemData: Record<string, unknown> | undefined,
  isSimplified: boolean
): SolutionPlan {
  const problemType = (problemData?.problemType as string) || "general";
  const difficulty = (problemData?.difficulty as string) || "medium";

  // Base steps for different problem types
  const planSteps = getPlanStepsForType(problemType, isSimplified);

  return {
    steps: planSteps,
    estimatedTime: calculateEstimatedTime(problemType, difficulty),
    suggestedApproach: getSuggestedApproach(problemType, isSimplified),
    alternativeApproaches: getAlternativeApproaches(problemType)
  };
}

function getPlanStepsForType(
  problemType: string, 
  isSimplified: boolean
): Array<{ stepNumber: number; description: string; skill: string; estimatedDifficulty: "easy" | "medium" | "hard" }> {
  const simplifiedSteps = {
    arithmetic: [
      { stepNumber: 1, description: "Write down the numbers you see", skill: "Number recognition", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Decide if you add, subtract, multiply, or divide", skill: "Operation selection", estimatedDifficulty: "easy" as const },
      { stepNumber: 3, description: "Do the math step by step", skill: "Computation", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Write your answer", skill: "Answer writing", estimatedDifficulty: "easy" as const }
    ],
    word_problem: [
      { stepNumber: 1, description: "Read the story problem", skill: "Reading comprehension", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Find the important numbers", skill: "Information extraction", estimatedDifficulty: "medium" as const },
      { stepNumber: 3, description: "Decide what math to use", skill: "Operation selection", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Solve and write your answer in words", skill: "Problem solving", estimatedDifficulty: "medium" as const }
    ],
    algebra: [
      { stepNumber: 1, description: "Find the equation or expression", skill: "Equation identification", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Identify what you're solving for", skill: "Variable recognition", estimatedDifficulty: "easy" as const },
      { stepNumber: 3, description: "Use opposite operations to isolate the variable", skill: "Algebraic manipulation", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Simplify to find your answer", skill: "Simplification", estimatedDifficulty: "medium" as const }
    ]
  };

  const standardSteps = {
    arithmetic: [
      { stepNumber: 1, description: "Identify all numerical values and their relationships", skill: "Number sense", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Determine the required operation(s)", skill: "Operation selection", estimatedDifficulty: "easy" as const },
      { stepNumber: 3, description: "Execute the calculation showing all work", skill: "Computation", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Express the answer with appropriate units", skill: "Answer formatting", estimatedDifficulty: "easy" as const }
    ],
    word_problem: [
      { stepNumber: 1, description: "Parse the problem to identify given information and unknowns", skill: "Problem parsing", estimatedDifficulty: "medium" as const },
      { stepNumber: 2, description: "Translate the word problem into mathematical notation", skill: "Mathematical modeling", estimatedDifficulty: "medium" as const },
      { stepNumber: 3, description: "Select and apply appropriate problem-solving strategies", skill: "Strategy selection", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Compute and verify the solution in context", skill: "Contextual verification", estimatedDifficulty: "medium" as const }
    ],
    algebra: [
      { stepNumber: 1, description: "Write the equation or system of equations", skill: "Equation setup", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Identify the variable(s) to solve for", skill: "Variable identification", estimatedDifficulty: "easy" as const },
      { stepNumber: 3, description: "Apply algebraic properties to isolate the variable", skill: "Algebraic manipulation", estimatedDifficulty: "hard" as const },
      { stepNumber: 4, description: "Simplify and verify the solution", skill: "Solution verification", estimatedDifficulty: "medium" as const }
    ],
    geometry: [
      { stepNumber: 1, description: "Identify the geometric shapes and their properties", skill: "Shape recognition", estimatedDifficulty: "easy" as const },
      { stepNumber: 2, description: "Recall relevant formulas (area, perimeter, etc.)", skill: "Formula recall", estimatedDifficulty: "medium" as const },
      { stepNumber: 3, description: "Substitute known values into formulas", skill: "Substitution", estimatedDifficulty: "medium" as const },
      { stepNumber: 4, description: "Calculate and express with correct units", skill: "Calculation", estimatedDifficulty: "medium" as const }
    ]
  };

  const steps = isSimplified ? simplifiedSteps : standardSteps;
  return (steps as Record<string, typeof steps.arithmetic>)[problemType] || steps.arithmetic;
}

function calculateEstimatedTime(problemType: string, difficulty: string): number {
  const baseTimes: Record<string, number> = {
    arithmetic: 5,
    word_problem: 10,
    algebra: 12,
    geometry: 10,
    fractions: 8,
    percentages: 8,
    general: 8
  };

  const difficultyMultiplier: Record<string, number> = {
    easy: 0.7,
    medium: 1.0,
    hard: 1.5
  };

  const baseTime = baseTimes[problemType] || 8;
  const multiplier = difficultyMultiplier[difficulty] || 1.0;

  return Math.round(baseTime * multiplier);
}

function getSuggestedApproach(problemType: string, isSimplified: boolean): string {
  const approaches: Record<string, { simplified: string; standard: string }> = {
    arithmetic: {
      simplified: "Break the problem into small steps. Use your fingers or draw pictures if it helps!",
      standard: "Use mental math strategies or standard algorithms. Show your work for each step."
    },
    word_problem: {
      simplified: "Read slowly, find the numbers, decide what to do, then solve. Draw a picture if you need to!",
      standard: "Use the UPSC method: Understand, Plan, Solve, Check. Translate words into mathematical expressions."
    },
    algebra: {
      simplified: "Think of the equation like a balance scale. Keep both sides equal!",
      standard: "Use inverse operations to isolate the variable. Maintain equation balance throughout."
    },
    geometry: {
      simplified: "Draw the shape, label what you know, find the right formula, then plug in numbers.",
      standard: "Sketch and label the figure. Apply relevant theorems and formulas systematically."
    }
  };

  const approach = approaches[problemType] || approaches.arithmetic;
  return isSimplified ? approach.simplified : approach.standard;
}

function getAlternativeApproaches(problemType: string): string[] {
  const alternatives: Record<string, string[]> = {
    arithmetic: ["Use a number line", "Break numbers into place values", "Use estimation to check"],
    word_problem: ["Draw a diagram", "Work backwards from the answer", "Use simpler numbers first"],
    algebra: ["Guess and check", "Graph the equation", "Use substitution"],
    geometry: ["Use grid paper", "Measure with tools", "Compare to known shapes"]
  };

  return alternatives[problemType] || ["Try different strategies", "Draw a picture", "Work with simpler numbers"];
}

/**
 * Generate solve step guidance
 */
function generateSolveGuidance(
  problemData: Record<string, unknown> | undefined,
  planData: Record<string, unknown> | undefined,
  isSimplified: boolean
): SolutionStep[] {
  const problemType = (problemData?.problemType as string) || "general";
  
  // Generate step-by-step instructions
  const steps: SolutionStep[] = [];
  const planSteps = getPlanStepsForType(problemType, isSimplified);

  planSteps.forEach((planStep, index) => {
    steps.push({
      stepNumber: index + 1,
      instruction: planStep.description,
      hint: getStepHint(problemType, index, isSimplified),
      example: index === 0 ? getStepExample(problemType, isSimplified) : undefined,
      expectedOutcome: getExpectedOutcome(problemType, index, isSimplified),
      checkPoint: getCheckpointQuestion(problemType, index, isSimplified)
    });
  });

  return steps;
}

function getStepHint(problemType: string, stepIndex: number, isSimplified: boolean): string {
  const hints: Record<string, string[]> = {
    arithmetic: [
      isSimplified ? "Write the numbers neatly!" : "Line up your numbers by place value",
      isSimplified ? "Use the operation symbol" : "Apply the operation systematically",
      isSimplified ? "Take your time with each digit" : "Check each calculation",
      isSimplified ? "Don't forget units if needed" : "Include appropriate units in your answer"
    ],
    word_problem: [
      isSimplified ? "Look for numbers and circle them" : "Identify all numerical values",
      isSimplified ? "What is the question asking?" : "Determine what quantity to find",
      isSimplified ? "Set up your math problem" : "Write the mathematical expression",
      isSimplified ? "Solve and answer in a sentence" : "Compute and state answer in context"
    ],
    algebra: [
      isSimplified ? "Write out the equation" : "Express the relationship as an equation",
      isSimplified ? "Find the letter (variable)" : "Identify the unknown variable",
      isSimplified ? "Get the letter alone" : "Isolate the variable using inverse operations",
      isSimplified ? "Simplify to find the answer" : "Simplify and verify your solution"
    ]
  };

  const typeHints = hints[problemType] || hints.arithmetic;
  return typeHints[stepIndex] || typeHints[typeHints.length - 1];
}

function getStepExample(problemType: string, isSimplified: boolean): string {
  const examples: Record<string, { simplified: string; standard: string }> = {
    arithmetic: {
      simplified: "Example: 23 + 45. First write 23, then + 45 below it. Line up the ones place (3 and 5).",
      standard: "Example: 156 + 287. Align by place value: ones (6+7=13), tens (5+8+1=14), hundreds (1+2+1=4). Result: 443"
    },
    word_problem: {
      simplified: "Example: 'Tom has 5 apples. He gets 3 more.' Numbers: 5 and 3. Gets more = addition. 5 + 3 = 8 apples.",
      standard: "Example: 'A rectangle has length 12cm and width 8cm. Find the perimeter.' Given: l=12, w=8. Formula: P=2(l+w). P=2(12+8)=40cm"
    },
    algebra: {
      simplified: "Example: x + 3 = 7. To get x alone, subtract 3 from both sides. x = 7 - 3 = 4.",
      standard: "Example: 2x + 5 = 13. Subtract 5: 2x = 8. Divide by 2: x = 4. Check: 2(4) + 5 = 13 ✓"
    }
  };

  const example = examples[problemType] || examples.arithmetic;
  return isSimplified ? example.simplified : example.standard;
}

function getExpectedOutcome(problemType: string, stepIndex: number, isSimplified: boolean): string {
  const outcomes: string[][] = [
    ["Numbers identified", "Operation determined", "Calculation complete", "Answer written"],
    ["Problem understood", "Mathematical setup ready", "Solution computed", "Answer verified"]
  ];

  const outcomeSet = isSimplified ? outcomes[0] : outcomes[1];
  return outcomeSet[stepIndex] || outcomeSet[outcomeSet.length - 1];
}

function getCheckpointQuestion(problemType: string, stepIndex: number, isSimplified: boolean): string {
  const questions: string[][] = [
    ["Did you find all the numbers?", "Do you know what math to use?", "Did you show your work?", "Does your answer make sense?"],
    ["Have you identified all given information?", "Is your mathematical setup correct?", "Are your calculations accurate?", "Does your answer satisfy the original problem?"]
  ];

  const questionSet = isSimplified ? questions[0] : questions[1];
  return questionSet[stepIndex] || questionSet[questionSet.length - 1];
}

/**
 * Generate check step guidance
 */
function generateCheckGuidance(
  problemData: Record<string, unknown> | undefined,
  isSimplified: boolean
): SolutionStep[] {
  return [
    {
      stepNumber: 1,
      instruction: isSimplified 
        ? "Read the problem again. What did it ask for?"
        : "Re-read the original problem to confirm what was asked.",
      expectedOutcome: "Question understood",
      checkPoint: "What exactly does the problem want you to find?"
    },
    {
      stepNumber: 2,
      instruction: isSimplified
        ? "Look at your answer. Does it make sense for the problem?"
        : "Evaluate if your answer is reasonable given the context.",
      hint: isSimplified 
        ? "If you found how many apples, your answer should be a number that makes sense for apples!"
        : "Consider: Is the magnitude reasonable? Are the units correct?",
      expectedOutcome: "Answer reasonableness confirmed",
      checkPoint: "Is your answer too big, too small, or just right?"
    },
    {
      stepNumber: 3,
      instruction: isSimplified
        ? "Try the opposite operation to check. If you added, try subtracting!"
        : "Verify using inverse operations or an alternative method.",
      example: isSimplified
        ? "If 5 + 3 = 8, check: 8 - 3 = 5 ✓"
        : "For 2x = 10, if x = 5, verify: 2(5) = 10 ✓",
      expectedOutcome: "Answer verified mathematically",
      checkPoint: "Does your check confirm the answer?"
    }
  ];
}
