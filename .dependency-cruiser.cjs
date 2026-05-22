module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Circular dependencies make refactoring brittle and bloat bundles. Break the cycle by introducing a shared port or splitting the module.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Orphan files have no consumer and are dead code per review-rules.md §10.5.",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)(\\.|knip|stryker|jscpd|dependency-cruiser|playwright|vitest|vite|eslint|tsconfig)\\.",
          "\\.d\\.ts$",
          "(^|/)src-tauri/",
          "(^|/)e2e/",
          "(^|/)scripts/",
          "(^|/)src/main\\.ts$",
          "(^|/)src/App\\.vue$",
          "(^|/)src/shared/api/openapi-types\\.ts$",
          "\\.test\\.ts$",
          "(^|/)src/(entities|features|shared)/[^/]+/(model|types)\\.ts$",
          "(^|/)src/(entities|features|shared)/[^/]+/model/.+\\.ts$",
          "(^|/)src/entities/[^/]+/index\\.ts$",
          "(^|/)src/shared/lib/i18n/types\\.ts$",
          "(^|/)src/shared/lib/agent-config-types\\.ts$",
          "(^|/)src/shared/model/.+-types\\.ts$",
        ],
      },
      to: {},
    },
    {
      name: "no-deprecated-core",
      severity: "warn",
      from: {},
      to: { dependencyTypes: ["deprecated"] },
    },
    {
      name: "shared-must-stay-leaf",
      severity: "error",
      comment:
        "FSD: `shared` may not depend on any higher FSD layer (entities, features, widgets, pages, app).",
      from: { path: "^src/shared/" },
      to: {
        path: "^src/(entities|features|widgets|pages|app)/",
        pathNot: "^src/shared/",
      },
    },
    {
      name: "entities-cannot-reach-up",
      severity: "error",
      comment: "FSD: `entities` may only depend on `entities` (siblings) and `shared`.",
      from: { path: "^src/entities/" },
      to: { path: "^src/(features|widgets|pages|app)/" },
    },
    {
      name: "features-cannot-reach-up",
      severity: "error",
      comment:
        "FSD: `features` may only depend on `entities` and `shared` (cross-feature orchestration belongs in pages).",
      from: { path: "^src/features/" },
      to: { path: "^src/(widgets|pages|app)/" },
    },
    {
      name: "widgets-cannot-reach-up",
      severity: "error",
      comment: "FSD: `widgets` may only depend on features, entities, shared.",
      from: { path: "^src/widgets/" },
      to: { path: "^src/(pages|app)/" },
    },
    {
      name: "pages-cannot-reach-app",
      severity: "error",
      comment:
        "FSD: `pages` may not depend on `app/` providers/bootstrap; only consume them via injection.",
      from: { path: "^src/pages/" },
      to: { path: "^src/app/", pathNot: "^src/app/providers/" },
    },
    {
      name: "no-cross-feature-imports",
      severity: "warn",
      comment:
        "Two distinct features importing each other = cross-feature coupling. Lift shared concern to entities/ or pages/.",
      from: { path: "^src/features/([^/]+)/" },
      to: {
        path: "^src/features/([^/]+)/",
        pathNot: "^src/features/$1/",
      },
    },
    {
      name: "no-cross-widget-imports",
      severity: "warn",
      comment:
        "Two distinct widgets importing each other = cross-widget coupling. Lift shared visuals to shared/, entity semantics to entities/.",
      from: { path: "^src/widgets/([^/]+)/" },
      to: {
        path: "^src/widgets/([^/]+)/",
        pathNot: "^src/widgets/$1/",
      },
    },
    {
      name: "tests-only-from-tests",
      severity: "error",
      from: { pathNot: "\\.test\\.ts$" },
      to: { path: "\\.test\\.ts$" },
    },
    {
      name: "no-unresolved",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
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
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
      mainFields: ["module", "main", "types"],
    },
    reporterOptions: {
      dot: {
        collapsePattern: "^src/(app|pages|widgets|features|entities|shared)/[^/]+",
      },
      archi: {
        collapsePattern: "^src/(app|pages|widgets|features|entities|shared)/[^/]+",
      },
    },
  },
};
