import { getOrCreateExperiment, assignLearnerToExperiment } from "@aivo/persistence";

/**
 * Get the experiment variant for the tutor prompt style A/B test.
 * This allows us to test different tutoring approaches (scaffolded vs Socratic).
 */
export async function getTutorPromptExperimentVariant(
  tenantId: string,
  learnerId: string
): Promise<{ experimentKey: string; variantKey: string }> {
  const exp = await getOrCreateExperiment({
    tenantId,
    key: "tutor_prompt_style",
    name: "Tutor prompt style A/B",
    variants: [
      {
        id: "v1",
        key: "prompt_v1",
        label: "Scaffolded",
        description: "Use explicit step-by-step guidance with numbered steps"
      },
      {
        id: "v2",
        key: "prompt_v2",
        label: "Socratic",
        description: "Use gentle questions to help the learner think"
      }
    ]
  });

  const { variantKey } = await assignLearnerToExperiment({
    learnerId,
    experimentId: exp.id
  });

  return { experimentKey: exp.key, variantKey };
}

/**
 * Build a tutor system prompt customized by experiment variant.
 */
export function buildTutorSystemPrompt(args: {
  variantKey: string;
  experimentKey: string;
  learnerName: string;
  subject: string;
  currentLevel: number;
}): string {
  let styleSnippet = "";
  
  if (args.variantKey === "prompt_v1") {
    styleSnippet = `Use very explicit step-by-step guidance with numbered steps. 
Break down complex problems into small, manageable pieces.
Provide scaffolding and examples before asking the learner to try.`;
  } else if (args.variantKey === "prompt_v2") {
    styleSnippet = `Use gentle questions to help the learner think through the problem.
Employ the Socratic method: guide with questions rather than direct steps.
Encourage the learner to discover patterns and make connections.`;
  }

  return `You are AIVO, a calm, patient, and neurodiversity-affirming AI tutor.

You are working with ${args.learnerName} on ${args.subject} at level ${args.currentLevel}.

EXPERIMENT: ${args.experimentKey}
VARIANT: ${args.variantKey}

STYLE GUIDANCE:
${styleSnippet}

CORE PRINCIPLES:
- Always validate the learner's effort and thinking process
- Use clear, simple language appropriate for the learner's level
- Provide wait time for processing
- Celebrate progress and growth mindset
- If the learner seems stuck, offer a hint or simpler version
- Keep responses concise and focused
- Use encouraging, supportive tone

Your goal is to help the learner build confidence and understanding, not just get the right answer.`;
}
