<template>
  <div class="field secret-field">
    <label class="field-label" :for="inputId">{{ label }}</label>
    <div class="secret-field__row">
      <input
        :id="inputId"
        type="password"
        autocomplete="new-password"
        spellcheck="false"
        :placeholder="isSaved ? t('settingsField.secretSaved') : placeholder"
        :value="isSaved ? '' : state[field]"
        :data-test="`secret-${field}`"
        @input="onInput(($event.target as HTMLInputElement).value)"
      />
      <button
        v-if="generatable"
        type="button"
        :data-test="`generate-${field}`"
        @click="onGenerate"
      >
        {{ t("settingsField.generate") }}
      </button>
      <slot name="actions" />
    </div>
    <div v-if="revealGenerated && generated" class="secret-field__generated" :data-test="`generated-${field}`">
      <span>{{ t("settingsField.generatedHint") }}</span>
      <code>{{ generated }}</code>
      <button type="button" @click="copyGenerated">
        {{ copied ? t("settingsField.copied") : t("settingsField.copy") }}
      </button>
    </div>
    <div class="hint">
      {{ help }}
      <code>{{ envName }}</code>
      <SettingSourceNote :field="field" />
    </div>
  </div>
</template>

<script setup lang="ts">
import SettingSourceNote from "./SettingSourceNote.vue";
import { computed, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import { MASKED_SECRET } from "@/shared/lib/global-search/secret-policy";
import type { StringSettingKey } from "@/shared/lib/global-search/types";
import { generateSecretHex } from "@/shared/lib/secret-generation";
import { frontendLogger } from "@/shared/lib/frontend-logger";

const props = defineProps<{
  field: StringSettingKey;
  label: string;
  help: string;
  envName: string;
  placeholder?: string;
  generatable?: boolean;
  revealGenerated?: boolean;
}>();

const { t } = useI18n();
const { state, setKey } = useGlobalSearchKeys();
const generated = ref("");
const copied = ref(false);

const inputId = computed(() => `settings_${props.field}`);
const isSaved = computed(() => state[props.field] === MASKED_SECRET);

function onInput(value: string): void {
  generated.value = "";
  setKey(props.field, value);
}

function onGenerate(): void {
  const secret = generateSecretHex();
  generated.value = secret;
  copied.value = false;
  setKey(props.field, secret);
}

async function copyGenerated(): Promise<void> {
  try {
    await navigator.clipboard.writeText(generated.value);
    copied.value = true;
  } catch (error) {
    frontendLogger.warn("copying the generated secret failed", error);
  }
}
</script>

<style scoped>
.secret-field__row {
  display: flex;
  gap: 6px;
}
.secret-field__row input {
  flex: 1;
  min-width: 0;
}
.secret-field__generated {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
}
.secret-field__generated code {
  word-break: break-all;
}
</style>
