<template>
  <section class="spec-content-viewer">
    <p v-if="loading" class="spec-content-viewer__state">
      {{ t("specContent.loading") }}
    </p>
    <p v-else-if="notFound" class="spec-content-viewer__state">
      {{ t("specContent.notFound") }}
    </p>
    <p
      v-else-if="error"
      class="spec-content-viewer__state spec-content-viewer__state--error"
    >
      {{ error }}
    </p>
    <template v-else-if="document">
      <dl class="spec-content-viewer__meta">
        <div v-if="document.title">
          <dt>{{ t("specContent.title") }}</dt>
          <dd>{{ document.title }}</dd>
        </div>
        <div v-if="document.status">
          <dt>{{ t("specContent.status") }}</dt>
          <dd>{{ document.status }}</dd>
        </div>
        <div v-if="document.version">
          <dt>{{ t("specContent.version") }}</dt>
          <dd>{{ document.version }}</dd>
        </div>
      </dl>
      <pre class="spec-content-viewer__body">{{ bodyText }}</pre>
    </template>
    <p v-else class="spec-content-viewer__state">{{ t("specContent.empty") }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from "vue";
import { useSpecDocument } from "./useSpecDocument";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{
  specId: string;
  workspaceRoot: string;
}>();

const { t } = useI18n();
const { document, loading, error, notFound, load } = useSpecDocument();

const bodyText = computed(() => (document.value?.body ?? "").trim());

onMounted(() => {
  void load(props.specId, props.workspaceRoot);
});

watch(
  () => [props.specId, props.workspaceRoot] as const,
  ([specId, workspaceRoot]) => {
    void load(specId, workspaceRoot);
  },
);
</script>

<style scoped>
.spec-content-viewer {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.spec-content-viewer__state {
  margin: 0;
  font-size: 13px;
  color: var(--ink-3, #888);
}

.spec-content-viewer__state--error {
  color: var(--error, #c0392b);
}

.spec-content-viewer__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 0;
  font-size: 12px;
}

.spec-content-viewer__meta dt {
  font-weight: 600;
  color: var(--ink-3, #888);
}

.spec-content-viewer__meta dd {
  margin: 0;
  color: var(--ink, #111);
}

.spec-content-viewer__body {
  margin: 0;
  padding: 10px;
  border: 1px solid var(--line, #e2e2e6);
  border-radius: var(--r-sm, 4px);
  background: var(--bg, transparent);
  font-family: var(--font-mono, ui-monospace, SFMono-Regular, monospace);
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 360px;
  overflow: auto;
}
</style>
