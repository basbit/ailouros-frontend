<template>
  <Teleport to="body">
    <div
      v-if="openMenuId && menuPosition"
      class="project-switcher__menu project-switcher__menu--floating"
      :style="menuPosition"
      role="menu"
      @click.stop
    >
      <button
        type="button"
        role="menuitem"
        class="project-switcher__menu-item"
        @click="$emit('edit', openMenuId)"
      >
        {{ t("projectSwitcher.edit") }}
      </button>
      <button
        type="button"
        role="menuitem"
        class="project-switcher__menu-item"
        @click="$emit('rename', openMenuId)"
      >
        {{ t("project.rename") }}
      </button>
      <button
        type="button"
        role="menuitem"
        class="project-switcher__menu-item project-switcher__menu-item--danger"
        :disabled="projectCount <= 1"
        @click="$emit('delete', openMenuId)"
      >
        {{ t("project.delete") }}
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useI18n } from "@/shared/lib/i18n";

defineProps<{
  openMenuId: string | null;
  menuPosition: { top: string; left: string } | null;
  projectCount: number;
}>();

defineEmits<{
  edit: [id: string];
  rename: [id: string];
  delete: [id: string];
}>();

const { t } = useI18n();
</script>
