import type { Region, SessionPlanRun, SubjectCode } from "@aivo/types";
import { runWorkflow } from "./workflowEngine";
import type { AgentContext, WorkflowDefinition } from "./agentTypes";
import {
  assembleSessionPlanTool,
  computeSessionIntentTool,
  gatherLearnerContextTool,
  type LearnerContextSummary,
  type SessionIntent,
  type SessionPlanArtifacts
} from "../tools/sessionPlanningTools";

export interface SessionPlanWorkflowInput {
  learnerId: string;
  tenantId: string;
  subject: SubjectCode;
  region: Region;
}

const sessionPlanWorkflow: WorkflowDefinition = {
  name: "session-plan-v1",
  description: "Derive a calm teaching session outline for a learner",
  steps: [
    {
      id: "gather-learner",
      label: "Gather learner context",
      tool: gatherLearnerContextTool,
      saveResultAs: "learnerContext"
    },
    {
      id: "prioritize-needs",
      label: "Prioritize needs",
      tool: computeSessionIntentTool,
      mapInput: (context) => ({
        learnerContext: context.state.learnerContext as LearnerContextSummary,
        subject: context.subject
      }),
      saveResultAs: "sessionIntent"
    },
    {
      id: "assemble-plan",
      label: "Assemble calm session",
      tool: assembleSessionPlanTool,
      mapInput: (context) => ({
        learnerContext: context.state.learnerContext as LearnerContextSummary,
        intent: context.state.sessionIntent as SessionIntent
      }),
      onResult: (result, ctx) => {
        const artifacts = result as SessionPlanArtifacts;
        ctx.state.sessionPlan = artifacts.plan;
        ctx.state.sessionInsights = artifacts.insights;
      }
    }
  ]
};

export async function planLearnerSession(
  input: SessionPlanWorkflowInput
): Promise<SessionPlanRun> {
  const baseContext: AgentContext = {
    learnerId: input.learnerId,
    tenantId: input.tenantId,
    subject: input.subject,
    region: input.region,
    state: {},
    trace: []
  };

  const context = await runWorkflow(sessionPlanWorkflow, baseContext);
  const plan = context.state.sessionPlan as SessionPlanRun["plan"] | undefined;
  const insights = context.state.sessionInsights as SessionPlanRun["insights"] | undefined;

  if (!plan || !insights) {
    throw new Error("Workflow completed without generating a session plan");
  }

  return {
    plan,
    insights,
    trace: context.trace
  };
}
