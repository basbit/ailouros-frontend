<template>
  <div class="visual-diff-viewer">
    <!-- Header Controls & Status -->
    <div class="visual-diff-viewer__header">
      <div class="visual-diff-viewer__meta">
        <span class="visual-diff-viewer__title">{{ title || "Visual Regression Inspection" }}</span>
        <span
          class="visual-diff-viewer__badge"
          :class="`visual-diff-viewer__badge--${statusColor}`"
        >
          {{ statusLabel }}
        </span>
        <span v-if="mismatchPercentage !== undefined" class="visual-diff-viewer__mismatch">
          Diff: <strong>{{ mismatchPercentage.toFixed(2) }}%</strong>
          <span v-if="diffPixels !== undefined" class="visual-diff-viewer__pixels">
            ({{ diffPixels }} px)
          </span>
        </span>
      </div>

      <div class="visual-diff-viewer__controls">
        <div class="view-mode-tabs">
          <button
            type="button"
            class="view-mode-tab"
            :class="{ 'view-mode-tab--active': mode === 'diff' }"
            @click="mode = 'diff'"
          >
            Diff Highlight
          </button>
          <button
            type="button"
            class="view-mode-tab"
            :class="{ 'view-mode-tab--active': mode === 'side-by-side' }"
            @click="mode = 'side-by-side'"
          >
            Side by Side
          </button>
          <button
            type="button"
            class="view-mode-tab"
            :class="{ 'view-mode-tab--active': mode === 'split' }"
            @click="mode = 'split'"
          >
            Slider Split
          </button>
        </div>

        <button
          v-if="canApprove"
          type="button"
          class="visual-diff-viewer__btn visual-diff-viewer__btn--approve"
          :disabled="isApproving"
          @click="onApprove"
        >
          {{ isApproving ? "Approving..." : "Approve as Baseline" }}
        </button>
      </div>
    </div>

    <!-- Viewer Body -->
    <div class="visual-diff-viewer__body">
      <!-- 1. Diff Mask View -->
      <div v-if="mode === 'diff'" class="diff-view">
        <div class="image-card">
          <div class="image-card__label">Visual Differences Highlight</div>
          <div class="image-card__wrap">
            <img
              v-if="diffUrl"
              :src="diffUrl"
              alt="Visual Diff Mask"
              class="visual-image"
            />
            <div v-else class="image-card__empty">
              No visual difference detected (100% match)
            </div>
          </div>
        </div>
      </div>

      <!-- 2. Side-by-Side View -->
      <div v-else-if="mode === 'side-by-side'" class="side-by-side-view">
        <div class="image-card">
          <div class="image-card__label">Baseline (Expected)</div>
          <div class="image-card__wrap">
            <img
              v-if="baselineUrl"
              :src="baselineUrl"
              alt="Baseline"
              class="visual-image"
            />
            <div v-else class="image-card__empty">No baseline set yet</div>
          </div>
        </div>

        <div class="image-card">
          <div class="image-card__label">Current (Actual)</div>
          <div class="image-card__wrap">
            <img
              v-if="currentUrl"
              :src="currentUrl"
              alt="Current Screenshot"
              class="visual-image"
            />
            <div v-else class="image-card__empty">No current screenshot</div>
          </div>
        </div>
      </div>

      <!-- 3. Interactive Split Slider View -->
      <div v-else-if="mode === 'split'" class="split-view">
        <div class="split-container" @mousemove="onSplitMove" @touchmove="onSplitTouch">
          <img
            v-if="baselineUrl"
            :src="baselineUrl"
            alt="Baseline"
            class="split-image split-image--base"
          />
          <div
            class="split-overlay"
            :style="{ clipPath: `polygon(${splitPosition}% 0, 100% 0, 100% 100%, ${splitPosition}% 100%)` }"
          >
            <img
              v-if="currentUrl"
              :src="currentUrl"
              alt="Current"
              class="split-image split-image--overlay"
            />
          </div>
          <div class="split-divider" :style="{ left: `${splitPosition}%` }">
            <div class="split-handle">&#8646;</div>
          </div>
        </div>
        <div class="split-labels">
          <span>&larr; Baseline</span>
          <span>Current &rarr;</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    title?: string;
    baselineUrl?: string | null;
    currentUrl?: string | null;
    diffUrl?: string | null;
    mismatchPercentage?: number;
    diffPixels?: number;
    threshold?: number;
    canApprove?: boolean;
    isApproving?: boolean;
  }>(),
  {
    title: "",
    baselineUrl: null,
    currentUrl: null,
    diffUrl: null,
    mismatchPercentage: 0,
    diffPixels: 0,
    threshold: 0.1,
    canApprove: true,
    isApproving: false,
  },
);

