import type { AgentToolTrace } from "@aivo/types";
import { AgentWorkflowError, type AgentContext, type WorkflowDefinition } from "./agentTypes";

function cloneState(state: Record<string, unknown>): Record<string, unknown> {
  return Object.keys(state).reduce<Record<string, unknown>>((acc, key) => {
    acc[key] = state[key];
    return acc;
  }, {});
}

export async function runWorkflow(
  definition: WorkflowDefinition,
  baseContext: AgentContext
): Promise<AgentContext> {
  const context: AgentContext = {
    ...baseContext,
    state: cloneState(baseContext.state ?? {}),
    trace: [...(baseContext.trace ?? [])]
  };

  for (const step of definition.steps) {
    const startTime = Date.now();
    const startedAt = new Date(startTime).toISOString();
    const savedKeys = new Set<string>();
    let traceEntry: AgentToolTrace | null = null;

    try {
      const input = step.mapInput ? step.mapInput(context) : (undefined as any);
      const output = await step.tool.run({ context, input });

      if (step.saveResultAs) {
        context.state[step.saveResultAs] = output;
        savedKeys.add(step.saveResultAs);
      }

      const beforeKeys = Object.keys(context.state);
      if (step.onResult) {
        step.onResult(output, context);
      }
      const afterKeys = Object.keys(context.state);
      afterKeys
        .filter((key) => !beforeKeys.includes(key) || context.state[key] !== undefined)
        .forEach((key) => savedKeys.add(key));

      const finishedAt = new Date().toISOString();
      traceEntry = {
        stepId: step.id,
        label: step.label,
        toolName: step.tool.name,
        startedAt,
        finishedAt,
        durationMs: Date.now() - startTime,
        notes: step.tool.summarizeResult ? step.tool.summarizeResult(output) : undefined,
        savedKeys: savedKeys.size ? Array.from(savedKeys) : undefined
      };
    } catch (error) {
      const finishedAt = new Date().toISOString();
      traceEntry = {
        stepId: step.id,
        label: step.label,
        toolName: step.tool.name,
        startedAt,
        finishedAt,
        durationMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      };

      throw new AgentWorkflowError(
        `Workflow ${definition.name} failed at step ${step.id}`,
        step.id,
        error
      );
    } finally {
      if (traceEntry) {
        context.trace.push(traceEntry);
      }
    }
  }

  return context;
}
