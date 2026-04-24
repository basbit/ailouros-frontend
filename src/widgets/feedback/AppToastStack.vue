<template>
  <div class="toast-stack" aria-live="polite" aria-atomic="true">
    <div
      v-for="toast in ux.toasts"
      :key="toast.id"
      class="toast-card"
      :class="`toast-card--${toast.tone}`"
    >
      <span class="toast-card__message">{{ toast.message }}</span>
      <button
        type="button"
        class="toast-card__close"
        aria-label="Dismiss notification"
        @click="ux.dismissToast(toast.id)"
      >
        ×
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUxStore } from "@/shared/store/ux";

const ux = useUxStore();
</script>
