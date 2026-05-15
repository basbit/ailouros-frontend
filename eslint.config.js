import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import pluginBoundaries from "eslint-plugin-boundaries";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "test-results/**",
      "playwright-report/**",
      "../orchestrator/static/bundle/**",
      "public/ui.js",
    ],
  },
  // ── FSD layer boundaries ────────────────────────────────────────────────────
  // Layers (top → bottom): app → pages → widgets → features → entities → shared.
  // A layer may only import from layers BELOW it. The primary FSD doctrine —
  // features must NEVER cross-import other features — is enforced strictly.
  // For widgets, entities, and pages we permit same-layer composition (a
  // widget can compose sibling widgets, an entity can reference sibling
  // entities), which matches mainstream FSD practice; cross-feature isolation
  // is what really keeps the architecture clean.
  {
    files: ["src/**/*.{ts,tsx,vue}"],
    plugins: {
      boundaries: pluginBoundaries,
    },
    settings: {
      "boundaries/include": ["src/**/*"],
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**" },
        { type: "pages", pattern: "src/pages/**" },
        { type: "widgets", pattern: "src/widgets/*", mode: "folder" },
        { type: "features", pattern: "src/features/*", mode: "folder" },
        { type: "entities", pattern: "src/entities/*", mode: "folder" },
        { type: "shared", pattern: "src/shared/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: {
                to: { type: ["app", "pages", "widgets", "features", "entities", "shared"] },
              },
            },
            {
              from: { type: "pages" },
              allow: { to: { type: ["pages", "widgets", "features", "entities", "shared"] } },
            },
            {
              from: { type: "widgets" },
              allow: { to: { type: ["widgets", "features", "entities", "shared"] } },
            },
            {
              from: { type: "features" },
              allow: { to: { type: ["entities", "shared"] } },
            },
            {
              from: { type: "entities" },
              allow: { to: { type: ["entities", "shared"] } },
            },
            {
              from: { type: "shared" },
              allow: { to: { type: ["shared"] } },
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,vue}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: [".vue"],
      },
    },
  },
  eslintConfigPrettier,
  {
    files: ["**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // AgentIcon renders inline SVG from a compile-time constants table
    // (``AGENT_ICON_PATHS``). The content never reflects user input, so
    // ``vue/no-v-html`` does not add a real safety guarantee here.
    files: ["src/shared/ui/AgentIcon.vue"],
    rules: {
      "vue/no-v-html": "off",
    },
  },
);
