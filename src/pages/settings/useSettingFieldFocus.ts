import { nextTick, watch } from "vue";
import { useRoute } from "vue-router";

/**
 * `/settings/<pane>?focus=<field>` — a prerequisite link elsewhere in the UI —
 * scrolls to that field and focuses it once the pane has rendered.
 */
export function useSettingFieldFocus(): void {
  const route = useRoute();
  watch(
    () => [route.params.pane, route.query.focus] as const,
    async ([, focus]) => {
      if (typeof focus !== "string" || !focus) return;
      await nextTick();
      const target =
        document.getElementById(`settings_${focus}`) ??
        document.getElementById(`global_${focus}`);
      if (!target) return;
      target.scrollIntoView({ block: "center" });
      target.focus();
    },
    { immediate: true },
  );
}
