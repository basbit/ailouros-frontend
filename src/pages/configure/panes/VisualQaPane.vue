<template>
  <section class="visual-qa-pane">
    <PaneHeader
      :title="t('configure.visualQa.title')"
      :subtitle="t('configure.visualQa.subtitle')"
    />
    <VisualProbeSettings :form="visualForm" @update:form="onVisualFormUpdate" />
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import PaneHeader from "@/widgets/app-shell/PaneHeader.vue";
import VisualProbeSettings from "@/features/project-settings/VisualProbeSettings.vue";
import { useInjectedAppSettings } from "@/app/providers/settingsContext";
import { useI18n } from "@/shared/lib/i18n";

const settings = useInjectedAppSettings();
const { t } = useI18n();

const BOOL_FIELDS = new Set<string>([
  "swarm_visual_probe_enabled",
  "swarm_visual_capture_har",
  "swarm_visual_capture_trace",
  "swarm_visual_multimodal_review",
]);

const visualForm = computed(() => ({
  swarm_visual_probe_enabled: settings.form.swarm_visual_probe_enabled,
  swarm_visual_base_url: settings.form.swarm_visual_base_url,
  swarm_visual_start_command: settings.form.swarm_visual_start_command,
  swarm_visual_start_directory: settings.form.swarm_visual_start_directory,
  swarm_visual_ready_path: settings.form.swarm_visual_ready_path,
  swarm_visual_pages: settings.form.swarm_visual_pages,
  swarm_visual_capture_har: settings.form.swarm_visual_capture_har,
  swarm_visual_capture_trace: settings.form.swarm_visual_capture_trace,
  swarm_visual_multimodal_review: settings.form.swarm_visual_multimodal_review,
  swarm_visual_max_review_images: settings.form.swarm_visual_max_review_images,
}));

function onVisualFormUpdate(field: string, value: string): void {
  const target = settings.form as Record<string, unknown>;
  if (BOOL_FIELDS.has(field)) {
    target[field] = value === "true";
  } else {
    target[field] = value;
  }
  settings.saveSettingsSoon();
}
</script>

<style scoped>
.visual-qa-pane {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 760px;
}
</style>
