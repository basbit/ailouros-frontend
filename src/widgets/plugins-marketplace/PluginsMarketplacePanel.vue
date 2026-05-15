<template>
  <div class="plugins-marketplace">
    <aside class="plugins-marketplace__rail">
      <header class="plugins-marketplace__rail-head">
        <h3 class="plugins-marketplace__title">Registries</h3>
      </header>

      <form class="plugins-marketplace__add" @submit.prevent="onAddRegistry">
        <input
          v-model="newRegistryName"
          type="text"
          placeholder="name"
          class="plugins-marketplace__input"
          :disabled="registriesState.adding.value"
        />
        <input
          v-model="newRegistryUrl"
          type="url"
          placeholder="https://registry.example.com"
          class="plugins-marketplace__input"
          :disabled="registriesState.adding.value"
        />
        <button
          type="submit"
          class="plugins-marketplace__btn"
          :disabled="registriesState.adding.value"
        >
          {{ registriesState.adding.value ? "Adding…" : "Add registry" }}
        </button>
      </form>

      <div v-if="registriesState.loading.value" class="plugins-marketplace__hint">
        Loading registries…
      </div>
      <div
        v-else-if="registriesState.notImplemented.value"
        class="plugins-marketplace__hint"
      >
        Plugins API not available yet (endpoint not available).
      </div>
      <div v-else-if="registriesState.error.value" class="plugins-marketplace__error">
        {{ registriesState.error.value }}
      </div>
      <ul
        v-else-if="registriesState.registries.value.length"
        class="plugins-marketplace__list"
      >
        <li
          v-for="registry in registriesState.registries.value"
          :key="registry.name"
          class="plugins-marketplace__registry"
        >
          <div class="plugins-marketplace__registry-head">
            <strong>{{ registry.name }}</strong>
            <button
              type="button"
              class="plugins-marketplace__btn plugins-marketplace__btn--ghost"
              :disabled="!!registriesState.refreshing.value[registry.name]"
              @click="registriesState.refresh(registry.name)"
            >
              {{
                registriesState.refreshing.value[registry.name]
                  ? "Refreshing…"
                  : "Refresh"
              }}
            </button>
          </div>
          <div class="plugins-marketplace__registry-url">{{ registry.url }}</div>
          <div v-if="registry.error" class="plugins-marketplace__error">
            {{ registry.error }}
          </div>
          <div v-else class="plugins-marketplace__meta">
            <span v-if="typeof registry.plugin_count === 'number'">
              {{ registry.plugin_count }} plugins
            </span>
            <span v-if="registry.last_refreshed">
              · {{ formatTimestamp(registry.last_refreshed) }}
            </span>
          </div>
        </li>
      </ul>
      <div v-else class="plugins-marketplace__hint">No registries configured.</div>
    </aside>

    <section class="plugins-marketplace__center">
      <form class="plugins-marketplace__search" @submit.prevent="onSearch">
        <input
          v-model="searchState.query.value"
          type="search"
          placeholder="Search plugins…"
          class="plugins-marketplace__input plugins-marketplace__input--grow"
        />
        <button
          type="submit"
          class="plugins-marketplace__btn"
          :disabled="searchState.loading.value"
        >
          {{ searchState.loading.value ? "Searching…" : "Search" }}
        </button>
      </form>

      <div v-if="searchState.loading.value" class="plugins-marketplace__hint">
        Searching…
      </div>
      <div
        v-else-if="searchState.notImplemented.value"
        class="plugins-marketplace__hint"
      >
        Plugin search not available yet (endpoint not available).
      </div>
      <div v-else-if="searchState.error.value" class="plugins-marketplace__error">
        {{ searchState.error.value }}
      </div>
      <ul
        v-else-if="searchState.results.value.length"
        class="plugins-marketplace__list"
      >
        <li
          v-for="hit in searchState.results.value"
          :key="`${hit.registry}/${hit.id}@${hit.version}`"
          class="plugins-marketplace__hit"
        >
          <div class="plugins-marketplace__hit-head">
            <div>
              <strong>{{ hit.name }}</strong>
              <span class="plugins-marketplace__version">{{ hit.version }}</span>
            </div>
            <button
              type="button"
              class="plugins-marketplace__btn"
              :disabled="!!searchState.installing.value.get(hit.id)"
              @click="onInstall(hit)"
            >
              {{ searchState.installing.value.get(hit.id) ? "Installing…" : "Install" }}
            </button>
          </div>
          <div v-if="hit.description" class="plugins-marketplace__desc">
            {{ hit.description }}
          </div>
          <div class="plugins-marketplace__meta">
            <span>{{ hit.registry }}</span>
            <span v-if="hit.author">· {{ hit.author }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="plugins-marketplace__hint">
        {{ searchTriggered ? "No plugins matched." : "Enter a query to search." }}
      </div>
    </section>

    <aside class="plugins-marketplace__rail">
      <header class="plugins-marketplace__rail-head">
        <h3 class="plugins-marketplace__title">Installed</h3>
        <button
          type="button"
          class="plugins-marketplace__btn plugins-marketplace__btn--ghost"
          :disabled="installedState.loading.value"
          @click="installedState.load()"
        >
          {{ installedState.loading.value ? "Reloading…" : "Reload" }}
        </button>
      </header>
      <div v-if="installedState.loading.value" class="plugins-marketplace__hint">
        Loading installed plugins…
      </div>
      <div
        v-else-if="installedState.notImplemented.value"
        class="plugins-marketplace__hint"
      >
        Installed plugins endpoint not available yet (endpoint not available).
      </div>
      <div v-else-if="installedState.error.value" class="plugins-marketplace__error">
        {{ installedState.error.value }}
      </div>
      <ul
        v-else-if="installedState.installedPlugins.value.length"
        class="plugins-marketplace__list"
      >
        <li
          v-for="plugin in installedState.installedPlugins.value"
          :key="plugin.id"
          class="plugins-marketplace__installed"
        >
          <div class="plugins-marketplace__hit-head">
            <div>
              <strong>{{ plugin.name }}</strong>
              <span class="plugins-marketplace__version">{{ plugin.version }}</span>
            </div>
            <button
              type="button"
              class="plugins-marketplace__btn plugins-marketplace__btn--danger"
              :disabled="!!installedState.uninstalling.value[plugin.id]"
              @click="installedState.uninstall(plugin.id)"
            >
              {{
                installedState.uninstalling.value[plugin.id] ? "Removing…" : "Uninstall"
              }}
            </button>
          </div>
          <div v-if="plugin.description" class="plugins-marketplace__desc">
            {{ plugin.description }}
          </div>
          <div class="plugins-marketplace__meta">
            <span v-if="plugin.registry">{{ plugin.registry }}</span>
            <span v-if="plugin.author">· {{ plugin.author }}</span>
          </div>
        </li>
      </ul>
      <div v-else class="plugins-marketplace__hint">No plugins installed.</div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useInstalledPlugins } from "@/features/plugins/useInstalledPlugins";
