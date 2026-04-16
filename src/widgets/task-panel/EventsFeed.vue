<template>
  <div class="panel content-panel--events">
    <div class="panel-header">
      <span class="panel-title">{{ t("events.title") }}</span>
      <div class="view-toolbar">
        <label>
          <input
            type="radio"
            name="events_view"
            value="preview"
            :checked="viewMode === 'preview'"
            @change="emit('update:viewMode', 'preview')"
          />
          {{ t("events.preview") }}
        </label>
        <label>
          <input
            type="radio"
            name="events_view"
            value="raw"
            :checked="viewMode === 'raw'"
            @change="emit('update:viewMode', 'raw')"
          />
          {{ t("events.raw") }}
        </label>
      </div>
    </div>
    <div id="eventsFeed" class="events-feed">
      <div v-if="!events.length" class="events-empty">{{ t("events.empty") }}</div>
      <article
        v-for="(ev, i) in events"
        :key="eventKey(ev, i)"
        class="event-card"
        :class="{
          'event-card--warning':
            ev.status === 'warning' || (ev.message ?? '').startsWith('⚠'),
        }"
      >
        <header class="event-card__meta">
          <time v-if="ev.timestamp" :datetime="ev.timestamp" :title="ev.timestamp">
            {{ formatTimestamp(ev.timestamp) }}
          </time>
          <span class="event-card__agent">[{{ ev.agent ?? "" }}]</span>
          <button
            v-if="ev.message"
            class="event-card__save-btn"
            :class="{
              'event-card__save-btn--saved': saveState(eventKey(ev, i)) === 'success',
              'event-card__save-btn--error': saveState(eventKey(ev, i)) === 'error',
            }"
            :disabled="saveState(eventKey(ev, i)) === 'pending'"
            :title="saveButtonTitle(eventKey(ev, i))"
            @click="saveToMemory(eventKey(ev, i), ev.message ?? '')"
          >
            {{ saveButtonLabel(eventKey(ev, i)) }}
          </button>
        </header>
        <div v-if="viewMode === 'raw'" class="event-card__body event-card__body--raw">
          <pre class="event-md-fallback">{{ ev.message ?? "" }}</pre>
        </div>
        <SafeHtmlBlock
          v-else
          class-name="event-card__body md-prose"
          :html="renderMarkdown(ev.message ?? '')"
        />
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { unwrapMarkdownFence } from "@/shared/lib/markdown";
import { apiUrl } from "@/shared/api/base";
import SafeHtmlBlock from "@/shared/components/SafeHtmlBlock";
import { useI18n } from "@/shared/lib/i18n";
import { useUxStore } from "@/shared/store/ux";

interface EventRow {
  id?: string;
  agent?: string;
  message?: string;
  timestamp?: string;
  status?: string;
}

defineProps<{
  events: EventRow[];
  viewMode: "preview" | "raw";
}>();
const emit = defineEmits<{
  "update:viewMode": [mode: "preview" | "raw"];
}>();

const saveStates = ref<Record<string, "idle" | "pending" | "success" | "error">>({});
const { t } = useI18n();
const ux = useUxStore();

async function saveToMemory(key: string, text: string): Promise<void> {
  if (saveState(key) === "pending") return;
  saveStates.value = { ...saveStates.value, [key]: "pending" };
  try {
    const resp = await fetch(apiUrl("/v1/memory/notes"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, source: "pipeline_event" }),
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status}`);
    }
    window.dispatchEvent(new CustomEvent("memory-note-saved"));
    saveStates.value = { ...saveStates.value, [key]: "success" };
    ux.notify(t("toast.savedMemory"), "success");
    setTimeout(() => {
      saveStates.value = { ...saveStates.value, [key]: "idle" };
    }, 1800);
  } catch {
    saveStates.value = { ...saveStates.value, [key]: "error" };
    ux.notify(t("toast.saveMemoryFailed"), "error", 4200);
  }
}

function eventKey(ev: EventRow, index: number): string {
  if (ev.id) return ev.id;
  const base = [
    ev.timestamp ?? "",
    ev.agent ?? "",
    ev.message ?? "",
    ev.status ?? "",
  ].join("|");
  return base || `event-${index}`;
}

function saveState(key: string): "idle" | "pending" | "success" | "error" {
  return saveStates.value[key] ?? "idle";
}

function saveButtonLabel(key: string): string {
  const state = saveState(key);
  if (state === "pending") return t("events.saving");
  if (state === "success") return t("events.saved");
  if (state === "error") return t("events.retry");
  return t("events.save");
}

function saveButtonTitle(key: string): string {
  const state = saveState(key);
  if (state === "error") return t("events.saveError");
  return saveButtonLabel(key);
}

function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch {
    return iso;
  }
}

function renderMarkdown(md: string): string {
  try {
    // §6.4 bug-plan: strip agent-wrapped ```markdown fence so inner
    // headings/lists render as real HTML instead of a <pre><code> block.
    const unwrapped = unwrapMarkdownFence(String(md ?? ""));
    const html = String(
      marked.parse(unwrapped, { async: false, breaks: true, gfm: true }),
    );
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "strong",
        "em",
        "b",
        "i",
        "del",
        "s",
        "ul",
        "ol",
        "li",
        "blockquote",
        "code",
        "pre",
        "hr",
        "a",
        "img",
        "table",
        "thead",
        "tbody",
        "tr",
        "th",
        "td",
        "span",
        "div",
      ],
      ALLOWED_ATTR: ["href", "title", "target", "rel", "src", "alt", "class", "id"],
    });
  } catch {
    return `<pre class="event-md-fallback">${md.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  }
}
</script>

<style scoped>
.event-card--warning {
  border-left: 3px solid var(--warning, #ff9d57);
  background: color-mix(in srgb, var(--warning, #ff9d57) 10%, transparent);
}

.event-card__save-btn {
  margin-left: auto;
  padding: 2px 6px;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--border-hi, #4b4138) 55%, transparent);
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text2, #cbbfad);
  line-height: 1.4;
  transition:
    color 0.15s,
    border-color 0.15s;
  white-space: nowrap;
}

.event-card__save-btn:hover {
  color: var(--text, #f5f0e7);
  border-color: color-mix(in srgb, var(--text, #f5f0e7) 50%, transparent);
}

.event-card__save-btn--saved {
  color: var(--success, #72dfb9);
  border-color: color-mix(in srgb, var(--success, #72dfb9) 40%, transparent);
}

.event-card__save-btn--error {
  color: var(--error, #d7563f);
  border-color: color-mix(in srgb, var(--error, #d7563f) 40%, transparent);
}
</style>
