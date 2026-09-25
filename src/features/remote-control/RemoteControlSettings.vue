<template>
  <div class="remote-control">
    <SettingsSyncError />
    <TelegramBotSection />
    <TelegramRunSection />
    <SignedLinksSection />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useGlobalSearchKeys } from "@/shared/lib/global-search-keys";
import SettingsSyncError from "@/shared/components/settings-fields/SettingsSyncError.vue";
import TelegramBotSection from "./TelegramBotSection.vue";
import TelegramRunSection from "./TelegramRunSection.vue";
import SignedLinksSection from "./SignedLinksSection.vue";

const { loadFromBackend } = useGlobalSearchKeys();

onMounted(() => {
  void loadFromBackend();
});
</script>

<style>
.remote-control {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.remote-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid var(--line, #2a2f3e);
  border-radius: 8px;
  padding: 10px 14px 14px;
  margin: 0;
}
.remote-section legend {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text2, #a8b0c4);
  padding: 0 6px;
}
.remote-section__row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 8px;
}
.remote-section__error {
  margin: 0;
  color: var(--danger, #e5484d);
  font-size: 13px;
}
</style>
