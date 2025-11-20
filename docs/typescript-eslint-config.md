# TypeScript & ESLint Configuration Guide

This document explains the consolidated TypeScript and ESLint configurations for the Aivo v5 monorepo.

## TypeScript Configuration

We've created three base configurations to ensure consistency across all projects:

### 1. `tsconfig.nextjs.base.json`
For all Next.js web applications (`apps/*-web`)

**Key features:**
- Next.js-specific settings (JSX preserve, incremental builds)
- Shared path mappings for all `@aivo/*` packages
- Strict mode enabled
- Module resolution optimized for modern JavaScript

**Usage:**
```json
{
  "extends": "../../tsconfig.nextjs.base.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": {
      "@/*": ["./*"],
      // Package paths inherited from base
    }
  }
}
```

### 2. `tsconfig.service.base.json`
For all backend services (`services/*`)

**Key features:**
- CommonJS module system
- Node.js-specific settings
- No DOM libraries
- Strict type checking
- Output directory configuration

**Usage:**
```json
{
  "extends": "../../tsconfig.service.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

### 3. `tsconfig.mobile.base.json`
For React Native/Expo mobile apps (`mobile/*`)

**Key features:**
- React JSX support
- Expo type definitions
- No emit (Metro bundler handles compilation)
- Mobile-specific path mappings

**Usage:**
```json
{
  "extends": "../../tsconfig.mobile.base.json",
  "include": ["App.tsx", "src"]
}
```

## ESLint Configuration

ESLint is centrally configured at the root level with:

- **`.eslintrc.cjs`**: Base rules for TypeScript, React, and React Hooks
- **`eslint.config.cjs`**: Flat config with ignore patterns

### Rules Applied
- TypeScript recommended rules
- React recommended rules
- React Hooks rules
- Prettier compatibility

### Ignored Directories
- `node_modules`
- `.next` (Next.js build output)
- `dist` (compiled output)
- `.turbo` (Turborepo cache)
- `.expo` (Expo cache)
- `coverage` (test coverage)

## Workspace Scripts

Run these from the root directory:

```bash
# Lint all packages
pnpm lint

# Auto-fix lint issues
pnpm lint:fix

# Type-check all packages
pnpm typecheck

# Format all code
pnpm format

# Check formatting
pnpm format:check
```

## Per-Package Configuration

Each package inherits from the appropriate base config and only needs to specify:
- Project-specific compiler options (e.g., `outDir`, `rootDir`)
- Local path aliases (e.g., `@/*` in Next.js apps)
- Include/exclude patterns

## Benefits

1. **Consistency**: All projects use the same base TypeScript settings
2. **Maintainability**: Update rules in one place, apply everywhere
3. **Clarity**: Each config type is optimized for its use case
4. **Type Safety**: Strict mode enabled across all projects
5. **DX**: Fast linting and type checking with turbo

## Migration Notes

- All apps now use strict TypeScript mode
- Path mappings are consistent across the monorepo
- ESLint rules apply uniformly to all TypeScript/React code
- Mobile apps share configuration to ensure consistency

## Troubleshooting

### Type errors after update
Run `pnpm install` and `pnpm prisma:generate` to regenerate types.

### Lint errors in IDE
Restart your TypeScript server or VS Code after config changes.

### Path aliases not resolving
Ensure your package.json has the correct workspace dependencies installed.
