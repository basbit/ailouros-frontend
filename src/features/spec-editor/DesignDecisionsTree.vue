<template>
  <section class="adr-tree">
    <header class="adr-tree__head">
      <h3 class="adr-tree__title">Design Decisions</h3>
      <span class="adr-tree__count">{{ decisions.length }}</span>
    </header>
    <div v-if="!decisions.length" class="adr-tree__empty">No design decisions yet.</div>
    <div v-else class="adr-tree__groups">
      <div v-for="group in groups" :key="group.status" class="adr-group">
        <div class="adr-group__head">
          <span :class="['adr-group__badge', `adr-group__badge--${group.status}`]">
            {{ group.status }}
          </span>
          <span class="adr-group__count">{{ group.items.length }}</span>
        </div>
        <ul class="adr-group__list">
          <li v-for="adr in group.items" :key="adr.id" class="adr-item">
            <div class="adr-item__head">
              <code class="adr-item__id">{{ adr.id }}</code>
              <span class="adr-item__title">{{ adr.title }}</span>
            </div>
            <p v-if="adr.context" class="adr-item__line">
              <strong>Context.</strong> {{ adr.context }}
            </p>
            <p v-if="adr.decision" class="adr-item__line">
              <strong>Decision.</strong> {{ adr.decision }}
            </p>
            <p v-if="adr.consequences" class="adr-item__line">
              <strong>Consequences.</strong> {{ adr.consequences }}
            </p>
            <p
              v-if="adr.alternatives && adr.alternatives.length"
              class="adr-item__line"
            >
              <strong>Alternatives.</strong> {{ adr.alternatives.join("; ") }}
            </p>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DesignDecision, DesignDecisionStatus } from "./spec-types";

const props = defineProps<{
  decisions: DesignDecision[];
}>();

const STATUS_ORDER: DesignDecisionStatus[] = ["accepted", "proposed", "superseded"];

interface Group {
  status: DesignDecisionStatus;
  items: DesignDecision[];
}

const groups = computed<Group[]>(() => {
  const buckets: Record<DesignDecisionStatus, DesignDecision[]> = {
    accepted: [],
    proposed: [],
    superseded: [],
  };
  for (const adr of props.decisions) {
    if (adr.status in buckets) {
      buckets[adr.status].push(adr);
    } else {
      buckets.proposed.push(adr);
    }
  }
  return STATUS_ORDER.filter((status) => buckets[status].length > 0).map((status) => ({
    status,
    items: buckets[status],
  }));
});
</script>

<style scoped>
.adr-tree {
  border: 1px solid #e2e2e6;
  border-radius: 8px;
  padding: 12px;
}
.adr-tree__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.adr-tree__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.adr-tree__count,
.adr-group__count {
  font-size: 12px;
  color: #888;
}
.adr-tree__empty {
  color: #888;
  font-size: 13px;
}
.adr-group {
  margin-bottom: 12px;
}
.adr-group__head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}
.adr-group__badge {
  text-transform: uppercase;
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 999px;
  background: #f0f0f3;
  letter-spacing: 0.04em;
}
.adr-group__badge--accepted {
  background: #d8ebd9;
  color: #1f6f2b;
}
.adr-group__badge--proposed {
  background: #fff3cd;
  color: #856404;
}
.adr-group__badge--superseded {
  background: #ececec;
  color: #555;
  text-decoration: line-through;
}
.adr-group__list {
  margin: 0;
  padding: 0;
  list-style: none;
}
.adr-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: #fafafb;
  margin-bottom: 6px;
  font-size: 13px;
}
.adr-item__head {
  display: flex;
  gap: 8px;
  align-items: baseline;
  margin-bottom: 4px;
}
.adr-item__id {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #555;
}
.adr-item__title {
  font-weight: 600;
}
.adr-item__line {
  margin: 2px 0;
  color: #333;
}
</style>
