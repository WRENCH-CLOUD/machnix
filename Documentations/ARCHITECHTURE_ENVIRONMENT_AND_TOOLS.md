
# Architecture, Environment, and Tools

## Overview

This document outlines the development environment, tools, and architecture used in this project.

## Package Management

### pnpm

**Purpose**: Fast, disk space-efficient package manager for Node.js projects.

**Why pnpm?**
- **Disk efficiency**: Uses a content-addressable storage system, saving disk space by sharing dependencies across projects
- **Speed**: Faster installs compared to npm/yarn due to hard-linking
- **Strict dependency management**: Prevents phantom dependencies by using a strict node_modules structure

**Usage**:
```bash
# Install dependencies
pnpm install

# Add a package
pnpm add <package-name>

# Add a dev dependency
pnpm add -D <package-name>

# Run scripts
pnpm <script-name>
```

**Configuration**: `pnpm-workspace.yaml` for monorepo setups, `.npmrc` for registry and behavior settings.

## Code Quality & Linting

### ESLint

**Purpose**: Static analysis tool for identifying and fixing JavaScript/TypeScript code issues.

**Features**:
- Enforces coding standards and best practices
- Catches bugs and potential errors early
- Maintains consistent code style across the team

**Usage**:
```bash
# Lint all files
pnpm lint

# Auto-fix issues
pnpm lint:fix
```

**Configuration**: `.eslintrc.js` or `eslint.config.js` for rules and plugins.

### Prettier

**Purpose**: Opinionated code formatter for consistent styling.

**Integration**: Works alongside ESLint via `eslint-plugin-prettier` or `eslint-config-prettier`.

**Usage**:
```bash
# Format files
pnpm prettier --write .
```

**Configuration**: `.prettierrc` or `prettier.config.js`.

## TypeScript

**Purpose**: Typed superset of JavaScript for enhanced developer experience and type safety.

**Benefits**:
- Compile-time type checking
- Better IDE support and autocomplete
- Refactoring confidence

**Configuration**: `tsconfig.json` defines compiler options, module resolution, and output settings.

## Build Tools

### Vite / Webpack / Turbopack

**Purpose**: Module bundler and development server for fast builds and hot module replacement (HMR).

**Common features**:
- Fast development server with HMR
- Optimized production builds
- Plugin ecosystem for extensibility

## Testing

### Jest / Vitest

**Purpose**: Unit and integration testing framework.

**Usage**:
```bash
# Run tests
pnpm test

# Watch mode
pnpm test --watch
```

### Testing Library

**Purpose**: DOM testing utilities for React, Vue, or other frameworks.

## Version Control

### Git

**Conventions**:
- Use conventional commits (e.g., `feat:`, `fix:`, `chore:`)
- Feature branches with descriptive names
- Pull request reviews before merging

### Husky

**Purpose**: Git hooks for enforcing pre-commit and pre-push checks.

**Common hooks**:
- `pre-commit`: Run linting and formatting
- `pre-push`: Run tests

## CI/CD

### GitHub Actions / Azure Pipelines

**Purpose**: Automated build, test, and deployment pipelines.

**Typical workflow**:
1. Lint and format check
2. Run tests
3. Build production artifacts
4. Deploy to staging/production

## Environment Management

### dotenv

**Purpose**: Load environment variables from `.env` files.

**Usage**:
```bash
# .env file
DATABASE_URL=<connection-string>
API_KEY=<secret>
```

**Security**: Never commit `.env` files; use `.env.example` for templates.

## Docker

**Purpose**: Containerization for consistent development and deployment environments.

**Usage**:
```bash
# Build image
docker build -t app:latest .

# Run container
docker run -p 3000:3000 app:latest
```

**Configuration**: `Dockerfile` and `docker-compose.yml`.

## Monitoring & Logging

### Azure Monitor / Application Insights

**Purpose**: Observability for production applications.

**Features**:
- Performance monitoring
- Error tracking
- Custom telemetry

## How It All Works Together

1. **Development**: Developers use pnpm to manage dependencies, ESLint/Prettier for code quality, and TypeScript for type safety
2. **Local Testing**: Jest/Vitest run unit tests; Docker provides consistent environments
3. **Version Control**: Git with Husky enforces quality gates before commits
4. **CI/CD**: Automated pipelines lint, test, build, and deploy code
5. **Production**: Containerized apps run with environment-specific configs, monitored via Azure tooling
