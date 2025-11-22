# @aivo/agents

Foundational infrastructure for orchestrating and coordinating AI agents across the AIVO platform. This package provides:

- Abstract `BaseAgent` with Redis-backed state and memory management
- Event-driven inter-agent communication with Redis Pub/Sub
- Episodic, short-term, and long-term memory primitives for cross-session learning
- Orchestrator for coordinating multi-agent plans with dependency management and retries

## Development

```bash
pnpm --filter @aivo/agents build
```

## Testing

```bash
pnpm --filter @aivo/agents test
```

## Environment

Set the following variables before running agents:

- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD` (optional)
- `OPENAI_API_KEY` when using OpenAI-backed agents

Extend `BaseAgent` (and coordinate via `AgentOrchestrator`) instead of creating bespoke agent plumbing so every worker inherits the shared Redis-backed state, memory persistence, and event system. Ensure the environment variables above are set wherever you call `agent.initialize()`.

