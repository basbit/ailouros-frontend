<template>
  <section class="about-pane">
    <PaneHeader
      :title="t('settings.about.title')"
      :subtitle="t('settings.about.subtitle')"
    />
    <div class="about-pane__row">
      <span class="about-pane__label">{{ t("settings.about.version") }}</span>
      <span class="about-pane__value">{{ version }}</span>
    </div>
    <div v-if="repoUrl" class="about-pane__row">
      <span class="about-pane__label">{{ t("settings.about.repo") }}</span>
      <a
        class="about-pane__link"
        :href="repoUrl"
        target="_blank"
        rel="noopener noreferrer"
      >
        {{ repoUrl.replace(/^https?:\/\//, "") }}
      </a>
    </div>
  </section>
</template>

<script setup lang="ts">
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();

const env = import.meta.env as Record<string, string | undefined>;
const version = env.VITE_APP_VERSION ?? "dev";
const repoUrl = (env.VITE_APP_REPO_URL ?? "").trim();
</script>

<style scoped>
.about-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 640px;
}

.about-pane__row {
  display: grid;
  grid-template-columns: 200px 1fr;
  align-items: center;
  gap: 16px;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  background: var(--card);
}

.about-pane__label {
  font-size: 12px;
  font-weight: 500;
  color: var(--ink-3);
}

.about-pane__value {
  font-size: 13px;
  font-family: var(--font-mono);
  color: var(--ink);
}

.about-pane__link {
  font-size: 13px;
  color: var(--accent-2);
  text-decoration: none;
}

.about-pane__link:hover {
  text-decoration: underline;
}
</style>
