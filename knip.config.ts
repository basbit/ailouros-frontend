import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: ["src/app/App.vue", "e2e/**/*.spec.ts"],
  project: ["src/**/*.{ts,vue}", "scripts/**/*.{ts,mjs}"],
  ignoreBinaries: ["dot"],
  vue: true,
  vitest: { config: ["vitest.config.ts"], entry: ["src/**/*.test.ts"] },
  playwright: { config: "playwright.config.ts", entry: "e2e/**/*.spec.ts" },
};

export default config;
