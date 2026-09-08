<template>
  <section class="feature-flags-pane">
    <PaneHeader
      :title="t('settings.featureFlags.title')"
      :subtitle="t('settings.featureFlags.subtitle')"
    />
    <input
      v-model="filterQuery"
      type="search"
      class="feature-flags-pane__filter"
      :placeholder="t('featureFlags.filter.placeholder')"
      :aria-label="t('featureFlags.filter.placeholder')"
    />
    <div class="feature-flags-pane__card">
      <GlobalFeatureFlagsSettings
        :workspace-root="settings.form.workspace_root"
        :filter-query="filterQuery"
      >
        <template #retrieval-status>
          <RetrievalSettingsCard />
        </template>
        <template #evaluation-status>
          <EvaluationStatusCard />
          <RedTeamCorpusCard />
        </template>
      </GlobalFeatureFlagsSettings>
    </div>

    <details class="feature-flags-pane__advanced">
      <summary>{{ t("envCatalog.summary") }}</summary>
      <div class="feature-flags-pane__card">
        <EnvCatalogPanel />
      </div>
    </details>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import GlobalFeatureFlagsSettings from "@/features/global-settings/GlobalFeatureFlagsSettings.vue";
import RetrievalSettingsCard from "@/widgets/retrieval-settings-card/RetrievalSettingsCard.vue";
import EvaluationStatusCard from "@/widgets/evaluation-status/EvaluationStatusCard.vue";
import RedTeamCorpusCard from "@/widgets/red-team-corpus/RedTeamCorpusCard.vue";
import { EnvCatalogPanel } from "@/features/env-catalog";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();
const filterQuery = ref("");
</script>

<style scoped>
.feature-flags-pane__advanced {
  margin-top: 14px;
}

.feature-flags-pane__advanced summary {
  cursor: pointer;
  font-weight: 600;
  padding: 6px 0;
}

.feature-flags-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}

.feature-flags-pane__card {
  padding: 16px 18px;
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  background: var(--card);
}

.feature-flags-pane__filter {
  padding: 8px 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
  color: var(--ink);
  font-size: 13px;
}

.feature-flags-pane__filter:focus {
  outline: none;
  border-color: var(--accent);
}
</style>