import { useRegistries } from "@/features/plugins/useRegistries";
import { usePluginSearch } from "@/features/plugins/usePluginSearch";
import type { SearchHit } from "@/features/plugins/plugin-types";

const installedState = useInstalledPlugins();
const registriesState = useRegistries();
const searchState = usePluginSearch();

const newRegistryName = ref("");
const newRegistryUrl = ref("");
const searchTriggered = ref(false);

async function onAddRegistry(): Promise<void> {
  const entry = await registriesState.add(newRegistryUrl.value, newRegistryName.value);
  if (entry) {
    newRegistryName.value = "";
    newRegistryUrl.value = "";
  }
}

async function onSearch(): Promise<void> {
  searchTriggered.value = true;
  await searchState.search();
}

async function onInstall(hit: SearchHit): Promise<void> {
  const installed = await searchState.install(hit);
  if (installed) {
    await installedState.load();
  }
}

function formatTimestamp(raw: string): string {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleString();
}

onMounted(() => {
  installedState.load();
  registriesState.load();
});
</script>

<style scoped>
.plugins-marketplace {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 16px;
  padding: 16px;
  height: 100%;
  box-sizing: border-box;
}
.plugins-marketplace__rail,
.plugins-marketplace__center {
  border: 1px solid var(--border, #e2e2e6);
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--surface, #fff);
  overflow: auto;
}
.plugins-marketplace__rail-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}
.plugins-marketplace__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.plugins-marketplace__add,
.plugins-marketplace__search {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.plugins-marketplace__input {
  flex: 1 1 120px;
  padding: 6px 8px;
  border: 1px solid var(--border, #ccc);
  border-radius: 6px;
  font-size: 13px;
  min-width: 0;
}
.plugins-marketplace__input--grow {
  flex: 1 1 200px;
}
.plugins-marketplace__btn {
  background: var(--accent, #2f6fb3);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12px;
  cursor: pointer;
}
.plugins-marketplace__btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.plugins-marketplace__btn--ghost {
  background: transparent;
  color: var(--text, #333);
  border: 1px solid var(--border, #ccc);
}
.plugins-marketplace__btn--danger {
  background: #c0392b;
}
.plugins-marketplace__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.plugins-marketplace__registry,
.plugins-marketplace__hit,
.plugins-marketplace__installed {
  background: var(--surface2, #fafafb);
  border-radius: 6px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  border-left: 3px solid var(--accent, #2f6fb3);
}
.plugins-marketplace__registry-head,
.plugins-marketplace__hit-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}
.plugins-marketplace__registry-url,
.plugins-marketplace__desc,
.plugins-marketplace__meta {
  font-size: 12px;
  color: var(--text2, #666);
}
.plugins-marketplace__version {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-size: 11px;
  color: var(--text2, #666);
  margin-left: 6px;
}
.plugins-marketplace__hint {
  color: var(--text2, #888);
  font-size: 13px;
}
.plugins-marketplace__error {
  color: #c0392b;
  font-size: 13px;
  white-space: pre-wrap;
}
</style>
