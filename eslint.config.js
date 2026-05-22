import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";
import pluginBoundaries from "eslint-plugin-boundaries";
import pluginSonarjs from "eslint-plugin-sonarjs";
import pluginNoSecrets from "eslint-plugin-no-secrets";

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
      ".stryker-tmp/**",
      "mutants/**",
      "../orchestrator/static/bundle/**",
      "public/ui.js",
    ],
  },
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
        { type: "app-providers", pattern: "src/app/providers/**" },
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
              from: { type: "app-providers" },
              allow: {
                to: {
                  type: [
                    "app-providers",
                    "features",
                    "entities",
                    "shared",
                  ],
                },
              },
            },
            {
              from: { type: "app" },
              allow: {
                to: {
                  type: [
                    "app-providers",
                    "app",
                    "pages",
                    "widgets",
                    "features",
                    "entities",
                    "shared",
                  ],
                },
              },
            },
            {
              from: { type: "pages" },
              allow: {
                to: {
                  type: [
                    "app-providers",
                    "pages",
                    "widgets",
                    "features",
                    "entities",
                    "shared",
                  ],
                },
              },
            },
            {
              from: { type: "widgets" },
              allow: {
                to: {
                  type: [
                    "features",
                    "entities",
                    "shared",
                  ],
                },
              },
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
    files: ["scripts/**/*.{mjs,js}", "*.cjs", "*.config.{js,ts,mjs,cjs}"],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: "module",
    },
  },
  {
    files: ["*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
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
  // Complexity gate (frontend ceiling, intentionally looser than Python backend at 12).
  // Backend numbers stay in wiki/architecture/toolchain.md.
  // Placed before eslintConfigPrettier so Prettier's sweep can still neutralise
  // any formatting rules; none of these are formatting rules so there is no clash.
  {
    files: ["src/**/*.{ts,tsx,vue}"],
    ignores: [
      "src/shared/api/openapi-types.ts",
      "src/shared/lib/i18n/**",
    ],
    plugins: {
      sonarjs: pluginSonarjs,
      "no-secrets": pluginNoSecrets,
    },
    rules: {
      "no-secrets/no-secrets": [
        "error",
        { tolerance: 4.5, ignoreContent: "^[a-z][a-zA-Z0-9_]*$" },
      ],
      "sonarjs/cognitive-complexity": ["error", 20],
      complexity: ["error", { max: 20 }],
      "max-depth": ["error", 4],
      "max-params": ["error", 5],
      "max-nested-callbacks": ["error", 4],
      "max-lines-per-function": [
        "error",
        { max: 230, skipBlankLines: true, skipComments: true, IIFEs: true },
      ],
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
