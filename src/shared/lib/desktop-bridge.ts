export function isDesktop(): boolean {
  if (typeof window === "undefined") return false;
  const host = window as unknown as Record<string, unknown>;
  if ("isTauri" in host || "__TAURI_INTERNALS__" in host || "__TAURI__" in host) {
    return true;
  }
  const agent =
    typeof navigator !== "undefined" && typeof navigator.userAgent === "string"
      ? navigator.userAgent
      : "";
  return /tauri/i.test(agent);
}

export async function probeDesktop(): Promise<boolean> {
  if (isDesktop()) return true;
  try {
    const core = await import("@tauri-apps/api/core");
    await core.invoke("get_desktop_mode");
    return true;
  } catch {
    return false;
  }
}

export async function invokeCommand<T = unknown>(
  command: string,
  args?: Record<string, unknown>,
): Promise<T> {
  const core = await import("@tauri-apps/api/core");
  return (await core.invoke(command, args)) as T;
}

export async function listenEvent<T>(
  name: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isDesktop()) {
    return () => {};
  }
  const event = await import("@tauri-apps/api/event");
  const unlisten = await event.listen<T>(name, (raw) => handler(raw.payload));
  return () => {
    unlisten();
  };
}

export const DESKTOP_EVENTS = {
  bootstrapProgress: "bootstrap://progress",
} as const;
