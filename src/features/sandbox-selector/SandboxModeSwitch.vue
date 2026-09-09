<template>
  <div class="sandbox-switch" :title="t('sandbox.title')">
    <button
      type="button"
      class="sandbox-switch__badge"
      :class="{
        'sandbox-switch__badge--sandbox': isSandboxMode,
        'sandbox-switch__badge--host': !isSandboxMode,
      }"
      :aria-expanded="isDropdownOpen"
      aria-haspopup="true"
      @click="toggleDropdown"
    >
      <span class="sandbox-switch__icon">{{ isSandboxMode ? "🛡️" : "⚡" }}</span>
      <span class="sandbox-switch__label">
        {{ isSandboxMode ? currentRunnerLabel : t("sandbox.modeHost") }}
      </span>
      <span class="sandbox-switch__arrow">{{ isDropdownOpen ? "▲" : "▼" }}</span>
    </button>

    <div v-if="isDropdownOpen" class="sandbox-switch__dropdown" role="menu">
      <div class="sandbox-switch__header">
        <span class="sandbox-switch__title">{{ t("sandbox.title") }}</span>
        <span class="sandbox-switch__count">
          {{ t("sandbox.profilesCount", { count: profiles.length }) }}
        </span>
      </div>
      <div v-if="status" class="sandbox-switch__status-meta">
        <span>{{ t("sandbox.backend", { backend: status.execution_backend }) }}</span>
        <span>{{ t("sandbox.profile", { profile: activeProfileName }) }}</span>
      </div>

      <div v-if="isLoading" class="sandbox-switch__loading">
        {{ t("sandbox.loading") }}
      </div>

      <div v-else class="sandbox-switch__list">
        <div
          v-for="profile in profiles"
          :key="profile.name"
          class="sandbox-switch__item"
          :class="{
            'sandbox-switch__item--active': profile.name === activeProfileName,
          }"
          role="menuitem"
          tabindex="0"
          @click="selectProfile(profile.name)"
          @keydown.enter="selectProfile(profile.name)"
        >
          <div class="sandbox-switch__item-header">
            <span class="sandbox-switch__item-name">{{ profile.name }}</span>
            <span class="sandbox-switch__item-runner">{{ profile.runner }}</span>
          </div>
          <div class="sandbox-switch__item-limits">
            {{
              t("sandbox.limits", {
                cpu: profile.cpu_limit_seconds,
                ram: profile.memory_limit_mb,
                timeout: profile.timeout_seconds,
              })
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  getSandboxProfiles,
  getSandboxStatus,
} from "@/entities/sandbox/api/sandbox-api";
import type { SandboxProfile, SandboxStatus } from "@/entities/sandbox/model/types";

const emit = defineEmits<{
  (event: "select", profileName: string): void;
}>();

const { t } = useI18n();

const status = ref<SandboxStatus | null>(null);
const profiles = ref<SandboxProfile[]>([]);
const isDropdownOpen = ref(false);
const isLoading = ref(false);
const selectedProfileOverride = ref<string | null>(null);

const activeProfileName = computed(() => {
  if (selectedProfileOverride.value) {
    return selectedProfileOverride.value;
  }
  return status.value?.default_profile ?? "";
});

const isSandboxMode = computed(() => {
  return (
    status.value?.execution_backend === "sandbox" || activeProfileName.value.length > 0
  );
});

const currentRunnerLabel = computed(() => {
  const matched = profiles.value.find(
    (profile) => profile.name === activeProfileName.value,
  );
  const runner = matched ? matched.runner : "sandbox";
  return t("sandbox.modeSandbox", { runner });
});

function toggleDropdown(): void {
  isDropdownOpen.value = !isDropdownOpen.value;
}

function selectProfile(name: string): void {
  selectedProfileOverride.value = name;
  isDropdownOpen.value = false;
  emit("select", name);
}

async function loadData(): Promise<void> {
  isLoading.value = true;
  try {
    const [fetchedStatus, fetchedProfiles] = await Promise.all([
      getSandboxStatus(),
      getSandboxProfiles(),
    ]);
    status.value = fetchedStatus;
    profiles.value = fetchedProfiles;
  } catch {
    status.value = null;
    profiles.value = [];
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  void loadData();
});
</script>

<style scoped>
.sandbox-switch {
  position: relative;
  display: inline-block;
  font-size: 12px;
}

.sandbox-switch__badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid var(--border-color, #e2e8f0);
  background: var(--bg-surface, #ffffff);
  color: var(--text-primary, #0f172a);
  transition: all 0.2s ease;
}

.sandbox-switch__badge:hover {
  background: var(--bg-hover, #f1f5f9);
}

.sandbox-switch__badge--sandbox {
  border-color: #3b82f6;
  color: #1d4ed8;
  background: #eff6ff;
}

.sandbox-switch__badge--host {
  border-color: #f59e0b;
  color: #b45309;
  background: #fffbeb;
}

.sandbox-switch__arrow {
  font-size: 9px;
  opacity: 0.6;
}

.sandbox-switch__dropdown {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  width: 260px;
  background: var(--bg-surface, #ffffff);
  border: 1px solid var(--border-color, #e2e8f0);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  z-index: 100;
}

.sandbox-switch__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 6px;
  margin-bottom: 6px;
  border-bottom: 1px solid var(--border-color, #e2e8f0);
  font-size: 11px;
}

.sandbox-switch__title {
  font-weight: 600;
}

.sandbox-switch__count {
  color: var(--text-muted, #64748b);
}

.sandbox-switch__status-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 10px;
  color: var(--text-muted, #64748b);
  margin-bottom: 6px;
  padding-bottom: 4px;
  border-bottom: 1px dashed var(--border-color, #e2e8f0);
}

.sandbox-switch__loading {
  padding: 8px;
  text-align: center;
  color: var(--text-muted, #64748b);
}

.sandbox-switch__list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sandbox-switch__item {
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
  transition: background 0.15s ease;
}

.sandbox-switch__item:hover {
  background: var(--bg-hover, #f1f5f9);
}

.sandbox-switch__item--active {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.sandbox-switch__item-header {
  display: flex;
  justify-content: space-between;
  font-weight: 500;
}

.sandbox-switch__item-runner {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted, #64748b);
}

.sandbox-switch__item-limits {
  font-size: 10px;
  color: var(--text-muted, #64748b);
  margin-top: 2px;
}
</style>
