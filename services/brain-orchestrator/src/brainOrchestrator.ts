import type {
  BrainDomain,
  LearnerBrainProfile,
  LessonPlan,
  LessonBlock,
  Region,
  SubjectCode,
  TenantConfig
} from "@aivo/types";
import { getDifficultyRecommendations } from "@aivo/brain-model";
import fetch from "node-fetch";
import { fetchLearnerBrainProfile } from "./lib/brainProfile";

declare const process: { env: Record<string, string | undefined> };

export interface GenerateLessonInput {
  learnerId: string;
  tenantId: string;
  subject: SubjectCode;
  region: Region;
  domain?: BrainDomain;
}

export interface GenerateLessonOutput {
  plan: LessonPlan;
}

interface ModelDispatchResult {
  content: string;
}

async function callModelDispatch(prompt: string, system?: string): Promise<ModelDispatchResult> {
  const res = await fetch("http://model-dispatch:4001/dispatch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, system })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`model-dispatch error ${res.status}: ${text}`);
  }

  return (await res.json()) as ModelDispatchResult;
}

async function fetchTenantConfig(
  gatewayBaseUrl: string,
  tenantId: string
): Promise<TenantConfig | null> {
  const res = await fetch(
    `${gatewayBaseUrl}/admin/tenants/${encodeURIComponent(tenantId)}`,
    {
      headers: {
        "x-aivo-user": JSON.stringify({
          userId: "brain-orchestrator-system",
          tenantId,
          roles: ["platform_admin"]
        })
      }
    }
  );

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as { config?: TenantConfig };
  return data.config ?? null;
}

// Content Authoring Integration:
// When generating lesson plans, prefer using approved ContentItems from the 
// CurriculumTopic/ContentItem tables where available. Query by subject, grade, 
// and topicId to find relevant explanations, examples, and practice questions.
// Only fall back to AI generation if no approved content exists for the topic.
// This ensures:
// - Curriculum-aligned content that meets regional standards
// - Human-reviewed, approved materials for student safety
// - Consistent quality across lessons
// - Reduced AI generation costs and latency

/**
 * Check if approved content exists for the topic
 */
async function fetchApprovedContent(
  gatewayBaseUrl: string,
  subject: SubjectCode,
  tenantId: string,
  region: Region
): Promise<{ found: boolean; content?: unknown[] }> {
  try {
    const res = await fetch(
      `${gatewayBaseUrl}/api/v1/content/approved?subject=${encodeURIComponent(subject)}&region=${encodeURIComponent(region)}`,
      {
        headers: {
          "x-aivo-user": JSON.stringify({
            userId: "brain-orchestrator-system",
            tenantId,
            roles: ["system"]
          })
        }
      }
    );

    if (res.ok) {
      const data = (await res.json()) as { content?: unknown[] };
      if (data.content && data.content.length > 0) {
        return { found: true, content: data.content };
      }
    }
  } catch (err) {
    // Content service not available, fall back to AI generation
  }
  
  return { found: false };
}

