import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick } from "vue";
import { createPinia, setActivePinia } from "pinia";
import { useUiStore } from "@/shared/store/ui";
import { usePreferencesStore } from "@/shared/store/preferences";

vi.mock("@/shared/lib/desktop-bridge", () => ({
  isDesktop: vi.fn().mockReturnValue(false),
}));

const sendDesktopNotification = vi.fn().mockResolvedValue(true);
vi.mock("@/shared/lib/useDesktopNotifications", () => ({
  sendDesktopNotification: (...args: unknown[]) => sendDesktopNotification(...args),
}));

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, string | number>) =>
      params ? `${key}:${Object.values(params).join(",")}` : key,
  }),
}));

// The chime debounce and the saved document title live in module scope, so each
// test needs a fresh module instance to be independent.
async function loadAttentionAlert() {
  vi.resetModules();
  return import("./useAttentionAlert");
}

describe("useAttentionAlert", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    document.title = "Agent Swarm";
    sendDesktopNotification.mockClear();
  });

  it("is false when no gates or human approval states are active", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const alert = useAttentionAlert();
    expect(alert.isAttentionRequired.value).toBe(false);
    expect(alert.attentionReason.value).toBeNull();
  });

  it("becomes true when humanGateVisible is set", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const ui = useUiStore();
    const alert = useAttentionAlert();

    ui.humanGateVisible = true;
    ui.humanGateTitle = "Approve Architecture";

    expect(alert.isAttentionRequired.value).toBe(true);
    expect(alert.attentionReason.value).toBe("Approve Architecture");
  });

  it("translates every attention reason instead of printing English", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const ui = useUiStore();
    const alert = useAttentionAlert();

    ui.shellGateVisible = true;
    expect(alert.attentionReason.value).toBe("attention.shellApproval");

    ui.shellGateVisible = false;
    ui.retryGateVisible = true;
    ui.retryFailedStep = "review_qa";
    expect(alert.attentionReason.value).toBe("attention.retryDecision:review_qa");

    ui.retryGateVisible = false;
    ui.taskStatus = "awaiting_human";
    expect(alert.attentionReason.value).toBe("attention.awaitingReview");
  });

  it("fires the alert from the watcher when attention starts, and clears it", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const ui = useUiStore();
    useAttentionAlert();

    ui.humanGateVisible = true;
    await nextTick();

    expect(document.title).toContain("attention.titleMarker");
    expect(sendDesktopNotification).toHaveBeenCalledTimes(1);
    expect(sendDesktopNotification.mock.calls[0][0]).toMatchObject({
      title: "attention.notificationTitle",
      level: "warning",
    });

    ui.humanGateVisible = false;
    await nextTick();
    expect(document.title).not.toContain("attention.titleMarker");
  });

  it("mutes the desktop notification, not only the chime", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const preferences = usePreferencesStore();
    preferences.soundAlerts = false;
    const ui = useUiStore();
    useAttentionAlert();

    ui.humanGateVisible = true;
    await nextTick();

    expect(document.title).toContain("attention.titleMarker");
    expect(sendDesktopNotification).not.toHaveBeenCalled();
  });

  it("updates document.title on trigger and restores on clear", async () => {
    const { useAttentionAlert } = await loadAttentionAlert();
    const alert = useAttentionAlert();
    alert.handleAttentionTriggered("Approval needed");
    expect(document.title).toContain("attention.titleMarker");

    alert.handleAttentionCleared();
    expect(document.title).not.toContain("attention.titleMarker");
  });

  it("playAttentionChime does not throw even if Web Audio is mocked or missing", async () => {
    const { playAttentionChime } = await loadAttentionAlert();
    expect(() => playAttentionChime()).not.toThrow();
  });
});
