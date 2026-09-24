<template>
  <div class="app-shell">
    <slot name="header" />
    <div class="app-shell__body">
      <slot name="subnav" />
      <main class="app-shell__main">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100vh;
  min-height: 0;
  padding-top: var(--hdr-h);
  background: var(--bg);
  color: var(--ink);
}

.app-shell__body {
  flex: 1 1 auto;
  display: flex;
  min-height: 0;
  overflow: hidden;
}

.app-shell__main {
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  overflow: auto;
  padding: 20px 28px 28px;
}

/* Below this width a 220px pane rail leaves too little for the content column:
   at 375px every sentence wrapped to one word per line. Stack instead. */
@media (max-width: 760px) {
  .app-shell__body {
    flex-direction: column;
    overflow: auto;
  }

  .app-shell__main {
    padding: 16px;
    overflow: visible;
  }
}
</style>
