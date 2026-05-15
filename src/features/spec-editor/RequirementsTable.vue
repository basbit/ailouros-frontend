<template>
  <section class="req-table">
    <header class="req-table__head">
      <h3 class="req-table__title">Requirements</h3>
      <span class="req-table__count">{{ requirements.length }}</span>
    </header>
    <div v-if="!requirements.length" class="req-table__empty">No requirements yet.</div>
    <table v-else class="req-table__grid">
      <thead>
        <tr>
          <th scope="col">ID</th>
          <th scope="col">Text</th>
          <th scope="col">Priority</th>
          <th scope="col">EARS</th>
          <th scope="col">Acceptance</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="req in requirements" :key="req.id" class="req-table__row">
          <td class="req-table__id">{{ req.id }}</td>
          <td class="req-table__text">{{ req.text }}</td>
          <td>
            <span :class="['req-table__pill', `req-table__pill--${req.priority}`]">
              {{ req.priority }}
            </span>
          </td>
          <td class="req-table__ears">{{ req.ears ?? "—" }}</td>
          <td>
            <ul v-if="req.acceptance.length" class="req-table__acc">
              <li v-for="(line, idx) in req.acceptance" :key="idx">{{ line }}</li>
            </ul>
            <span v-else class="req-table__dim">—</span>
          </td>
        </tr>
      </tbody>
    </table>
  </section>
</template>

<script setup lang="ts">
import type { Requirement } from "./spec-types";

defineProps<{
  requirements: Requirement[];
}>();
</script>

<style scoped>
.req-table {
  border: 1px solid #e2e2e6;
  border-radius: 8px;
  padding: 12px;
}
.req-table__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 8px;
}
.req-table__title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}
.req-table__count {
  font-size: 12px;
  color: #888;
}
.req-table__grid {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}
.req-table__grid th,
.req-table__grid td {
  text-align: left;
  padding: 6px 8px;
  border-bottom: 1px solid #f0f0f3;
  vertical-align: top;
}
.req-table__id {
  font-family: ui-monospace, SFMono-Regular, monospace;
  white-space: nowrap;
}
.req-table__text {
  min-width: 220px;
}
.req-table__pill {
  display: inline-block;
  padding: 1px 8px;
  border-radius: 999px;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  background: #f0f0f3;
}
.req-table__pill--must {
  background: #fde0dc;
  color: #8b1a10;
}
.req-table__pill--should {
  background: #fff3cd;
  color: #856404;
}
.req-table__pill--could {
  background: #d8ebd9;
  color: #1f6f2b;
}
.req-table__ears {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: #555;
  font-size: 12px;
}
.req-table__acc {
  margin: 0;
  padding-left: 18px;
}
.req-table__empty,
.req-table__dim {
  color: #888;
  font-size: 13px;
}
</style>
