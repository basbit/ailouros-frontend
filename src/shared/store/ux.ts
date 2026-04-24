import { defineStore } from "pinia";
import { ref } from "vue";

export type ToastTone = "info" | "success" | "warning" | "error";

export interface ToastEntry {
  id: string;
  tone: ToastTone;
  message: string;
}

type DialogKind = "alert" | "confirm" | "prompt";

interface DialogBase {
  kind: DialogKind;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export interface AlertDialog extends DialogBase {
  kind: "alert";
}

export interface ConfirmDialog extends DialogBase {
  kind: "confirm";
}

export interface PromptDialog extends DialogBase {
  kind: "prompt";
  value?: string;
  placeholder?: string;
}

type DialogState = AlertDialog | ConfirmDialog | PromptDialog;

function nextId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

export const useUxStore = defineStore("ux", () => {
  const toasts = ref<ToastEntry[]>([]);
  const dialog = ref<DialogState | null>(null);
  let resolver: ((value: boolean | string | null) => void) | null = null;

  function notify(message: string, tone: ToastTone = "info", timeoutMs = 2800): void {
    const id = nextId();
    toasts.value.push({ id, tone, message });
    window.setTimeout(() => dismissToast(id), timeoutMs);
  }

  function dismissToast(id: string): void {
    toasts.value = toasts.value.filter((entry) => entry.id !== id);
  }

  function closeDialog(result: boolean | string | null): void {
    const done = resolver;
    resolver = null;
    dialog.value = null;
    done?.(result);
  }

  function alertDialog(options: Omit<AlertDialog, "kind">): Promise<void> {
    dialog.value = { kind: "alert", ...options };
    return new Promise<void>((resolve) => {
      resolver = () => resolve();
    });
  }

  function confirmDialog(options: Omit<ConfirmDialog, "kind">): Promise<boolean> {
    dialog.value = { kind: "confirm", ...options };
    return new Promise<boolean>((resolve) => {
      resolver = (value) => resolve(value === true);
    });
  }

  function promptDialog(options: Omit<PromptDialog, "kind">): Promise<string | null> {
    dialog.value = { kind: "prompt", ...options };
    return new Promise<string | null>((resolve) => {
      resolver = (value) => resolve(typeof value === "string" ? value : null);
    });
  }

  return {
    toasts,
    dialog,
    notify,
    dismissToast,
    closeDialog,
    alertDialog,
    confirmDialog,
    promptDialog,
  };
});
