import type { AgentToolTrace, Region, SubjectCode } from "@aivo/types";

export interface AgentContext {
  learnerId: string;
  tenantId: string;
  subject: SubjectCode;
  region: Region;
  state: Record<string, unknown>;
  trace: AgentToolTrace[];
}

export interface ToolExecutionArgs<TInput> {
  context: AgentContext;
  input: TInput;
}

export interface AgentTool<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  run: (args: ToolExecutionArgs<TInput>) => Promise<TOutput>;
  summarizeResult?: (result: TOutput) => string;
}

export interface WorkflowStep<TInput = unknown, TOutput = unknown> {
  id: string;
  label: string;
  tool: AgentTool<TInput, TOutput>;
  mapInput?: (context: AgentContext) => TInput;
  saveResultAs?: string;
  onResult?: (result: TOutput, context: AgentContext) => void;
}

export interface WorkflowDefinition {
  name: string;
  description: string;
  steps: WorkflowStep<any, any>[];
}

export interface WorkflowRunResult {
  context: AgentContext;
}

export class AgentWorkflowError extends Error {
  constructor(message: string, public readonly stepId: string, public readonly originalError?: unknown) {
    super(message);
    this.name = "AgentWorkflowError";
  }
}
