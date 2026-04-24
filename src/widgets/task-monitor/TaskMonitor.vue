<template>
  <div
    class="office-scene"
    :class="{
      'state-done': scene.isDone,
      'state-error': scene.isError,
    }"
  >
    <!-- Desk labels row -->
    <div class="office-labels" role="list" :aria-label="t('taskMonitor.desksAria')">
      <div
        v-for="desk in desks"
        :key="desk.slot"
        class="office-desk-lbl"
        :class="{ 'office-desk-lbl--active': scene.activeSlot === desk.slot }"
        :title="desk.hint"
        :data-slot="desk.slot"
        role="listitem"
      >
        {{ desk.short }}
      </div>
    </div>

    <!-- Walker / avatar -->
    <div
      class="office-walker-wrap"
      :class="{
        'at-desk': scene.slot > 0 && !scene.isDone && !scene.isError,
      }"
      :style="{
        left: `${scene.xPct}%`,
        top: `${scene.yPct}%`,
        transform: 'translate(-50%, -100%)',
      }"
    >
      <div
        class="office-walker-bob-target"
        :class="{ 'office-walker-wrap--bob': scene.isBobbing }"
      >
        <span
          class="office-walker-sprite"
          :class="{ 'face-left': scene.facingLeft }"
          aria-hidden="true"
          >{{ scene.emoji }}</span
        >
      </div>
    </div>

    <!-- Caption below the scene -->
    <div class="office-caption">
      <template v-if="!taskStore.taskId">
        <strong>{{ t("taskMonitor.idleTitle") }}</strong> —
        {{ t("taskMonitor.idleHint") }}
      </template>
      <template v-else>
        <strong>{{ scene.label }}</strong>
        <template v-if="scene.deskHint"> · {{ scene.deskHint }}</template>
        <br v-if="scene.statusLine" />
        <span v-if="scene.statusLine" class="office-caption__status">
          {{ scene.statusLine }}
        </span>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useTaskMonitor } from "./useTaskMonitor";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const { taskStore, sceneState: scene, desks } = useTaskMonitor();
</script>

<style scoped>
.office-scene {
  position: relative;
  min-height: 120px;
}

.office-labels {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
}

.office-desk-lbl {
  flex: 1;
  text-align: center;
  font-size: 10px;
  padding: 2px 0;
  border-radius: 3px;
  cursor: default;
  opacity: 0.5;
  transition: opacity 0.2s;
}

.office-desk-lbl--active {
  opacity: 1;
  font-weight: 700;
  background: var(--accent-subtle, rgba(99, 179, 237, 0.15));
}

.office-walker-wrap {
  position: absolute;
  transition:
    left 0.6s ease,
    top 0.3s ease;
}

.office-walker-bob-target {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.office-walker-wrap--bob {
  animation: walker-bob 0.8s ease-in-out infinite alternate;
}

@keyframes walker-bob {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-4px);
  }
}

.office-walker-sprite {
  font-size: 22px;
  display: inline-block;
  transition: transform 0.3s;
}

.office-walker-sprite.face-left {
  transform: scaleX(-1);
}

.state-done .office-walker-sprite {
  filter: drop-shadow(0 0 6px gold);
}

.state-error .office-walker-sprite {
  filter: drop-shadow(0 0 6px red);
}

.office-caption {
  margin-top: 52px;
  font-size: 12px;
  line-height: 1.4;
  min-height: 2.8em;
}

.office-caption__status {
  font-size: 10px;
  color: var(--text3, #888);
}
</style>
