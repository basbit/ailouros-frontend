<template>
  <div v-if="open" class="prompt-library">
    <div class="prompt-library__panel" role="dialog" @click.stop>
      <header class="prompt-library__head">
        <input
          ref="searchRef"
          type="text"
          class="prompt-library__search"
          :value="query"
          :placeholder="t('promptLibrary.search')"
          @input="onQueryInput($event)"
        />
        <button type="button" class="prompt-library__close" @click="onClose">×</button>
      </header>
      <ul v-if="filtered.length" class="prompt-library__list">
        <li v-for="entry in filtered" :key="entry.id" class="prompt-library__item">
          <button type="button" class="prompt-library__pick" @click="onPick(entry)">
            <div class="prompt-library__title">{{ entry.title }}</div>
            <div class="prompt-library__body">{{ entry.body }}</div>
          </button>
          <div class="prompt-library__row">
            <span class="prompt-library__tags">
              <span v-for="tag in entry.tags" :key="tag" class="prompt-library__tag">{{
                tag
              }}</span>
            </span>
            <button
              type="button"
              class="prompt-library__remove"
              :title="t('promptLibrary.remove')"
              @click="emit('remove', entry.id)"
            >
              −
            </button>
          </div>
        </li>
      </ul>
      <p v-else class="prompt-library__empty">{{ t("promptLibrary.empty") }}</p>
      <footer class="prompt-library__foot">
        <button type="button" class="prompt-library__add" @click="emit('save-current')">
          + {{ t("promptLibrary.saveCurrent") }}
        </button>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from "vue";
import { useI18n } from "@/shared/lib/i18n";

export interface PromptEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

const props = defineProps<{
  open: boolean;
  entries: PromptEntry[];
}>();

const emit = defineEmits<{
  pick: [entry: PromptEntry];
  remove: [id: string];
  "save-current": [];
  close: [];
}>();

const { t } = useI18n();
const query = ref("");
const searchRef = ref<HTMLInputElement | null>(null);

watch(
  () => props.open,
  async (open) => {
    if (open) {
      query.value = "";
      await nextTick();
      searchRef.value?.focus();
    }
  },
);

const filtered = computed<PromptEntry[]>(() => {
  const text = query.value.trim().toLowerCase();
  if (!text) return props.entries;
  return props.entries.filter((entry) => {
    const haystack = [entry.title, entry.body, ...(entry.tags || [])]
      .join(" ")
      .toLowerCase();
    return haystack.includes(text);
  });
});

function onQueryInput(event: Event): void {
  const target = event.target as HTMLInputElement | null;
  query.value = target?.value ?? "";
}

function onPick(entry: PromptEntry): void {
  emit("pick", entry);
  emit("close");
}

function onClose(): void {
  emit("close");
}
</script>

<style scoped>
.prompt-library {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
  z-index: 1000;
}
.prompt-library__panel {
  width: min(560px, 90vw);
  max-height: 70vh;
  background: var(--surface, #1a1d29);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.prompt-library__head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.prompt-library__search {
  flex: 1;
  padding: 6px 10px;
  font-size: 13px;
  border-radius: 6px;
  border: 1px solid var(--border, #2a2f3e);
  background: var(--surface2, #14171f);
  color: var(--text, #f5f0e7);
}
.prompt-library__close {
  background: transparent;
  border: none;
  color: var(--text2, #a8b0c4);
  font-size: 18px;
  cursor: pointer;
}
.prompt-library__list {
  list-style: none;
  margin: 0;
  padding: 6px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.prompt-library__item {
  border: 1px solid transparent;
  border-radius: 6px;
  padding: 4px;
}
.prompt-library__pick {
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  color: var(--text, #f5f0e7);
  cursor: pointer;
  padding: 4px 6px;
}
.prompt-library__title {
  font-weight: 600;
  font-size: 12px;
}
.prompt-library__body {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  margin-top: 2px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.prompt-library__row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  padding: 0 6px 4px;
}
.prompt-library__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}
.prompt-library__tag {
  font-size: 10px;
  padding: 1px 5px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--text3, #6b7280) 25%, transparent);
  color: var(--text2, #a8b0c4);
}
.prompt-library__remove {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #a8b0c4);
  font-size: 11px;
  width: 22px;
  height: 22px;
  cursor: pointer;
}
.prompt-library__empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text2, #a8b0c4);
}
.prompt-library__foot {
  padding: 8px 10px;
  border-top: 1px solid var(--border, #2a2f3e);
}
.prompt-library__add {
  background: transparent;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  padding: 4px 10px;
  font-size: 11px;
  color: var(--text, #f5f0e7);
  cursor: pointer;
}
</style>
