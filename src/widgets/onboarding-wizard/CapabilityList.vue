<template>
  <section v-if="data" class="cap-list">
    <header class="cap-list__head">
      <span class="cap-list__title">{{ t("capability.heading") }}</span>
      <span class="cap-list__counter">{{ data.ready }}/{{ data.total }}</span>
    </header>
    <ul class="cap-list__list">
      <li
        v-for="probe in data.probes"
        :key="probe.name"
        class="cap-list__item"
        :class="{ 'is-ready': probe.ready, 'is-missing': !probe.ready }"
      >
        <span class="cap-list__name">{{ probe.name }}</span>
        <span class="cap-list__state">
          {{ probe.ready ? t("capability.ok") : t("capability.missing") }}
        </span>
        <span class="cap-list__detail">{{ probe.detail }}</span>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import {
  getRuntimeCapabilities,
  type RuntimeCapabilitiesResponse,
} from "@/shared/api/endpoints/runtime";

const { t } = useI18n();
const data = ref<RuntimeCapabilitiesResponse | null>(null);

onMounted(async () => {
  try {
    data.value = await getRuntimeCapabilities();
  } catch {
    data.value = null;
  }
});
</script>

<style scoped>
.cap-list {
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 10px;
  padding: 10px 12px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 60%, transparent);
}
.cap-list__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}
.cap-list__title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
}
.cap-list__counter {
  font-size: 11px;
  font-weight: 600;
}
.cap-list__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.cap-list__item {
  display: grid;
  grid-template-columns: 160px 60px 1fr;
  gap: 6px;
  align-items: center;
  padding: 4px 6px;
  border-radius: 6px;
  background: color-mix(in srgb, var(--surface, #1a1d29) 40%, transparent);
  font-size: 11px;
}
.cap-list__item.is-ready {
  border-left: 3px solid var(--success, #2dab66);
}
.cap-list__item.is-missing {
  border-left: 3px solid var(--text3, #6b7280);
}
.cap-list__name {
  font-family: var(--mono, ui-monospace, monospace);
  color: var(--text, #f5f0e7);
}
.cap-list__state {
  font-size: 10px;
  text-transform: uppercase;
  text-align: center;
}
.cap-list__item.is-ready .cap-list__state {
  color: var(--success, #2dab66);
}
.cap-list__item.is-missing .cap-list__state {
  color: var(--text2, #a8b0c4);
}
.cap-list__detail {
  font-size: 11px;
  color: var(--text2, #a8b0c4);
}
</style>