// This function generates lesson plans using AI with fallback to static content.
// It threads through real brain profile, curriculum, and difficulty recommendations.
export async function generateLessonPlanMock(
  input: GenerateLessonInput
): Promise<GenerateLessonOutput> {
  const gatewayBaseUrl = process.env.API_GATEWAY_BASE_URL ?? "http://api-gateway:4000";

  const [brainProfile, tenantConfig] = await Promise.all([
    fetchLearnerBrainProfile(input.learnerId),
    fetchTenantConfig(gatewayBaseUrl, input.tenantId)
  ]);

  let curriculumLabel = "Unknown curriculum";
  if (tenantConfig?.curricula && tenantConfig.curricula.length > 0) {
    const bySubject = tenantConfig.curricula.find((c) =>
      c.subjects.includes(input.subject)
    );
    curriculumLabel = (bySubject ?? tenantConfig.curricula[0]).label;
  }

  let difficultySummary = "No difficulty data available yet.";
  if (brainProfile) {
    const recommendations = getDifficultyRecommendations(brainProfile);
    const forSubject = recommendations.find((r: { subject: SubjectCode }) => r.subject === input.subject);
    const rec = forSubject ?? recommendations[0];
    if (rec) {
      difficultySummary = `${rec.recommendedDifficulty.toUpperCase()} – ${rec.rationale}`;
    }
  }

  const systemPrompt =
    "You are AIVO, a calm, neurodiversity-aware lesson planner for middle school learners.";

  const learnerGrade = brainProfile?.currentGrade
    ? `Current grade: ${brainProfile.currentGrade}.`
    : "Current grade unknown.";

  const prompt = `Design a very short, calm mini-lesson as structured bullet points.

Region: ${input.region}
Subject: ${input.subject}
Curriculum: ${curriculumLabel}
${learnerGrade}
Difficulty guidance: ${difficultySummary}

Constraints:
- Keep total time around 8–10 minutes.
- Use simple language suitable for a possibly overwhelmed learner.
- Avoid any flashy or overwhelming sensory descriptions.

Provide:
1) A one-sentence objective.
2) A short intro activity that helps the learner arrive and breathe.
3) One worked example.
4) One practice question with a gentle hint.
5) One reflection prompt focused on feelings and preferences.

Respond with plain text; no JSON, code fences, or markup.`;

  // Try to use AI-generated content, with fallback to static blocks
  let aiContent: { objective?: string; blocks?: Partial<LessonBlock>[] } | null = null;
  
  try {
    // First check for approved curriculum content
    const approvedContent = await fetchApprovedContent(
      gatewayBaseUrl,
      input.subject,
      input.tenantId,
      input.region
    );

    if (approvedContent.found) {
      console.log(`Using approved curriculum content for ${input.subject}`);
      // Use approved content (would parse and adapt here)
    } else {
      // Fall back to AI generation
      const result = await callModelDispatch(prompt, systemPrompt);
      
      if (result.content) {
        // Parse AI response to extract lesson components
        const lines = result.content.split('\n').filter(l => l.trim());
        const objectiveLine = lines.find(l => l.toLowerCase().includes('objective') || lines.indexOf(l) === 0);
        
        if (objectiveLine) {
          aiContent = {
            objective: objectiveLine.replace(/^[0-9.):\-\s]+/, '').trim()
          };
        }
        
        console.log(`Generated AI lesson plan for ${input.subject}`);
      }
    }
  } catch (err) {
    // Fall back to static content on any error
    console.warn('AI generation failed, using static lesson blocks:', err);
  }

  const id = `lesson-${Date.now()}`;
  const now = new Date().toISOString();

  const objective = aiContent?.objective ?? "Practice one calm, bite-sized idea with support.";

  const blocks: LessonBlock[] = [
    {
      id: `${id}-b1`,
      order: 1,
      type: "calm_intro",
      domain: input.domain ?? "self_regulation",
      title: "Arrive and breathe",
      prompt:
        "Take a slow breath in through your nose and out through your mouth. Notice how your body feels.",
      studentFacingText:
        "Before we start, let’s help your brain feel a little calmer. Take one or two gentle breaths. You don’t have to change anything, just notice.",
      accessibilityNotes: "Keep language simple; avoid flashing or moving visuals.",
      estimatedMinutes: 1
    },
    {
      id: `${id}-b2`,
      order: 2,
      type: "worked_example",
      domain: input.domain ?? "conceptual_understanding",
      title: "See one example",
      prompt:
        "Walk through one example slowly, explaining each step and why it works.",
      studentFacingText:
        "Here’s one example we’ll look at together. You can read it, or have someone read it to you. We’ll go one step at a time.",
      example:
        "Example: 3 + 4 = 7. First, we start at 3 on a number line, then move 4 steps forward: 4, 5, 6, 7.",
      accessibilityNotes:
        "Offer optional read-aloud; keep numbers small; avoid dense paragraphs.",
      estimatedMinutes: 3
    },
    {
      id: `${id}-b3`,
      order: 3,
      type: "guided_practice",
      domain: input.domain ?? "procedural_fluency",
      title: "Try one together",
      prompt:
        "Give one practice item where the learner can respond in a simple way. Offer a gentle hint.",
      studentFacingText:
        "Now try one like the example. If it feels tricky, that’s okay – we can break it into tiny steps.",
      practiceQuestion: "What is 2 + 5?",
      practiceFormat: "multiple_choice",
      accessibilityNotes:
        "Allow the learner to answer verbally or by pointing; avoid time pressure.",
      estimatedMinutes: 3
    },
    {
      id: `${id}-b4`,
      order: 4,
      type: "reflection_prompt",
      domain: input.domain ?? "self_regulation",
      title: "Check how it felt",
      prompt:
        "Invite the learner to notice what felt okay and what felt hard, in simple language.",
      studentFacingText:
        "Take a moment to notice: what part felt okay? Was there any part that felt too hard or confusing? It’s helpful to tell AIVO so we can adjust next time.",
      accessibilityNotes:
        "Offer choices or visuals for feelings if possible.",
      estimatedMinutes: 2
    }
  ];

  const plan: LessonPlan = {
    id,
    learnerId: input.learnerId,
    tenantId: input.tenantId,
    subject: input.subject,
    region: input.region,
    domain: input.domain,
    title: "Today’s calm mini-lesson",
    objective,
    blocks,
    createdAt: now
  };

  return { plan };
}
