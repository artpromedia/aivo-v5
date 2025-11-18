# Aivo v5 - AI Chatbot Application

A modern AI-powered chatbot application built with Node.js and Express.

## Features


## Prerequisites


## Installation

1. Clone the repository:
   ```bash
   git clone git@github.com:artpromedia/aivo-v5.git
   cd aivo-v5
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

## API Endpoints


## Environment Variables


## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details.
%AIVO Monorepo%

This repository contains the AIVO Agentic AI Learning Platform monorepo scaffold.

Overview:

- apps/ - Next.js frontends (marketing site, learner PWA, parent/teacher app, admin app)
- mobile/ - Expo React Native apps (learner, parent/teacher)
- packages/ - Shared packages: `@aivo/types`, `@aivo/ui`, `@aivo/brain-model`, etc.
- services/ - Backend services: model-dispatch, baseline-assessment, orchestrator, api-gateway

Quick start

1. Install dependencies:

```powershell
pnpm install
```

2. Start everything in dev (uses Turborepo):

```powershell
pnpm dev
```

3. Or start only the web apps:

```powershell
pnpm dev:web
```

Notes

- Node.js >= 20 is recommended.
- Uses pnpm workspaces and Turborepo for task orchestration.
- Tailwind, ESLint, and Prettier are configured at the root.

Where to look next

- `apps/learner-web` — Learner-facing PWA (Next.js App Router)
- `services/model-dispatch` — Provider failover for LLM calls
- `services/baseline-assessment` — Baseline assessment generator using model-dispatch

If you want, I can make the initial git commit and set the remote to `git@github.com:artpromedia/aivo-v5.git`.