<template>
  <label :for="forId" class="feature-flag-string-label">
    {{ labelText }}
    <span v-if="!wired" class="feature-flag-badge-not-wired" :title="notWiredHint">
      {{ notWiredLabel }}
    </span>
    <span
      v-if="overridden"
      class="feature-flag-badge-workspace-override"
      :title="overrideHint"
    >
      {{ overrideLabel }}
    </span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  forId: string;
  labelText: string;
  wired: boolean;
  overridden: boolean;
  notWiredHint: string;
  notWiredLabel: string;
  overrideHint: string;
  overrideLabel: string;
}>();
</script>
