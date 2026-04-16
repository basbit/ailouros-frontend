<template>
  <details class="panel wiki-graph-panel" :open="open" @toggle="onToggle">
    <summary class="panel-header">
      <span class="panel-title">{{ t("wikiGraph.title") }}</span>
      <span v-if="data?.nodes?.length" class="hint">
        {{ t("wikiGraph.nodeCount", { n: data.nodes.length }) }}
      </span>
      <button
        v-if="open"
        type="button"
        class="wiki-graph-panel__refresh btn-secondary"
        :title="t('wikiGraph.refresh')"
        @click.stop.prevent="refreshGraph(true)"
      >
        ↻
      </button>
    </summary>
    <div class="panel-body wiki-graph-panel__body">
      <GraphControls v-model:search="search" />

      <div v-if="currentWorkspaceRoot()" class="wiki-graph-panel__workspace">
        <span class="wiki-graph-panel__workspace-label">project:</span>
        <code class="wiki-graph-panel__workspace-path">{{
          currentWorkspaceRoot()
        }}</code>
      </div>

      <div class="wiki-graph-panel__viewport">
        <div v-if="loading" class="wiki-graph-panel__state">
          {{ t("wikiGraph.loading") }}
        </div>
        <div
          v-else-if="error"
          class="wiki-graph-panel__state wiki-graph-panel__state--error"
        >
          {{ error }}
        </div>
        <div v-else-if="!data || !data.nodes.length" class="wiki-graph-panel__state">
          <div>
            <p>{{ t("wikiGraph.empty") }}</p>
            <p v-if="currentWorkspaceRoot()" class="wiki-graph-panel__hint">
              Run a pipeline on
              <code>{{ currentWorkspaceRoot() }}</code> — wiki is generated
              automatically after each run.
            </p>
            <p v-else class="wiki-graph-panel__hint">
              Set a workspace path in the sidebar, then run the pipeline.
            </p>
          </div>
        </div>
        <GraphCanvas v-else :data="data" :search="search" @node-click="onNodeClick" />

        <!-- File preview overlay inside the panel -->
        <div v-if="previewFile" class="wiki-graph-panel__preview">
          <div class="wiki-graph-panel__preview-header">
            <span class="wiki-graph-panel__preview-title">{{ previewFile }}</span>
            <button class="wiki-graph-panel__preview-close" @click="previewFile = null">
              ×
            </button>
          </div>
          <div v-if="previewLoading" class="wiki-graph-panel__preview-loading">
            {{ t("wikiGraph.loading") }}
          </div>
          <SafeHtmlBlock
            v-else
            class-name="wiki-graph-panel__preview-content"
            :html="renderedPreview"
          />
        </div>
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { ref, type Ref, inject, watch, computed } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { apiUrl } from "@/shared/api/base";
import { useI18n } from "@/shared/lib/i18n";
import GraphCanvas from "@/features/wiki-graph/GraphCanvas.vue";
import GraphControls from "@/features/wiki-graph/GraphControls.vue";
import { useGraphData } from "@/features/wiki-graph/useGraphData";
import SafeHtmlBlock from "@/shared/components/SafeHtmlBlock";

const LS_OPEN_KEY = "swarm.wiki-graph-panel-open";

const { t } = useI18n();
const { data, loading, error, fetch: loadGraph } = useGraphData();

const _workspaceRoot = inject<Ref<string>>("workspaceRoot", ref(""));

const search = ref("");
const previewFile = ref<string | null>(null);
const previewContent = ref("");
const previewLoading = ref(false);
const open = ref<boolean>(localStorage.getItem(LS_OPEN_KEY) === "1");
const hasLoaded = ref<boolean>(false);

