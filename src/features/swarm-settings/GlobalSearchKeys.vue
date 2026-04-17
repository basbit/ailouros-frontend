<template>
  <div class="global-search-keys section">
    <details>
      <summary class="section-title">{{ t("search.sectionTitle") }}</summary>
      <div class="search-keys-body">
        <div class="hint" style="margin-bottom: 8px">{{ t("search.sectionHint") }}</div>
        <div class="field">
          <label for="gsk_tavily">{{ t("mcp.tavilyLabel") }}</label>
          <input
            id="gsk_tavily"
            type="password"
            :value="tavilyApiKey"
            placeholder="tvly-..."
            autocomplete="off"
            @input="
              emit('update:tavilyApiKey', ($event.target as HTMLInputElement).value)
            "
          />
        </div>
        <div class="field">
          <label for="gsk_exa">{{ t("mcp.exaLabel") }}</label>
          <input
            id="gsk_exa"
            type="password"
            :value="exaApiKey"
            placeholder="exa-..."
            autocomplete="off"
            @input="emit('update:exaApiKey', ($event.target as HTMLInputElement).value)"
          />
        </div>
        <div class="field">
          <label for="gsk_scrapingdog">{{ t("mcp.scrapingdogLabel") }}</label>
          <input
            id="gsk_scrapingdog"
            type="password"
            :value="scrapingdogApiKey"
            placeholder="..."
            autocomplete="off"
            @input="
              emit(
                'update:scrapingdogApiKey',
                ($event.target as HTMLInputElement).value,
              )
            "
          />
        </div>
      </div>
    </details>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  tavilyApiKey: string;
  exaApiKey: string;
  scrapingdogApiKey: string;
}>();
const emit = defineEmits<{
  (event: "update:tavilyApiKey", value: string): void;
  (event: "update:exaApiKey", value: string): void;
  (event: "update:scrapingdogApiKey", value: string): void;
}>();
const { t } = useI18n();
</script>

<style scoped>
.global-search-keys {
  border-top: 1px solid var(--border);
  padding-top: 8px;
}
.global-search-keys summary {
  cursor: pointer;
  user-select: none;
  list-style: none;
  display: flex;
  align-items: center;
  gap: 4px;
}
.global-search-keys summary::-webkit-details-marker {
  display: none;
}
.global-search-keys summary::before {
  content: "▶";
  font-size: 10px;
  transition: transform 0.15s;
}
.global-search-keys details[open] summary::before {
  transform: rotate(90deg);
}
.search-keys-body {
  padding-top: 8px;
}
</style>
