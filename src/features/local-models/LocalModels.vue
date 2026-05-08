<template>
  <details class="section section-local-models" :open="state.isDesktop.value">
    <summary>
      {{ t("localModels.summary") }}
      <span class="scope-badge scope-badge-local">{{
        t("localModels.scopeBadge")
      }}</span>
    </summary>
    <div class="section-body">
      <p v-if="!state.isDesktop.value" class="hint hint-desktop-only">
        {{ t("localModels.desktopOnly") }}
      </p>

      <template v-else>
        <p class="hint">{{ t("localModels.intro") }}</p>

        <div v-if="state.loadError.value" class="error error-block">
          {{ state.loadError.value }}
          <button type="button" class="btn-link" @click="state.refresh()">
            {{ t("localModels.retry") }}
          </button>
        </div>

        <p v-if="state.loading.value" class="hint">{{ t("localModels.loading") }}</p>

        <ul v-else-if="state.available.value.length" class="local-models-list">
          <li
            v-for="model in state.available.value"
            :key="model.entry.id"
            class="local-models-row"
          >
            <div class="local-models-row__head">
              <span class="local-models-row__label">{{ model.entry.label }}</span>
              <span v-if="model.is_default" class="badge badge-default">{{
                t("localModels.defaultBadge")
              }}</span>
              <span v-if="model.on_disk" class="badge badge-installed">{{
                t("localModels.installedBadge")
              }}</span>
            </div>
            <div class="local-models-row__meta">
              {{ model.entry.family }} · {{ model.entry.params }} ·
              {{ model.entry.quant }} · {{ formatBytes(model.entry.size_bytes) }}
            </div>
            <div class="local-models-row__actions">
              <button
                v-if="!model.on_disk"
                type="button"
                class="btn"
                :disabled="
                  state.download.active !== null &&
                  state.download.active !== model.entry.id
                "
                @click="state.startDownload(model.entry.id)"
              >
                {{ downloadLabel(model.entry.id) }}
              </button>
            </div>
            <progress
              v-if="state.download.active === model.entry.id"
              :value="state.download.fraction[model.entry.id] ?? 0"
              max="1"
              class="local-models-row__progress"
            />
          </li>
        </ul>

        <p v-else class="hint">{{ t("localModels.empty") }}</p>

        <p v-if="state.download.error" class="error">
          {{ state.download.error }}
        </p>
      </template>
    </div>
  </details>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useLocalModels } from "./useLocalModels";

const { t } = useI18n();
const state = useLocalModels();

onMounted(async () => {
  const desktopReady = await state.ensureDesktopFlag();
  if (desktopReady) await state.refresh();
});

onBeforeUnmount(() => {
  state.dispose();
});

function downloadLabel(id: string): string {
  if (state.download.active === id) {
    const fraction = state.download.fraction[id] ?? 0;
    return t("localModels.downloading", { percent: Math.round(fraction * 100) });
  }
  return t("localModels.download");
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
</script>

<style scoped>
.local-models-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.local-models-row {
  border: 1px solid var(--border-subtle, #e0e0e0);
  border-radius: 6px;
  padding: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.local-models-row__head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.local-models-row__label {
  font-weight: 600;
}
.local-models-row__meta {
  font-size: 0.85rem;
  color: var(--text-muted, #666);
}
.local-models-row__progress {
  width: 100%;
  height: 4px;
}
.badge {
  font-size: 0.7rem;
  padding: 0.1rem 0.4rem;
  border-radius: 999px;
  background: var(--badge-bg, #f0f0f0);
  color: var(--badge-fg, #333);
}
.badge-default {
  background: #d6e4ff;
  color: #1d4ed8;
}
.badge-installed {
  background: #dcfce7;
  color: #166534;
}
.error-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.btn-link {
  background: none;
  border: none;
  color: var(--accent, #2563eb);
  cursor: pointer;
  text-decoration: underline;
}
.hint-desktop-only {
  font-style: italic;
  color: var(--text-muted, #666);
}
</style>
