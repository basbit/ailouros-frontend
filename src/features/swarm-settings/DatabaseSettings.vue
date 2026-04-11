<template>
  <div class="database-settings-fields">
    <div class="field">
      <label class="field-label" for="swarm_database_url">{{
        t("database.urlLabel")
      }}</label>
      <input
        id="swarm_database_url"
        type="password"
        autocomplete="off"
        placeholder="postgres://…"
        :value="form.swarm_database_url"
        @input="
          emit(
            'update:form',
            'swarm_database_url',
            ($event.target as HTMLInputElement).value,
          )
        "
      />
      <div class="hint">{{ t("database.secretHint") }}</div>
    </div>
    <div class="field">
      <label class="field-label" for="swarm_database_hint">{{
        t("database.hintLabel")
      }}</label>
      <textarea
        id="swarm_database_hint"
        rows="2"
        placeholder="public.users, orders…"
        :value="form.swarm_database_hint"
        @input="
          emit(
            'update:form',
            'swarm_database_hint',
            ($event.target as HTMLTextAreaElement).value,
          )
        "
      />
    </div>
    <div class="field">
      <label class="checkbox-row">
        <input
          id="swarm_database_readonly"
          type="checkbox"
          :checked="form.swarm_database_readonly"
          @change="
            emit(
              'update:form',
              'swarm_database_readonly',
              String(($event.target as HTMLInputElement).checked),
            )
          "
        />
        <span class="check-label">{{ t("database.readonlyLabel") }}</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

interface DatabaseFormSlice {
  swarm_database_url: string;
  swarm_database_hint: string;
  swarm_database_readonly: boolean;
}

defineProps<{ form: DatabaseFormSlice }>();

const emit = defineEmits<{
  "update:form": [field: string, value: string];
}>();
const { t } = useI18n();
</script>
