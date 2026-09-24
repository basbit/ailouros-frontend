import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/App.vue", "e2e/**/*.spec.ts"],
  project: ["src/**/*.{ts,vue}", "scripts/**/*.{ts,mjs}"],
  // Generated from the backend's OpenAPI schema by `npm run audit:openapi --
  // --write`: its unused `webhooks` / `$defs` / `operations` declarations come
  // back on every regeneration, so they are not debt anyone can pay down.
  ignore: ["src/shared/api/openapi-types.ts"],
  ignoreBinaries: ["dot"],
  vue: true,
  vitest: { config: ["vitest.config.ts"], entry: ["src/**/*.test.ts"] },
  playwright: { config: "playwright.config.ts", entry: "e2e/**/*.spec.ts" },
};

export default config;
