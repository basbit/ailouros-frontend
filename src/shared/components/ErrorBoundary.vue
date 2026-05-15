<script setup lang="ts">
/**
 * Vue 3 error boundary (plan §20.5.4).
 *
 * Vue does not provide a built-in error boundary; an uncaught error in
 * a deeply nested component takes down the parent route. Wrapping
 * critical regions of `SwarmUiPage` / `AgentEditorPage` etc. in
 * `<ErrorBoundary>` lets the page render a fallback panel while keeping
 * the rest of the UI interactive.
 *
 *   <ErrorBoundary @captured="onError">
 *     <SwarmUiPanel />
 *     <template #fallback="{ error, retry }">
 *       <ErrorPanel :error="error" @retry="retry" />
 *     </template>
 *   </ErrorBoundary>
 */
import { onErrorCaptured, ref } from "vue";

const emit = defineEmits<{
  (e: "captured", error: unknown, info: string): void;
}>();

const capturedError = ref<unknown>(null);
const capturedInfo = ref<string>("");

onErrorCaptured((error, _instance, info) => {
  capturedError.value = error;
  capturedInfo.value = info;
  emit("captured", error, info);
  // Returning false prevents the error from propagating further up
  // the Vue component tree.
  return false;
});

function retry(): void {
  capturedError.value = null;
  capturedInfo.value = "";
}

defineExpose({ retry });
</script>

<template>
  <slot
    v-if="capturedError"
    name="fallback"
    :error="capturedError"
    :info="capturedInfo"
    :retry="retry"
  >
    <div role="alert" aria-live="polite" class="error-boundary-fallback">
      <p>
        {{
          capturedError instanceof Error ? capturedError.message : String(capturedError)
        }}
      </p>
      <button type="button" @click="retry">Retry</button>
    </div>
  </slot>
  <slot v-else />
</template>

<style scoped>
.error-boundary-fallback {
  padding: 1rem;
  border: 1px solid var(--color-danger, #e11d48);
  border-radius: 0.5rem;
  background: var(--color-danger-subtle, rgba(225, 29, 72, 0.08));
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-start;
}
.error-boundary-fallback button {
  cursor: pointer;
}
</style>
