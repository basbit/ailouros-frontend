/**
 * Layer-direction check that also sees TYPE-ONLY imports.
 *
 * A violation expressed purely in a type position — `type X =
 * ReturnType<typeof import("@/app/...")>` inside `src/entities` — is invisible
 * to a runtime-only resolve while still inverting the FSD layer direction for
 * every consumer of that type. `tsPreCompilationDeps` makes those edges visible.
 *
 * This config was split out because the main one could not turn
 * `tsPreCompilationDeps` on without tripping 11 pre-existing type-only
 * `no-circular` hits. Those cycles are broken (2026-09-11) and the main config
 * now sets `tsPreCompilationDeps: true` itself, so `npm run audit:deps` — the
 * one wired into `make audit-deps` — already covers everything checked here.
 * This file is kept only as the standalone layer-direction probe
 * (`npm run audit:deps:types`); it has no CI runner of its own.
 */
module.exports = {
  forbidden: [
    {
      name: "shared-must-stay-leaf",
      severity: "error",
      comment:
        "FSD: `shared` may not depend on any higher FSD layer (entities, features, widgets, pages, app) — type-only imports included.",
      from: { path: "^src/shared/" },
      to: {
        path: "^src/(entities|features|widgets|pages|app)/",
        pathNot: "^src/shared/",
      },
    },
    {
      name: "entities-cannot-reach-up",
      severity: "error",
      comment:
        "FSD: `entities` may only depend on `entities` (siblings) and `shared` — type-only imports included.",
      from: { path: "^src/entities/" },
      to: { path: "^src/(features|widgets|pages|app)/" },
    },
    {
      name: "features-cannot-reach-up",
      severity: "error",
      comment:
        "FSD: `features` may only depend on `entities` and `shared` — type-only imports included.",
      from: { path: "^src/features/" },
      to: { path: "^src/(widgets|pages|app)/" },
    },
    {
      name: "widgets-cannot-reach-up",
      severity: "error",
      comment:
        "FSD: `widgets` may only depend on features, entities, shared — type-only imports included.",
      from: { path: "^src/widgets/" },
      to: { path: "^src/(pages|app)/" },
    },
    {
      name: "pages-cannot-reach-app",
      severity: "error",
      comment:
        "FSD: `pages` may not depend on `app/` bootstrap; only `app/providers/` (consumed via injection) is allowed.",
      from: { path: "^src/pages/" },
      to: { path: "^src/app/", pathNot: "^src/app/providers/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: {
      path: [
        "node_modules",
        "dist",
        "test-results",
        "../backend/UI/Web/",
        "src-tauri",
        "playwright-report",
      ],
    },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
  },
};
