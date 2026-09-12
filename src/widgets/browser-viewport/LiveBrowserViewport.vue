<template>
  <div class="live-browser-viewport">
    <!-- Viewport Navigation Bar -->
    <div class="live-browser-viewport__navbar">
      <div class="live-browser-viewport__nav-controls">
        <button
          type="button"
          class="live-browser-viewport__icon-btn"
          :title="t('liveBrowser.reload')"
          :aria-label="t('liveBrowser.reload')"
          @click="onReload"
        >
          ↻
        </button>
      </div>

      <form class="live-browser-viewport__url-form" @submit.prevent="onNavigate">
        <span class="live-browser-viewport__lock">🔒</span>
        <input
          v-model="inputUrl"
          type="text"
          class="live-browser-viewport__url-input"
          :placeholder="t('liveBrowser.urlPlaceholder')"
        />
        <button type="submit" class="live-browser-viewport__go-btn">→</button>
      </form>

      <!-- Viewport Device Resizer -->
      <div class="live-browser-viewport__modes">
        <button
          type="button"
          class="live-browser-viewport__mode-btn"
          :class="{
            'live-browser-viewport__mode-btn--active': viewportMode === 'desktop',
          }"
          :title="t('liveBrowser.viewportDesktop')"
          @click="setViewport('desktop')"
        >
          🖥️ {{ t("liveBrowser.deviceDesktop") }}
        </button>
        <button
          type="button"
          class="live-browser-viewport__mode-btn"
          :class="{
            'live-browser-viewport__mode-btn--active': viewportMode === 'mobile',
          }"
          :title="t('liveBrowser.viewportMobile')"
          @click="setViewport('mobile')"
        >
          📱 {{ t("liveBrowser.deviceMobile") }}
        </button>
      </div>

      <!-- Live Stream Status Indicator -->
      <div class="live-browser-viewport__status">
        <span
          class="live-browser-viewport__status-dot"
          :class="`live-browser-viewport__status-dot--${connectionStatus}`"
        />
        <span class="live-browser-viewport__status-label">{{ statusLabel }}</span>
      </div>

      <button
        v-if="connectionStatus !== 'connected'"
        type="button"
        class="live-browser-viewport__reconnect-btn"
        @click="connectStream"
      >
        {{ t("liveBrowser.connect") }}
      </button>
    </div>

    <!-- Screen Surface Display Area -->
    <div
      ref="containerRef"
      class="live-browser-viewport__surface"
      :class="`live-browser-viewport__surface--${viewportMode}`"
    >
      <div
        v-if="frameData"
        class="live-browser-viewport__frame-wrapper"
        :style="{
          width: `${viewportWidth}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          aspectRatio: `${viewportWidth} / ${viewportHeight}`,
        }"
        @click="onSurfaceClick"
      >
        <img
          ref="imageRef"
          :src="frameData"
          alt="Live Browser Screencast"
          class="live-browser-viewport__image"
          draggable="false"
        />
      </div>
      <div v-else class="live-browser-viewport__placeholder">
        <p>{{ placeholderText }}</p>
        <button
          v-if="connectionStatus === 'disconnected'"
          type="button"
          class="btn-secondary"
          @click="connectStream"
        >
          {{ t("liveBrowser.connect") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { getScreencastWebSocketUrl } from "@/shared/api/endpoints/ws";

const props = defineProps<{
  taskId: string;
}>();

const { t } = useI18n();

const connectionStatus = ref<"disconnected" | "connecting" | "connected">(
  "disconnected",
);
// Filled from the screencast "status" packet; guessing a dev-server port here
// would send the operator to a page that has nothing to do with their run.
const inputUrl = ref("");
const frameData = ref<string | null>(null);
const viewportMode = ref<"desktop" | "mobile">("desktop");
const viewportWidth = ref(1440);
const viewportHeight = ref(1000);

const containerRef = ref<HTMLDivElement | null>(null);
const imageRef = ref<HTMLImageElement | null>(null);

let socket: WebSocket | null = null;

const statusLabel = computed(() => {
  if (connectionStatus.value === "connected") return t("liveBrowser.connected");
  if (connectionStatus.value === "connecting") return t("liveBrowser.connecting");
  return t("liveBrowser.disconnected");
});

// The placeholder must not claim "connecting" once the socket is gone, or a
// refused/closed stream is indistinguishable from one that is still handshaking.
const placeholderText = computed(() => {
  if (connectionStatus.value === "connecting") return t("liveBrowser.connecting");
  if (connectionStatus.value === "connected") return t("liveBrowser.waitingFrame");
  return t("liveBrowser.streamFailed");
});

function setViewport(mode: "desktop" | "mobile"): void {
  viewportMode.value = mode;
  if (mode === "desktop") {
    viewportWidth.value = 1440;
    viewportHeight.value = 1000;
  } else {
    viewportWidth.value = 390;
    viewportHeight.value = 844;
  }
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "resize",
        width: viewportWidth.value,
        height: viewportHeight.value,
      }),
    );
  }
}

async function connectStream(): Promise<void> {
  if (!props.taskId) return;
  if (socket) {
    socket.close();
    socket = null;
  }

  connectionStatus.value = "connecting";
  let url: string;
  try {
    url = await getScreencastWebSocketUrl(props.taskId);
  } catch {
    connectionStatus.value = "disconnected";
    return;
  }

  try {
    const ws = new WebSocket(url);
    socket = ws;

    ws.onopen = () => {
      connectionStatus.value = "connected";
    };

    ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string) as {
          type?: string;
          data?: string;
          url?: string;
        };
        if (message.type === "frame" && message.data) {
          frameData.value = message.data;
        } else if (message.type === "status" && message.url) {
          inputUrl.value = message.url;
        }
      } catch {
        /* ignore non-json */
      }
    };

    ws.onclose = () => {
      connectionStatus.value = "disconnected";
    };

    ws.onerror = () => {
      connectionStatus.value = "disconnected";
    };
  } catch {
    connectionStatus.value = "disconnected";
  }
}

function onNavigate(): void {
  if (!inputUrl.value.trim()) return;
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "navigate",
        url: inputUrl.value.trim(),
      }),
    );
  }
}

function onReload(): void {
  onNavigate();
}

function onSurfaceClick(event: MouseEvent): void {
  if (!imageRef.value || !socket || socket.readyState !== WebSocket.OPEN) return;
  const rect = imageRef.value.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;

  const scaleX = viewportWidth.value / rect.width;
  const scaleY = viewportHeight.value / rect.height;

  const targetX = Math.round(clickX * scaleX);
  const targetY = Math.round(clickY * scaleY);

  socket.send(
    JSON.stringify({
      type: "click",
      x: targetX,
      y: targetY,
    }),
  );
}

function disconnectStream(): void {
  if (socket) {
    socket.close();
    socket = null;
  }
  connectionStatus.value = "disconnected";
}

watch(
  () => props.taskId,
  () => {
    void connectStream();
  },
);

onMounted(() => void connectStream());

// Routes live inside <keep-alive>: leaving the page fires onDeactivated, so
// without this the screencast socket stayed open for the rest of the session.
onDeactivated(disconnectStream);
onActivated(() => void connectStream());
onBeforeUnmount(disconnectStream);
</script>

<style scoped src="./live-browser-viewport.css"></style>
