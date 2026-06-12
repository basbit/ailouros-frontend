<template>
  <div class="code-graph-panel">
    <p v-if="loading" class="cg-status">{{ t("configure.codeGraph.loading") }}</p>
    <p v-else-if="error" class="cg-status cg-error">{{ error }}</p>
    <template v-else-if="data">
      <div class="cg-stats">
        <span>{{ data.report.node_count }} {{ t("configure.codeGraph.symbols") }}</span>
        <span
          >{{ data.report.edge_count }} {{ t("configure.codeGraph.edgesUnit") }}</span
        >
      </div>

      <section v-if="context" class="cg-section cg-selected">
        <h4>
          {{ t("configure.codeGraph.selected") }}:
          {{ context.definition.qualified_name }}
        </h4>
        <p class="cg-selected-path">
          {{ context.definition.file_path }}:{{ context.definition.line_start }}
        </p>
        <div class="cg-context-cols">
          <div>
            <h5>{{ t("configure.codeGraph.callers") }}</h5>
            <p v-if="!context.callers.length" class="cg-muted">
              {{ t("configure.codeGraph.none") }}
            </p>
            <ul v-else>
              <li v-for="caller in context.callers" :key="caller.node_id">
                {{ caller.qualified_name }}
              </li>
            </ul>
          </div>
          <div>
            <h5>{{ t("configure.codeGraph.callees") }}</h5>
            <p v-if="!context.callees.length" class="cg-muted">
              {{ t("configure.codeGraph.none") }}
            </p>
            <ul v-else>
              <li v-for="callee in context.callees" :key="callee.node_id">
                {{ callee.qualified_name }}
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section v-if="data.report.top_called.length" class="cg-section">
        <h4>{{ t("configure.codeGraph.topCalled") }}</h4>
        <ul>
          <li v-for="item in data.report.top_called" :key="item.qualified_name">
            {{ item.qualified_name }} — {{ item.callers }}
          </li>
        </ul>
      </section>

      <section v-if="data.report.entry_points.length" class="cg-section">
        <h4>{{ t("configure.codeGraph.entryPoints") }}</h4>
        <ul>
          <li v-for="name in data.report.entry_points" :key="name">{{ name }}</li>
        </ul>
      </section>

      <section v-if="data.report.orphans.length" class="cg-section">
        <h4>{{ t("configure.codeGraph.orphans") }}</h4>
        <ul>
          <li v-for="name in data.report.orphans" :key="name">{{ name }}</li>
        </ul>
      </section>

      <section v-if="data.report.cyclic_symbols.length" class="cg-section">
        <h4 class="cg-warn">{{ t("configure.codeGraph.cycles") }}</h4>
        <ul>
          <li v-for="name in data.report.cyclic_symbols" :key="name">{{ name }}</li>
        </ul>
      </section>

      <section class="cg-section">
        <h4>{{ t("configure.codeGraph.edgesTitle") }}</h4>
        <label class="cg-filter">
          {{ t("configure.codeGraph.kind") }}
          <select v-model="edgeKind">
            <option value="">{{ t("configure.codeGraph.all") }}</option>
            <option v-for="kind in edgeKinds" :key="kind" :value="kind">
              {{ kind }}
            </option>
          </select>
        </label>
        <ul class="cg-edges">
          <li v-for="edge in filteredEdges" :key="edgeKey(edge)">
            {{ shortName(edge.src_id) }} →[{{ edge.kind }}]→
            {{ shortName(edge.dst_id) }}
          </li>
        </ul>
      </section>
    </template>
    <p v-else class="cg-status">{{ t("configure.codeGraph.empty") }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

import type {
  CodeGraphContext,
  CodeGraphEdge,
  CodeGraphResponse,
} from "@/features/code-graph/model/types";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  data: CodeGraphResponse | null;
  loading: boolean;
  error: string | null;
  context?: CodeGraphContext | null;
}>();

const { t } = useI18n();
const edgeKind = ref("");
const EDGE_LIMIT = 200;

const edgeKinds = computed(() => {
  const kinds = new Set<string>();
  for (const edge of props.data?.edges ?? []) kinds.add(edge.kind);
  return [...kinds].sort();
});

const nodeNames = computed(() => {
  const names = new Map<string, string>();
  for (const node of props.data?.nodes ?? []) {
    names.set(node.node_id, node.qualified_name);
  }
  return names;
});

const filteredEdges = computed(() => {
  const edges = props.data?.edges ?? [];
  const selected = edgeKind.value
    ? edges.filter((edge) => edge.kind === edgeKind.value)
    : edges;
  return selected.slice(0, EDGE_LIMIT);
});

function shortName(nodeId: string): string {
  return nodeNames.value.get(nodeId) ?? nodeId;
}

function edgeKey(edge: CodeGraphEdge): string {
  return `${edge.src_id}|${edge.kind}|${edge.dst_id}|${edge.call_site_line ?? ""}`;
}
</script>

<style scoped>
.code-graph-panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.cg-stats {
  display: flex;
  gap: 1rem;
  font-weight: 600;
}
.cg-section h4 {
  margin: 0 0 0.25rem;
}
.cg-edges {
  max-height: 16rem;
  overflow-y: auto;
  font-family: monospace;
  font-size: 0.85em;
}
.cg-error {
  color: var(--color-danger, #c0392b);
}
.cg-warn {
  color: var(--color-warning, #b9770e);
}
.cg-filter {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
}
.cg-selected {
  border: 1px solid var(--color-border, #d0d0d0);
  border-radius: 6px;
  padding: 0.5rem 0.75rem;
}
.cg-selected-path {
  font-family: monospace;
  font-size: 0.8em;
  opacity: 0.75;
  margin: 0 0 0.5rem;
}
.cg-context-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.cg-context-cols h5 {
  margin: 0 0 0.25rem;
}
.cg-muted {
  opacity: 0.6;
  font-size: 0.85em;
  margin: 0;
}
</style>
