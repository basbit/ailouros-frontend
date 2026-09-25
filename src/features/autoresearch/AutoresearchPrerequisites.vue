<template>
  <div v-if="missing.length" class="ar-prerequisites" data-testid="ar-prerequisites">
    <SettingPrerequisite
      v-for="key in missing"
      :key="key"
      pane="agentic"
      :field="PREREQUISITE_FIELD[key]"
      :message="t(`autoresearch.prerequisite.${key}`)"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";
import SettingPrerequisite from "@/shared/components/settings-fields/SettingPrerequisite.vue";
import { PREREQUISITE_FIELD, type AutoresearchPrerequisite } from "./model/prerequisites";

defineProps<{ missing: readonly AutoresearchPrerequisite[] }>();

const { t } = useI18n();
</script>
