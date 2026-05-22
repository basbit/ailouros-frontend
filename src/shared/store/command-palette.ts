import { defineStore } from "pinia";
import { ref } from "vue";

export const useCommandPaletteStore = defineStore("commandPalette", () => {
  const open = ref(false);

  function show(): void {
    open.value = true;
  }

  function hide(): void {
    open.value = false;
  }

  function toggle(): void {
    open.value = !open.value;
  }

  return { open, show, hide, toggle };
});
