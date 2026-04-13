<template>
  <div class="wiki-graph-page">
    <div class="wiki-graph-page__header">
      <button class="wiki-graph-page__back" @click="goBack()">&#8592;</button>
      <h2 class="wiki-graph-page__title">{{ t("wikiGraph.title") }}</h2>
      <button class="wiki-graph-page__refresh btn-secondary" @click="refreshGraph(true)">
        {{ t("wikiGraph.refresh") }}
      </button>
    </div>

    <GraphControls v-model:search="search" />

    <div v-if="currentWorkspaceRoot()" class="wiki-graph-page__workspace">
      <span class="wiki-graph-page__workspace-label">project:</span>
      <code class="wiki-graph-page__workspace-path">{{ currentWorkspaceRoot() }}</code>
    </div>

    <div class="wiki-graph-page__body">
      <div v-if="loading" class="wiki-graph-page__state">
        {{ t("wikiGraph.loading") }}
      </div>
      <div
        v-else-if="error"
        class="wiki-graph-page__state wiki-graph-page__state--error"
      >
        {{ error }}
      </div>
      <div v-else-if="!data || !data.nodes.length" class="wiki-graph-page__state">
        <div>
          <p>{{ t("wikiGraph.empty") }}</p>
          <p v-if="currentWorkspaceRoot()" class="wiki-graph-page__hint">
            Run a pipeline on <code>{{ currentWorkspaceRoot() }}</code> — wiki is generated automatically after each run.
          </p>
          <p v-else class="wiki-graph-page__hint">
            Set a workspace path in the sidebar, then run the pipeline.
          </p>
        </div>
      </div>
      <GraphCanvas v-else :data="data" :search="search" @node-click="onNodeClick" />
    </div>

    <!-- File preview panel -->
    <div v-if="previewFile" class="wiki-graph-page__preview">
      <div class="wiki-graph-page__preview-header">
        <span class="wiki-graph-page__preview-title">{{ previewFile }}</span>
        <button class="wiki-graph-page__preview-close" @click="previewFile = null">
          &#x2715;
        </button>
      </div>
      <div v-if="previewLoading" class="wiki-graph-page__preview-loading">
        {{ t("wikiGraph.loading") }}
      </div>
      <!-- eslint-disable-next-line vue/no-v-html -- content is sanitized via DOMPurify before rendering -->
      <div v-else class="wiki-graph-page__preview-content" v-html="renderedPreview" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type Ref, inject, onMounted, watch, computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import GraphCanvas from "@/features/wiki-graph/GraphCanvas.vue";
import GraphControls from "@/features/wiki-graph/GraphControls.vue";
import { useGraphData } from "@/features/wiki-graph/useGraphData";

const { t } = useI18n();
const { data, loading, error, fetch: loadGraph } = useGraphData();

const goBack = inject<() => void>("toggleWikiGraph", () => {});
const _workspaceRoot = inject<Ref<string>>("workspaceRoot", ref(""));

const search = ref("");
const previewFile = ref<string | null>(null);
const previewContent = ref("");
const previewLoading = ref(false);

const renderedPreview = computed(() => {
  if (!previewContent.value) return "";
  // Strip YAML frontmatter (---\n...\n---) before rendering markdown
  let md = previewContent.value;
  const fmMatch = md.match(/^---\s*\n[\s\S]*?\n---\s*\n/);
  if (fmMatch) md = md.slice(fmMatch[0].length);
  const html = marked.parse(md.trim(), { async: false }) as string;
  return DOMPurify.sanitize(html);
});

function currentWorkspaceRoot(): string {
  return _workspaceRoot.value?.trim() ?? "";
}

async function onNodeClick(nodeId: string): Promise<void> {
  previewFile.value = nodeId;
  previewLoading.value = true;
  previewContent.value = "";
  try {
    const params = new URLSearchParams({ path: nodeId });
    const ws = currentWorkspaceRoot();
    if (ws) params.set("workspace_root", ws);
    const r = await fetch(apiUrl(`/api/wiki/file?${params.toString()}`));
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    previewContent.value = await r.text();
  } catch (e) {
    previewContent.value = `Error loading ${nodeId}: ${e instanceof Error ? e.message : String(e)}`;
  } finally {
    previewLoading.value = false;
  }
}

