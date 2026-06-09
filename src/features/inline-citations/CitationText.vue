<template>
  <span class="citation-text">
    <template v-for="(segment, index) in segments" :key="index">
      <span v-if="segment.kind === 'text'">{{ segment.text }}</span>
      <button
        v-else
        type="button"
        class="citation-text__marker"
        :class="{ 'citation-text__marker--missing': isMissing(segment.chunkId) }"
        :title="
          isMissing(segment.chunkId)
            ? t('inlineCitations.missing')
            : t('inlineCitations.click')
        "
        @click.stop="onClick(segment.chunkId!)"
      >
        <sup>{{ markerLabel(segment.chunkId!) }}</sup>
      </button>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { useInlineCitations } from "@/features/inline-citations/useInlineCitations";
import { splitTextByCitations } from "@/shared/lib/citation-marker";
import { useI18n } from "@/shared/lib/i18n";

const props = defineProps<{ text: string }>();

const emit = defineEmits<{
  (event: "select", chunkId: string): void;
}>();

const { t } = useI18n();
const citations = useInlineCitations();

const segments = computed(() => splitTextByCitations(props.text));

function markerLabel(chunkId: string | undefined): string {
  if (!chunkId) return "?";
  const tail = chunkId.split("#").pop() ?? chunkId;
  return tail.length > 16 ? `${tail.slice(0, 16)}…` : tail;
}

function isMissing(chunkId: string | undefined): boolean {
  if (!chunkId) return true;
  const found = citations.history.value.find(
    (citation) => citation.chunkId === chunkId,
  );
  return found ? !found.found : false;
}

async function onClick(chunkId: string): Promise<void> {
  emit("select", chunkId);
  await citations.resolve(chunkId);
}
</script>

<style scoped>
.citation-text {
  display: inline;
}

.citation-text__marker {
  appearance: none;
  background: transparent;
  border: none;
  padding: 0 2px;
  cursor: pointer;
  color: var(--accent);
  font-weight: 500;
  font-family: var(--font-mono);
  line-height: 1;
}

.citation-text__marker:hover {
  text-decoration: underline;
}

.citation-text__marker--missing {
  color: var(--warning);
}

.citation-text__marker sup {
  font-size: 80%;
}
</style>