const renderedPreview = computed(() => {
  if (!previewContent.value) return "";
  let md = previewContent.value;
  // Strip YAML frontmatter (---\n...\n---) before rendering markdown
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
  hasLoaded.value = true;
}

function onToggle(event: Event): void {
  const target = event.target as HTMLDetailsElement;
  open.value = target.open;
  localStorage.setItem(LS_OPEN_KEY, target.open ? "1" : "0");
  // Lazy-load on first open — avoids graph fetch for users who never open the panel.
  if (target.open && !hasLoaded.value) {
    void refreshGraph();
  }
}

// Re-fetch when workspace changes — but only if the user has opened the panel
// at least once. Closed panel should not trigger background fetches.
watch(_workspaceRoot, () => {
  if (hasLoaded.value) void refreshGraph();
});

// If user restored with open=true via localStorage, trigger the initial load.
if (open.value) void refreshGraph();
</script>

<style scoped>
.wiki-graph-panel__body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 12px 12px;
}
.wiki-graph-panel__refresh {
  padding: 2px 10px;
  font-size: 14px;
  line-height: 1;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text2);
  cursor: pointer;
  margin-left: 6px;
}
.wiki-graph-panel__refresh:hover {
  color: var(--text);
  background: var(--surface2);
}
.wiki-graph-panel__workspace {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: color-mix(in srgb, var(--accent) 8%, transparent);
  border-radius: 4px;
  font-size: 11px;
}
.wiki-graph-panel__workspace-label {
  color: var(--text3);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.wiki-graph-panel__workspace-path {
  color: var(--text2);
  font-family: var(--mono, monospace);
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 600px;
}
.wiki-graph-panel__viewport {
  position: relative;
  /* Minimum half-screen, preferred 70 % of viewport. */
  min-height: 50vh;
  height: 70vh;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--surface);
}
.wiki-graph-panel__state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--text2);
  font-size: 13px;
  padding: 16px;
  text-align: center;
}
.wiki-graph-panel__state--error {
  color: var(--error);
}
.wiki-graph-panel__hint {
  font-size: 12px;
  color: var(--text2);
  margin-top: 8px;
}
.wiki-graph-panel__hint code {
  font-family: var(--mono, monospace);
  background: var(--border);
  padding: 1px 4px;
  border-radius: 3px;
}
.wiki-graph-panel__preview {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 55%;
  min-width: 320px;
  max-width: 600px;
  background: var(--bg);
  border-left: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  z-index: 5;
}
.wiki-graph-panel__preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  font-weight: 600;
}
.wiki-graph-panel__preview-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text2);
  font-size: 14px;
  padding: 2px 6px;
}
.wiki-graph-panel__preview-close:hover {
  color: var(--text);
}
.wiki-graph-panel__preview-loading {
  padding: 16px;
  color: var(--text2);
  font-size: 12px;
}
.wiki-graph-panel__preview-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  font-size: 13px;
  line-height: 1.7;
  color: var(--text);
}
.wiki-graph-panel__preview-content :deep(h1),
.wiki-graph-panel__preview-content :deep(h2),
.wiki-graph-panel__preview-content :deep(h3) {
  color: var(--text);
  margin-top: 1em;
  margin-bottom: 0.4em;
}
.wiki-graph-panel__preview-content :deep(h1) {
  font-size: 18px;
}
.wiki-graph-panel__preview-content :deep(h2) {
  font-size: 15px;
}
.wiki-graph-panel__preview-content :deep(h3) {
  font-size: 13px;
}
.wiki-graph-panel__preview-content :deep(pre) {
  background: color-mix(in srgb, var(--border) 30%, var(--bg));
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 10px 12px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.5;
}
.wiki-graph-panel__preview-content :deep(code) {
  font-family: var(--mono, monospace);
  font-size: 12px;
  background: color-mix(in srgb, var(--border) 20%, var(--bg));
  padding: 1px 4px;
  border-radius: 3px;
}
.wiki-graph-panel__preview-content :deep(pre code) {
  background: none;
  padding: 0;
}
.wiki-graph-panel__preview-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  margin: 8px 0;
}
.wiki-graph-panel__preview-content :deep(th),
.wiki-graph-panel__preview-content :deep(td) {
  border: 1px solid var(--border);
  padding: 4px 8px;
  text-align: left;
}
.wiki-graph-panel__preview-content :deep(th) {
  background: color-mix(in srgb, var(--accent) 10%, var(--bg));
  font-weight: 600;
}
.wiki-graph-panel__preview-content :deep(a) {
  color: var(--accent);
}
.wiki-graph-panel__preview-content :deep(ol),
.wiki-graph-panel__preview-content :deep(ul) {
  padding-left: 20px;
}
.wiki-graph-panel__preview-content :deep(hr) {
  border: none;
  border-top: 1px solid var(--border);
  margin: 12px 0;
}
</style>