const emit = defineEmits<{
  approve: [];
}>();

type ViewMode = "diff" | "side-by-side" | "split";
const mode = ref<ViewMode>("diff");
const splitPosition = ref(50);

const isPass = computed(() => {
  if (props.mismatchPercentage === undefined) return true;
  return props.mismatchPercentage <= props.threshold;
});

const isNewBaseline = computed(() => !props.baselineUrl && !!props.currentUrl);

const statusColor = computed(() => {
  if (isNewBaseline.value) return "info";
  return isPass.value ? "success" : "danger";
});

const statusLabel = computed(() => {
  if (isNewBaseline.value) return "New Baseline";
  return isPass.value ? "Passed" : "Visual Regression";
});

function onApprove(): void {
  emit("approve");
}

function onSplitMove(event: MouseEvent): void {
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = Math.max(0, Math.min(event.clientX - rect.left, rect.width));
  splitPosition.value = (x / rect.width) * 100;
}

function onSplitTouch(event: TouchEvent): void {
  if (!event.touches[0]) return;
  const target = event.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const x = Math.max(0, Math.min(event.touches[0].clientX - rect.left, rect.width));
  splitPosition.value = (x / rect.width) * 100;
}
</script>

<style scoped>
.visual-diff-viewer {
  display: flex;
  flex-direction: column;
  background: var(--bg2, #1a1d27);
  border: 1px solid var(--border, #2e3346);
  border-radius: 8px;
  overflow: hidden;
  margin: 12px 0;
}

.visual-diff-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  padding: 10px 16px;
  background: var(--bg3, #222634);
  border-bottom: 1px solid var(--border, #2e3346);
}

.visual-diff-viewer__meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.visual-diff-viewer__title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text1, #e6ecf8);
}

.visual-diff-viewer__badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
}

.visual-diff-viewer__badge--success {
  background: rgba(46, 213, 115, 0.2);
  color: #2ed573;
}

.visual-diff-viewer__badge--danger {
  background: rgba(255, 71, 87, 0.2);
  color: #ff4757;
}

.visual-diff-viewer__badge--info {
  background: rgba(55, 120, 245, 0.2);
  color: #70a1ff;
}

.visual-diff-viewer__mismatch {
  font-size: 12px;
  color: var(--text2, #a4b0be);
}

.visual-diff-viewer__pixels {
  opacity: 0.8;
  margin-left: 4px;
}

.visual-diff-viewer__controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.view-mode-tabs {
  display: flex;
  background: var(--bg1, #13151f);
  border-radius: 6px;
  padding: 2px;
  gap: 2px;
}

.view-mode-tab {
  border: none;
  background: transparent;
  color: var(--text2, #a4b0be);
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.view-mode-tab--active {
  background: var(--accent, #3867d6);
  color: #fff;
  font-weight: 500;
}

.visual-diff-viewer__btn--approve {
  border: none;
  background: #2ed573;
  color: #0c2010;
  font-weight: 600;
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.visual-diff-viewer__btn--approve:hover:not(:disabled) {
  opacity: 0.9;
}

.visual-diff-viewer__btn--approve:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.visual-diff-viewer__body {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.diff-view,
.side-by-side-view {
  display: flex;
  gap: 16px;
  width: 100%;
}

.image-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: var(--bg1, #13151f);
  border: 1px solid var(--border, #2e3346);
  border-radius: 6px;
  overflow: hidden;
}

.image-card__label {
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text2, #a4b0be);
  background: var(--bg3, #222634);
  border-bottom: 1px solid var(--border, #2e3346);
}

.image-card__wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  min-height: 200px;
}

.visual-image {
  max-width: 100%;
  max-height: 480px;
  object-fit: contain;
  border-radius: 4px;
}

.image-card__empty {
  color: var(--text3, #57606f);
  font-size: 13px;
  font-style: italic;
}

/* Split view */
.split-view {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.split-container {
  position: relative;
  max-width: 100%;
  height: 480px;
  overflow: hidden;
  border-radius: 6px;
  cursor: ew-resize;
  user-select: none;
}

.split-image {
  max-height: 480px;
  max-width: 100%;
  display: block;
}

.split-overlay {
  position: absolute;
  inset: 0;
}

.split-divider {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #fff;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.6);
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.split-handle {
  width: 28px;
  height: 28px;
  background: #fff;
  color: #111;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: bold;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
}

.split-labels {
  display: flex;
  justify-content: space-between;
  width: 100%;
  margin-top: 8px;
  font-size: 12px;
  color: var(--text2, #a4b0be);
}
</style>
