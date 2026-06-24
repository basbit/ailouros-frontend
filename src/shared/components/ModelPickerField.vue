<template>
  <div class="model-picker">
    <label v-if="label" class="field-label">{{ label }}</label>
    <div class="model-picker__row">
      <slot name="leading" />
      <select
        class="model-picker__env"
        :value="environment"
        @change="emit('update:environment', ($event.target as HTMLSelectElement).value)"
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
        <span v-if="modelFetchError" class="model-fetch-error" :title="modelFetchError">
          ⚠ {{ modelFetchError }}
        </span>
        <select
          v-else
          :value="modelSel"
          @change="emit('update:modelSel', ($event.target as HTMLSelectElement).value)"
        >
          <option v-for="[val, lbl] in modelChoices" :key="val" :value="val">
            {{ lbl }}
          </option>
        </select>
      </div>
    </div>
    <slot name="hint" />
    <input
      v-if="modelSel === '__custom__'"
      class="cfg-custom"
      type="text"
      :placeholder="customPlaceholder"
      :value="modelCustom"
      @input="emit('update:modelCustom', ($event.target as HTMLInputElement).value)"
    />
    <div v-if="envCode" class="hint">
      Env: <code>{{ envCode }}</code>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { isDesktop } from "@/shared/lib/desktop-bridge";

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
  },
);

const emit = defineEmits<{
  "update:environment": [value: string];
  "update:remoteProfile": [value: string];
  "update:modelSel": [value: string];
  "update:modelCustom": [value: string];
}>();

const isDesktopShell = isDesktop();

const showProfile = computed(
  () => props.showProfileSelect ?? Boolean(props.profileOptions?.length),
);
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
</style>
