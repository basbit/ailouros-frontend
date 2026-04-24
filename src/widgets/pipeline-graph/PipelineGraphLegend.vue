<template>
  <div class="pg-legend">
    <span class="pg-legend-title">Legend:</span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--agent" />Agent
    </span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--reviewer" />Reviewer
    </span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--verification" />Verification
    </span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--human_gate" />Human Gate
    </span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--tool_preflight" />Preflight
    </span>
    <span class="pg-legend-item">
      <span class="pg-legend-pip pg-legend-pip--join_branch" />Join
    </span>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.pg-legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 6px 0 2px;
  border-top: 1px solid var(--border, #333);
  margin-top: 8px;
}
.pg-legend-title {
  font-size: 9px;
  color: var(--text3, #666);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  user-select: none;
}
.pg-legend-item {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 9px;
  color: var(--text3, #666);
  user-select: none;
}
.pg-legend-pip {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.pg-legend-pip--agent {
  background: #4dabf7;
}
.pg-legend-pip--reviewer {
  background: #f59f00;
  border-radius: 2px;
}
.pg-legend-pip--verification {
  background: #40c057;
  border-radius: 1px;
}
.pg-legend-pip--human_gate {
  background: #cc5de8;
  clip-path: polygon(50% 0%, 100% 100%, 0% 100%);
  border-radius: 0;
}
.pg-legend-pip--tool_preflight {
  background: #74c0fc;
  border-radius: 0;
}
.pg-legend-pip--join_branch {
  background: #a9e34b;
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  border-radius: 0;
}
</style>
