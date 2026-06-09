<template>
  <label v-if="visible" class="feature-flag-override-toggle">
    <input
      type="checkbox"
      :checked="overridden"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    />
    <span>{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{
  visible: boolean;
  overridden: boolean;
  label: string;
}>();

const emit = defineEmits<{ (e: "change", checked: boolean): void }>();
</script>
