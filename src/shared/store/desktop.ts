import { defineStore } from "pinia";
import { ref } from "vue";

import { getDesktopInfo, type DesktopInfo } from "@/shared/api/endpoints/desktop";

const EMPTY_INFO: DesktopInfo = { is_desktop: false, workspaces_dir: null };

export const useDesktopStore = defineStore("desktop", () => {
  const info = ref<DesktopInfo>(EMPTY_INFO);
  const loaded = ref(false);
  let pending: Promise<DesktopInfo> | null = null;

  async function ensureLoaded(): Promise<DesktopInfo> {
    if (loaded.value) return info.value;
    if (pending) return pending;
    pending = getDesktopInfo()
      .then((next) => {
        info.value = next;
        loaded.value = true;
        return next;
      })
      .finally(() => {
        pending = null;
      });
    return pending;
  }

  return { info, loaded, ensureLoaded };
});
