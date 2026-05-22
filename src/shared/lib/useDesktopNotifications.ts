import { isDesktop } from "@/shared/lib/desktop-bridge";

export interface DesktopNotificationPayload {
  title: string;
  body: string;
  level?: "info" | "warning" | "error" | "critical";
}

let cachedSendNotification:
  | ((payload: { title: string; body: string }) => Promise<void>)
  | null = null;
let cachedRequestPermission: (() => Promise<string>) | null = null;
let cachedIsPermissionGranted: (() => Promise<boolean>) | null = null;

async function loadTauriNotificationApi(): Promise<void> {
  if (cachedSendNotification && cachedRequestPermission && cachedIsPermissionGranted) {
    return;
  }
  try {
    const tauri = await import("@tauri-apps/plugin-notification");
    cachedSendNotification = async (payload) => {
      await tauri.sendNotification(payload);
    };
    cachedRequestPermission = tauri.requestPermission;
    cachedIsPermissionGranted = tauri.isPermissionGranted;
  } catch (caught) {
    cachedSendNotification = null;
    cachedRequestPermission = null;
    cachedIsPermissionGranted = null;
    throw caught;
  }
}

async function ensurePermission(): Promise<boolean> {
  if (!cachedIsPermissionGranted || !cachedRequestPermission) return false;
  try {
    const granted = await cachedIsPermissionGranted();
    if (granted) return true;
    const requested = await cachedRequestPermission();
    return requested === "granted";
  } catch {
    return false;
  }
}

async function sendBrowserNotification(
  payload: DesktopNotificationPayload,
): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined")
    return false;
  try {
    if (Notification.permission === "default") {
      await Notification.requestPermission();
    }
    if (Notification.permission !== "granted") return false;
    new Notification(payload.title, { body: payload.body });
    return true;
  } catch {
    return false;
  }
}

export async function sendDesktopNotification(
  payload: DesktopNotificationPayload,
): Promise<boolean> {
  if (isDesktop()) {
    try {
      await loadTauriNotificationApi();
      if (cachedSendNotification && (await ensurePermission())) {
        await cachedSendNotification({ title: payload.title, body: payload.body });
        return true;
      }
    } catch {
      return await sendBrowserNotification(payload);
    }
  }
  return await sendBrowserNotification(payload);
}