async function refreshGraph(force = false): Promise<void> {
  await loadGraph(currentWorkspaceRoot(), force);
}

// Re-fetch when workspace changes (user switches project in sidebar)
watch(_workspaceRoot, () => { void refreshGraph(); });

onMounted(() => {
  void refreshGraph();
});
</script>

<style scoped>
.wiki-graph-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg);
  color: var(--text);
  position: relative;
}
.wiki-graph-page__workspace {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 16px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border-bottom: 1px solid var(--border);
  font-size: 11px;
}
.wiki-graph-page__workspace-label {
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.wiki-graph-page__workspace-path {
  color: var(--text2);
  font-family: monospace;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 600px;
}
.wiki-graph-page__hint {
  font-size: 12px;
  color: var(--text2);
  margin-top: 8px;
}
.wiki-graph-page__hint code {
  font-family: monospace;
  background: var(--border);
  padding: 1px 4px;
  border-radius: 3px;
}
.wiki-graph-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px 8px;
  border-bottom: 1px solid var(--border);
}
.wiki-graph-page__back {
  background: none;
  border: 1px solid var(--border);
  border-radius: 999px;
  color: var(--text2);
  cursor: pointer;
  font-size: 14px;
  padding: 4px 10px;
  line-height: 1;
  transition:
    background 0.15s,
    color 0.15s;
}
.wiki-graph-page__back:hover {
  background: var(--border);
  color: var(--text);
}
.wiki-graph-page__title {
  flex: 1;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}
.wiki-graph-page__body {
  flex: 1;
  overflow: hidden;
}
.wiki-graph-page__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text2);
  font-size: 13px;
}
.wiki-graph-page__state--error {
  color: var(--accent);
}
.wiki-graph-page__preview {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 50%;
  min-width: 320px;
  max-width: 720px;
  background: var(--bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 5;
}
.wiki-graph-page__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
}
.wiki-graph-page__preview-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text2);
  font-size: 14px;
  padding: 2px 4px;
}
.wiki-graph-page__preview-close:hover {
  color: var(--text);
}
.wiki-graph-page__preview-loading {
  padding: 16px;
  color: var(--text2);
  font-size: 12px;
}
.wiki-graph-page__preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}
/* Markdown rendered content inside preview */
.wiki-graph-page__preview-content :deep(h1),
.wiki-graph-page__preview-content :deep(h2),
.wiki-graph-page__preview-content :deep(h3) {
  color: var(--text);
  margin-top: 1em;
  margin-bottom: 0.4em;
}
.wiki-graph-page__preview-content :deep(h1) { font-size: 18px; }
.wiki-graph-page__preview-content :deep(h2) { font-size: 15px; }
.wiki-graph-page__preview-content :deep(h3) { font-size: 13px; }
.wiki-graph-page__preview-content :deep(pre) {
  background: color-mix(in srgb, var(--border) 30%, var(--bg));
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}
.wiki-graph-page__preview-content :deep(code) {
  font-family: monospace;
  font-size: 12px;
  background: color-mix(in srgb, var(--border) 20%, var(--bg));
  padding: 1px 4px;
  border-radius: 3px;
}
.wiki-graph-page__preview-content :deep(pre code) {
  background: none;
  padding: 0;
}
.wiki-graph-page__preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 8px 0;
}
.wiki-graph-page__preview-content :deep(th),
.wiki-graph-page__preview-content :deep(td) {
  border: 1px solid var(--border);
  padding: 4px 8px;
  text-align: left;
}
.wiki-graph-page__preview-content :deep(th) {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg));
  font-weight: 600;
}
.wiki-graph-page__preview-content :deep(strong) {
  color: var(--text);
}
.wiki-graph-page__preview-content :deep(a) {
  color: var(--accent);
}
.wiki-graph-page__preview-content :deep(ol),
.wiki-graph-page__preview-content :deep(ul) {
  padding-left: 20px;
}
.wiki-graph-page__preview-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}
</style>
