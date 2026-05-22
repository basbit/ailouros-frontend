<template>
  <section v-if="sources.length" class="scenario-sources">
    <header class="scenario-sources__head">
      <span class="scenario-sources__title">{{ t("scenarioSources.title") }}</span>
      <span class="scenario-sources__count">{{ sources.length }}</span>
    </header>
    <table class="scenario-sources__table">
      <thead>
        <tr>
          <th>{{ t("scenarioSources.col.title") }}</th>
          <th>{{ t("scenarioSources.col.authority") }}</th>
          <th>{{ t("scenarioSources.col.recency") }}</th>
          <th>{{ t("scenarioSources.col.bias") }}</th>
          <th>{{ t("scenarioSources.col.kept") }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in sources"
          :key="index"
          :class="{ 'is-rejected': row.kept === false }"
        >
          <td class="scenario-sources__title-cell">
            {{ row.title || row.url || "—" }}
          </td>
          <td>{{ row.authority || "—" }}</td>
          <td>{{ row.recency || "—" }}</td>
          <td>{{ row.bias || "—" }}</td>
          <td>
            {{
              row.kept === undefined
                ? "—"
                : row.kept
                  ? t("scenarioSources.kept")
                  : t("scenarioSources.rejected")
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { extractJsonBlocks } from "@/shared/lib/extract-json-blocks";

interface SourceRow {
  title?: string;
  url?: string;
  authority?: string;
  recency?: string;
  bias?: string;
  kept?: boolean;
}

const props = defineProps<{
  rawAgentText: string;
}>();

const { t } = useI18n();

const sources = computed<SourceRow[]>(() => {
  const blocks = extractJsonBlocks(props.rawAgentText || "");
  for (const block of blocks) {
    if (Array.isArray(block) && block.length && typeof block[0] === "object") {
      const sample = block[0] as Record<string, unknown>;
      if ("title" in sample || "url_or_query" in sample || "url" in sample) {
        return block.map((item) => {
          const row = item as Record<string, unknown>;
          return {
            title: typeof row.title === "string" ? row.title : undefined,
            url:
              typeof row.url === "string"
                ? row.url
                : typeof row.url_or_query === "string"
                  ? (row.url_or_query as string)
                  : undefined,
            authority: typeof row.authority === "string" ? row.authority : undefined,
            recency: typeof row.recency === "string" ? row.recency : undefined,
            bias: typeof row.bias === "string" ? row.bias : undefined,
            kept: typeof row.keep === "boolean" ? row.keep : undefined,
          };
        });
      }
    }
  }
  return [];
});
</script>

<style scoped>
.scenario-sources {
  border-top: 1px solid var(--border);
  margin-top: 12px;
  padding-top: 12px;
}
.scenario-sources__head {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}
.scenario-sources__title {
  font-size: 12px;
  font-weight: 650;
  color: var(--text, #f5f0e7);
}
.scenario-sources__count {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
.scenario-sources__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}
.scenario-sources__table th,
.scenario-sources__table td {
  border-bottom: 1px solid color-mix(in srgb, var(--border, #2a2f3e) 60%, transparent);
  padding: 4px 6px;
  text-align: left;
}
.scenario-sources__table tr.is-rejected td {
  opacity: 0.5;
  text-decoration: line-through;
}
.scenario-sources__title-cell {
  font-weight: 600;
  max-width: 320px;
  overflow-wrap: anywhere;
}
</style>
