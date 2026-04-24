# Contributing to AIlourOS UI

Thanks for contributing.

## Setup

```bash
nvm use
npm ci
cp .env.example .env
```

## Local development

```bash
npm run dev
```

Default dev server:

- UI: `http://127.0.0.1:5173`
- proxied backend target: `http://127.0.0.1:8000`

## Quality checks

Run before opening a pull request:

```bash
npm run ci
```

Smoke tests:

```bash
npm run e2e
```

## Code style

- Use TypeScript and Vue 3 composition patterns already used in the repo
- Keep ESLint and Prettier clean
- Prefer small, reviewable PRs over mixed refactors
- Update docs when changing scripts, env vars, or developer workflows

## Pull requests

- explain the user or developer problem being solved
- list validation steps
- call out UI regressions, breaking API assumptions, or follow-up work
- include screenshots or short recordings for visible UI changes when helpful
