<template>
  <details class="section section-global-settings">
    <summary>
      {{ t("globalSettings.summary") }}
      <span
        class="scope-badge scope-badge-global"
        :title="t('globalSettings.allProjectsTitle')"
        >{{ t("globalSettings.allProjects") }}</span
      >
    </summary>
    <div class="section-body">
      <div class="hint hint-remote-global">
        {{ t("globalSettings.hint") }}
      </div>
      <div class="field">
        <label for="global_tavily_api_key">{{ t("mcp.tavilyLabel") }}</label>
        <input
          id="global_tavily_api_key"
          type="password"
          :value="state.tavily_api_key"
          placeholder="tvly-..."
          autocomplete="off"
          @input="setKey('tavily_api_key', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field">
        <label for="global_exa_api_key">{{ t("mcp.exaLabel") }}</label>
        <input
          id="global_exa_api_key"
          type="password"
          :value="state.exa_api_key"
          placeholder="exa-..."
          autocomplete="off"
          @input="setKey('exa_api_key', ($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="field">
        <label for="global_scrapingdog_api_key">{{ t("mcp.scrapingdogLabel") }}</label>
        <input
          id="global_scrapingdog_api_key"
          type="password"
          :value="state.scrapingdog_api_key"
          placeholder="..."
          autocomplete="off"
          @input="
            setKey('scrapingdog_api_key', ($event.target as HTMLInputElement).value)
          "
        />
      </div>
    </div>
  </details>
</template>

<script setup lang="ts">
import { useGlobalSettings } from "@/features/global-settings/useGlobalSettings";
import { useI18n } from "@/shared/lib/i18n";

const { t } = useI18n();
const { state, setKey } = useGlobalSettings();
</script>
