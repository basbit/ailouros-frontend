# AIlourOS UI

Frontend for the AIlourOS multi-agent orchestration workspace.

> Status: active development. The UI is usable and covered by smoke tests, but routes, state shape, and visual behavior may still change between releases.

## What this project does

This repository contains the Vue 3 user interface for:

- creating and replaying swarm runs
- launching bundled scenarios from the picker, quick-launch row, and first-run panel
- configuring agent roles, models, and workspace settings
- inspecting task history, step graphs, pipeline events, scenario artifacts, quality checks, and scores
- handling human approval and retry flows
- onboarding, runtime capability checks, asset upload, report-a-problem, sudo prompt, and remote API profile setup

## Who it is for

- developers integrating the AIlourOS backend into a local or hosted workflow
- contributors working on the orchestration UI separately from the backend
- teams experimenting with multi-agent task pipelines and approval gates

## Requirements

- Node.js 20+
- npm 10+

Optional for end-to-end tests:

- Playwright browser dependencies

## Quick start

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

By default, the dev server runs on `http://127.0.0.1:5173` and proxies API traffic to `http://127.0.0.1:8000`.

## Configuration

Supported environment variables:

- `VITE_API_BASE_URL` — absolute backend base URL for cross-origin deployments
- `VITE_DESKTOP_BACKEND_PORT` — fallback port for the desktop shell bootstrap
- `VITE_BUILD_OUT_DIR` — override the Vite build output directory
- `E2E_BASE_URL` — Playwright target URL when you want to test an already running deployment

If `VITE_BUILD_OUT_DIR` is not set, builds behave like this:

- when a sibling `../backend/UI` directory exists, output goes to `../backend/UI/Web`
- otherwise output goes to local `dist/`

## Development commands

```bash
npm run dev
npm run lint
npm run type-check
npm run format:check
npm run build
npm run ci
npm run e2e
```

## Minimal usage example

1. Start the backend on `http://127.0.0.1:8000`
2. Run `npm run dev`
3. Open the UI in your browser
4. Enter a task, configure the pipeline if needed, and start a run

## Repository layout

- `src/app` — app bootstrap and global styles
- `src/pages` — top-level pages
- `src/features` — user-facing workflow modules
- `src/widgets` — reusable UI composition blocks
- `src/shared` — API client, config, stores, utilities
- `e2e` — Playwright smoke tests

## Scenario UI

The scenario surface follows FSD boundaries:

- `src/features/scenario-picker` owns catalog loading, preview, inputs, readiness, and quick launch.
- `src/widgets/onboarding-wizard` owns first-run scenario onboarding and capability display.
- `src/widgets/task-panel` owns artifact, source, finding, screenshot, quality-check, and score views.
- `src/widgets/pipeline-graph` owns the graph + the chip-row scenario header (`PipelineGraphHeader.vue`) and the role-picker popover.
- `src/widgets/observability` owns the cross-project stats card and the `Sparkline.vue` SVG chart used inside the sidebar `Advanced` section.
- `src/shared/api/endpoints/scenarios.ts` and `src/shared/model/scenario-types.ts` hold the shared API contract.

The page layer (`src/pages/swarm-ui/SwarmUiPage.vue`) composes these
modules without moving scenario business logic into `src/pages`. Layout
contract:

1. `<OnboardingWizard>` is the very first block on the page (above
   `app-body`).
2. The sidebar holds prompt + scenario inputs + run controls + gate
   panels + an `Advanced` toggle that reveals memory + cross-project
   stats.
3. Scenario selection lives only in the `PipelineGraphHeader` chip row
   (no duplicate quick-launch row).

## Voice dictation

`src/features/prompt-input/useVoiceDictation.ts` wraps the Web Speech
API (`SpeechRecognition` / `webkitSpeechRecognition`) and is wired into
`PromptInput.vue` as a mic button. The mic stays hidden in browsers that
don't expose the API, follows `<html lang>` for locale, and pulses while
active. Final transcripts are appended to the textarea; interim chunks
are ignored to avoid mid-utterance flicker.

## Notifications UI

`src/features/global-settings/GlobalNotificationSettings.vue` exposes
every notification env key as a settings field — webhook, email (SMTP),
Telegram, Slack, Discord, plus enable / severity / rate limit. State
persists through the existing `useGlobalSettings` composable
(localStorage + backend `user-settings`). i18n keys live under
`notify.*` in `shared/lib/i18n/swarm.ts` for en + ru.

## Contributing

See [`CONTRIBUTING.md`](CONTRIBUTING.md) for setup, validation, and pull request expectations.

See [`SECURITY.md`](SECURITY.md) for private vulnerability reporting.

## License

[MIT](LICENSE)
