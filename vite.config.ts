import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

function resolveBuildOutDir(): string {
  const rawOutDir = process.env.VITE_BUILD_OUT_DIR?.trim();
  if (rawOutDir) {
    return path.isAbsolute(rawOutDir) ? rawOutDir : path.resolve(__dirname, rawOutDir);
  }

  const embeddedUiDir = path.resolve(__dirname, "../backend/UI");
  if (fs.existsSync(embeddedUiDir)) {
    return path.resolve(embeddedUiDir, "Web");
  }

  return path.resolve(__dirname, "dist");
}

export default defineConfig({
  plugins: [vue()],
  base: "/",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: resolveBuildOutDir(),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("@vue-flow")) return "chunk-vueflow";
          if (id.includes("/d3") || id.includes("/d3-")) return "chunk-d3";
          if (id.includes("marked") || id.includes("dompurify"))
            return "chunk-markdown";
          if (id.includes("vue") || id.includes("pinia")) return "chunk-vue";
          return "chunk-vendor";
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/api": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/tasks": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/v1": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ui/models": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ui/remote-models": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/artifacts": { target: "http://127.0.0.1:8000", changeOrigin: true },
      "/ws": { target: "ws://127.0.0.1:8000", ws: true },
    },
  },
});
