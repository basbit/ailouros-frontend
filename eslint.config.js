import eslint from "@eslint/js";
import eslintConfigPrettier from "eslint-config-prettier";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";
import vueParser from "vue-eslint-parser";

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
