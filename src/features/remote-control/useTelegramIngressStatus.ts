import { onBeforeUnmount, onMounted, ref } from "vue";
import { describeApiError } from "@/shared/api/api-error-detail";
import {
  getTelegramIngressStatus,
  type TelegramIngressStatus,
} from "@/shared/api/endpoints/remote-control";

export const TELEGRAM_STATUS_POLL_MS = 3000;

/** The bot's live state; polled while the pane is open, since a save applies in the background. */
export function useTelegramIngressStatus(intervalMs: number = TELEGRAM_STATUS_POLL_MS) {
  const status = ref<TelegramIngressStatus | null>(null);
  const error = ref("");
  let timer: ReturnType<typeof setInterval> | null = null;

  async function refresh(): Promise<void> {
    try {
      status.value = await getTelegramIngressStatus();
      error.value = "";
    } catch (err) {
      error.value = describeApiError(err);
    }
  }

  onMounted(() => {
    void refresh();
    timer = setInterval(() => void refresh(), intervalMs);
  });

  onBeforeUnmount(() => {
    if (timer !== null) clearInterval(timer);
  });

  return { status, error, refresh };
}
