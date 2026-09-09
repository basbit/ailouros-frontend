import { computed, getCurrentInstance, onMounted, onUnmounted, watch } from "vue";
import { useUiStore } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";
import { isDesktop } from "@/shared/lib/desktop-bridge";
import { sendDesktopNotification } from "@/shared/lib/useDesktopNotifications";

export interface AttentionAlertState {
  isAttentionRequired: boolean;
  reason: string | null;
}

let originalDocumentTitle: string = "";
let originalFaviconHref: string | null = null;
let lastChimeTimestamp: number = 0;

export function playAttentionChime(): void {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) return;
    const audioContext = new AudioContextClass();
    const currentTime = audioContext.currentTime;

    // Dual-tone chime: Tone 1 (C5 - 523.25 Hz)
    const firstOscillator = audioContext.createOscillator();
    const firstGain = audioContext.createGain();
    firstOscillator.type = "sine";
    firstOscillator.frequency.setValueAtTime(523.25, currentTime);
    firstGain.gain.setValueAtTime(0, currentTime);
    firstGain.gain.linearRampToValueAtTime(0.12, currentTime + 0.04);
    firstGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.28);
    firstOscillator.connect(firstGain);
    firstGain.connect(audioContext.destination);
    firstOscillator.start(currentTime);
    firstOscillator.stop(currentTime + 0.28);

    // Tone 2 (E5 - 659.25 Hz)
    const secondOscillator = audioContext.createOscillator();
    const secondGain = audioContext.createGain();
    secondOscillator.type = "sine";
    secondOscillator.frequency.setValueAtTime(659.25, currentTime + 0.12);
    secondGain.gain.setValueAtTime(0, currentTime + 0.12);
    secondGain.gain.linearRampToValueAtTime(0.15, currentTime + 0.16);
    secondGain.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.48);
    secondOscillator.connect(secondGain);
    secondGain.connect(audioContext.destination);
    secondOscillator.start(currentTime + 0.12);
    secondOscillator.stop(currentTime + 0.48);
  } catch {
    // AudioContext blocked by browser autoplay or unavailable
  }
}

export function updateFaviconBadge(hasBadge: boolean): void {
  if (typeof document === "undefined") return;
  const link = document.querySelector<HTMLLinkElement>("link[rel*='icon']");
  if (!link) return;

  if (!hasBadge) {
    if (originalFaviconHref) {
      link.href = originalFaviconHref;
    }
    return;
  }

  if (!originalFaviconHref) {
    originalFaviconHref = link.href;
  }

  const faviconImage = new Image();
  faviconImage.crossOrigin = "anonymous";
  faviconImage.onload = () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 32;
      canvas.height = 32;
      const canvasContext = canvas.getContext("2d");
      if (!canvasContext) return;
      canvasContext.drawImage(faviconImage, 0, 0, 32, 32);

      // Vermillion notification dot in top-right
      canvasContext.beginPath();
      canvasContext.arc(24, 8, 6, 0, 2 * Math.PI);
      canvasContext.fillStyle = "#d7563f";
      canvasContext.fill();
      canvasContext.lineWidth = 1.5;
      canvasContext.strokeStyle = "#ffffff";
      canvasContext.stroke();

      link.href = canvas.toDataURL("image/png");
    } catch {
      // Canvas tainted or unsupported
    }
  };
  faviconImage.src = originalFaviconHref;
}

export function useAttentionAlert() {
  const ui = useUiStore();
  const preferences = usePreferencesStore();
  const isMuted = computed<boolean>({
    get: () => !preferences.soundAlerts,
    set: (value: boolean) => {
      preferences.soundAlerts = !value;
    },
  });

  const isAttentionRequired = computed(() => {
    if (
      ui.humanGateVisible ||
      ui.shellGateVisible ||
      ui.manualShellGateVisible ||
      ui.retryGateVisible
    ) {
      return true;
    }
    if (ui.taskStatus === "awaiting_human") {
      return true;
    }
    return ui.historyList.some(
      (entry) =>
        entry.status === "awaiting_human" &&
        Boolean(entry.taskId) &&
        ui.activeRunIds.includes(entry.taskId as string),
    );
  });

  const attentionReason = computed<string | null>(() => {
    if (ui.humanGateVisible) return ui.humanGateTitle || "Human approval required";
    if (ui.shellGateVisible) return "Shell command approval required";
    if (ui.manualShellGateVisible)
      return ui.manualShellReason || "Manual shell action required";
    if (ui.retryGateVisible)
      return `Retry decision required for step: ${ui.retryFailedStep || "unknown"}`;
    if (ui.taskStatus === "awaiting_human") return "Pipeline awaiting human review";
    const backgroundTask = ui.historyList.find(
      (entry) =>
        entry.status === "awaiting_human" &&
        Boolean(entry.taskId) &&
        ui.activeRunIds.includes(entry.taskId as string),
    );
    if (backgroundTask && backgroundTask.taskId)
      return `Task ${backgroundTask.taskId.slice(0, 8)} awaiting human review`;
    return null;
  });

  async function triggerDesktopAttention(): Promise<void> {
    if (!isDesktop()) return;
    try {
      const { getCurrentWindow, UserAttentionType } =
        await import("@tauri-apps/api/window");
      const currentWindow = getCurrentWindow();
      if (currentWindow && currentWindow.requestUserAttention) {
        await currentWindow.requestUserAttention(UserAttentionType.Critical);
      }
    } catch {
      // Ignored if unsupported in environment
    }
  }

  function handleAttentionTriggered(reason: string): void {
    if (typeof document !== "undefined") {
      if (!originalDocumentTitle) {
        originalDocumentTitle = document.title;
      }
      if (!document.title.includes("(⚠️ Attention)")) {
        document.title = `(⚠️ Attention) ${originalDocumentTitle}`;
      }
      updateFaviconBadge(true);
    }

    const now = Date.now();
    // Debounce audible/push alerts to at most once every 3s
    if (now - lastChimeTimestamp >= 3000) {
      lastChimeTimestamp = now;

      if (!isMuted.value) {
        playAttentionChime();
      }

      void sendDesktopNotification({
        title: "Agent Swarm: Attention Required",
        body: reason,
        level: "warning",
      });

      void triggerDesktopAttention();
    }
  }

  function handleAttentionCleared(): void {
    if (typeof document !== "undefined") {
      if (originalDocumentTitle) {
        document.title = originalDocumentTitle;
      } else {
        document.title = document.title.replace("(⚠️ Attention) ", "");
      }
      updateFaviconBadge(false);
    }
  }

  watch(
    isAttentionRequired,
    (active, previous) => {
      if (active && !previous) {
        handleAttentionTriggered(attentionReason.value || "Human review requested");
      } else if (!active && previous) {
        handleAttentionCleared();
      }
    },
    { immediate: false },
  );

  if (getCurrentInstance()) {
    onMounted(() => {
      if (typeof document !== "undefined" && !originalDocumentTitle) {
        originalDocumentTitle = document.title;
      }
      if (isAttentionRequired.value) {
        handleAttentionTriggered(attentionReason.value || "Human review requested");
      }
    });

    onUnmounted(() => {
      handleAttentionCleared();
    });
  }

  return {
    isAttentionRequired,
    attentionReason,
    isMuted,
    playAttentionChime,
    handleAttentionTriggered,
    handleAttentionCleared,
  };
}
