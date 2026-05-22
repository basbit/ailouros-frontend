import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: "jsdom",
      include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
      setupFiles: ["./vitest.setup.ts"],
      testTimeout: 15000,
      typecheck: {
        enabled: true,
        checker: "vue-tsc",
        include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
        tsconfig: "./tsconfig.json",
      },
    },
  }),
);
