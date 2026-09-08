<template>
  <div class="model-picker">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="model-picker__row">
      <slot name="leading" />
      <label v-if="showModelModeToggle" class="model-picker__auto-toggle">
        <input
          type="checkbox"
          :checked="modelMode === 'auto'"
          :title="autoModeTitle"
          @change="
            emit(
              'update:modelMode',
              ($event.target as HTMLInputElement).checked ? 'auto' : 'manual',
            )
          "
        />
        {{ autoModeLabel }}
      </label>
      <template v-if="!isAutoMode">
        <select
          class="model-picker__env"
          :value="environment"
          @change="
            emit('update:environment', ($event.target as HTMLSelectElement).value)
          "
        >
          <option v-if="isDesktopShell" value="local">local</option>
          <option value="ollama">ollama</option>
          <option value="lmstudio">lmstudio</option>
          <option value="cloud">cloud</option>
        </select>
        <div class="role-cloud-model-stack">
          <select
            v-if="showProfile"
            class="cfg-remote-profile"
            :value="remoteProfile"
            :title="cloudProfileTitle"
            @change="
              emit('update:remoteProfile', ($event.target as HTMLSelectElement).value)
            "
          >
            <option value="">{{ profilePlaceholder }}</option>
            <option v-for="opt in profileOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
          <span
            v-if="modelFetchError"
            class="model-fetch-error"
            :title="modelFetchError"
          >
            ⚠ {{ modelFetchError }}
          </span>
          <select
            v-else
            :value="modelSel"
            @change="
              emit('update:modelSel', ($event.target as HTMLSelectElement).value)
            "
          >
            <option v-for="[val, lbl] in modelChoices" :key="val" :value="val">
              {{ lbl }}
            </option>
          </select>
        </div>
      </template>
      <span v-else class="model-picker__auto-indicator">{{ autoIndicatorText }}</span>
    </div>
    <div
      v-if="!isAutoMode && modelNotInProvider"
      class="model-picker__warn"
      role="alert"
    >
      ⚠ {{ modelNotInProvider }}
    </div>
    <slot name="hint" />
    <input
      v-if="!isAutoMode && modelSel === '__custom__'"
      class="cfg-custom"
      type="text"
      :placeholder="customPlaceholder"
      :value="modelCustom"
      @input="emit('update:modelCustom', ($event.target as HTMLInputElement).value)"
    />
    <div v-if="!isAutoMode && envCode" class="hint">
      Env: <code>{{ envCode }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { useI18n } from "@/shared/lib/i18n";

const props = withDefaults(
  defineProps<{
    environment: string;
    modelChoices: [string, string][];
    modelSel: string;
    modelCustom: string;
    modelFetchError?: string | null;
    profileOptions?: { value: string; label: string }[];
    remoteProfile?: string;
    showProfileSelect?: boolean;
    label?: string;
    envCode?: string;
    customPlaceholder?: string;
    profilePlaceholder?: string;
    cloudProfileTitle?: string;
    showModelModeToggle?: boolean;
    modelMode?: "auto" | "manual";
    autoModeLabel?: string;
    autoModeTitle?: string;
    autoIndicatorText?: string;
  }>(),
  {
    modelFetchError: null,
    profileOptions: undefined,
    remoteProfile: "",
    showProfileSelect: undefined,
    label: "",
    envCode: "",
    customPlaceholder: "",
    profilePlaceholder: "",
    cloudProfileTitle: "",
    showModelModeToggle: false,
    modelMode: "manual",
    autoModeLabel: "",
    autoModeTitle: "",
    autoIndicatorText: "",
  },
);

const emit = defineEmits<{
  "update:environment": [value: string];
  "update:remoteProfile": [value: string];
  "update:modelSel": [value: string];
  "update:modelCustom": [value: string];
  "update:modelMode": [value: "auto" | "manual"];
}>();

const isDesktopShell = isDesktop();
const { t } = useI18n();

const showProfile = computed(
  () => props.showProfileSelect ?? Boolean(props.profileOptions?.length),
);
const isAutoMode = computed(
  () => props.showModelModeToggle && props.modelMode === "auto",
);

// The effective model id the user has selected (custom text or a list entry).
const effectiveModelId = computed(() =>
  props.modelSel === "__custom__" ? props.modelCustom.trim() : props.modelSel,
);

// Warn when the selected model is not present in the provider's model list
// (e.g. it was removed from Ollama / the cloud provider). A custom entry is
// always allowed, so it never triggers this warning.
const modelNotInProvider = computed(() => {
  if (isAutoMode.value) return "";
  const model = effectiveModelId.value;
  if (!model) return "";
  if (props.modelSel === "__custom__") return "";
  const known = props.modelChoices.some(([val]) => val === model);
  if (known) return "";
  return t("errors.modelNotInProvider", { model });
});
</script>

<style scoped>
.model-picker__row {
  display: flex;
  gap: 6px;
  align-items: center;
  flex-wrap: nowrap;
}
/* Override the global `select { width: 100% }` so the env picker stays
   content-sized and the model stack takes the remaining width (the old
   agent grid did this via fixed columns). */
.model-picker__row > select.model-picker__env {
  flex: 0 0 auto;
  width: auto;
  min-width: 72px;
}
.model-picker__row > .role-cloud-model-stack {
  flex: 1 1 0;
  min-width: 0;
}
.model-picker__row > :slotted(.role-name) {
  flex: 0 0 auto;
}
.model-picker__auto-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--text2, #a8b0c4);
  white-space: nowrap;
  cursor: pointer;
}
.model-picker__auto-indicator {
  flex: 1 1 0;
  min-width: 0;
  font-size: 11px;
  font-style: italic;
  color: var(--text3, #6b7280);
}
.model-picker__warn {
  margin-top: 4px;
  font-size: 11px;
  color: var(--warn, #d97706);
}
</style>
