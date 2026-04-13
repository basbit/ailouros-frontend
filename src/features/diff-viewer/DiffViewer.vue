<template>
  <div v-if="files.length" class="diff-viewer">
    <div class="diff-viewer__header">
      <span class="diff-viewer__stats">
        {{ files.length }} {{ t("diffViewer.filesChanged") }}
        <span v-if="stats.added" class="diff-viewer__added">+{{ stats.added }}</span>
        <span v-if="stats.removed" class="diff-viewer__removed"
          >-{{ stats.removed }}</span
        >
      </span>
      <span v-if="source === 'file_list'" class="diff-viewer__notice">
        {{ t("diffViewer.noGit") }}
      </span>
    </div>

    <div v-if="diffText" class="diff-viewer__content">
      <div v-for="(block, bi) in parsedBlocks" :key="bi" class="diff-block">
        <!-- File header row: click to collapse, edit button on right -->
        <div class="diff-block__filename" @click="toggleCollapse(bi)">
          <span class="diff-block__collapse-icon">{{ collapsed[bi] ? "▶" : "▼" }}</span>
          <span class="diff-block__name">{{ block.filename }}</span>
          <button
            v-if="taskId"
            type="button"
            class="diff-block__edit-btn"
            :class="{ active: editMode[bi] }"
            @click.stop="toggleEdit(bi, block.filename)"
          >
            {{ editMode[bi] ? t("diffViewer.cancelEdit") : t("diffViewer.editFile") }}
          </button>
        </div>

        <!-- Edit mode: textarea + save -->
        <div v-if="editMode[bi]" class="diff-block__editor">
          <textarea
            class="diff-block__textarea"
            :value="editContent[bi] ?? ''"
            @input="editContent[bi] = ($event.target as HTMLTextAreaElement).value"
          />
          <div class="diff-block__editor-actions">
            <button
              type="button"
              class="diff-block__save-btn"
              :disabled="saving[bi]"
              @click="saveFile(bi, block.filename)"
            >
              {{ saving[bi] ? "…" : t("diffViewer.saveFile") }}
            </button>
            <button type="button" class="diff-block__cancel-btn" @click="closeEdit(bi)">
              {{ t("diffViewer.cancelEdit") }}
            </button>
            <span v-if="saveError[bi]" class="diff-block__save-error">{{
              saveError[bi]
            }}</span>
            <span v-if="saveOk[bi]" class="diff-block__save-ok">✓ saved</span>
          </div>
        </div>

        <!-- Diff lines (hidden when collapsed or in edit mode) -->
        <div v-if="!collapsed[bi] && !editMode[bi]" class="diff-block__lines">
          <div
            v-for="(line, li) in block.lines"
            :key="li"
            class="diff-line"
            :class="{
              'diff-line--added': line.type === 'added',
              'diff-line--removed': line.type === 'removed',
              'diff-line--hunk': line.type === 'hunk',
              'diff-line--context': line.type === 'context',
            }"
          >
            <span class="diff-line__gutter">{{
              line.type === "added"
                ? "+"
                : line.type === "removed"
                  ? "-"
                  : line.type === "hunk"
                    ? "@@"
                    : " "
            }}</span>
            <span class="diff-line__content">{{ line.content }}</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="diff-viewer__file-list">
      <div v-for="f in files" :key="f" class="diff-viewer__file-item">
        <span class="diff-viewer__file-icon">&#128196;</span> {{ f }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive } from "vue";
import { useI18n } from "@/shared/lib/i18n";
import { apiUrl } from "@/shared/api/base";

interface DiffStats {
  added: number;
  removed: number;
  files: number;
}

interface DiffLine {
  type: "added" | "removed" | "hunk" | "context" | "meta";
  content: string;
}

interface DiffBlock {
  filename: string;
  lines: DiffLine[];
}

const props = defineProps<{
  diffText: string;
  files: string[];
  stats: DiffStats;
  source: "git" | "file_list" | "none";
  taskId?: string;
}>();

const { t } = useI18n();

// Per-file UI state
const collapsed = reactive<Record<number, boolean>>({});
const editMode = reactive<Record<number, boolean>>({});
const editContent = reactive<Record<number, string>>({});
const saving = reactive<Record<number, boolean>>({});
const saveError = reactive<Record<number, string>>({});
const saveOk = reactive<Record<number, boolean>>({});

function toggleCollapse(bi: number): void {
  collapsed[bi] = !collapsed[bi];
}

async function toggleEdit(bi: number, filename: string): Promise<void> {
  if (editMode[bi]) {
    closeEdit(bi);
    return;
  }
  saveError[bi] = "";
  saveOk[bi] = false;

  // Try to fetch current file content from backend
  if (props.taskId) {
    try {
      const r = await fetch(
        apiUrl(
          `/v1/tasks/${props.taskId}/workspace-file?path=${encodeURIComponent(filename)}`,
        ),
      );
      if (r.ok) {
        const data = await r.json();
        editContent[bi] = typeof data.content === "string" ? data.content : "";
      } else {
        // Fall back to reconstructing from diff
        editContent[bi] = reconstructFromDiff(bi);
      }
    } catch {
      editContent[bi] = reconstructFromDiff(bi);
    }
  } else {
    editContent[bi] = reconstructFromDiff(bi);
  }

  editMode[bi] = true;
}

function closeEdit(bi: number): void {
  editMode[bi] = false;
  saveError[bi] = "";
  saveOk[bi] = false;
}

function reconstructFromDiff(bi: number): string {
  // Build file content from context + added lines in the diff block
  const block = parsedBlocks.value[bi];
  if (!block) return "";
  return block.lines
    .filter((l) => l.type === "context" || l.type === "added")
    .map((l) => l.content)
    .join("\n");
}

async function saveFile(bi: number, filename: string): Promise<void> {
  if (!props.taskId) return;
  saving[bi] = true;
  saveError[bi] = "";
  saveOk[bi] = false;
  try {
    const r = await fetch(apiUrl(`/v1/tasks/${props.taskId}/workspace-file`), {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: filename, content: editContent[bi] ?? "" }),
    });
    if (!r.ok) {
      const msg = await r.text().catch(() => `HTTP ${r.status}`);
      saveError[bi] = msg;
    } else {
      saveOk[bi] = true;
      setTimeout(() => {
        closeEdit(bi);
      }, 1200);
    }
  } catch (e) {
    saveError[bi] = e instanceof Error ? e.message : String(e);
  } finally {
    saving[bi] = false;
  }
}

function parseDiff(text: string): DiffBlock[] {
  const blocks: DiffBlock[] = [];
  let current: DiffBlock | null = null;

  for (const raw of text.split("\n")) {
    if (raw.startsWith("diff --git")) {
      if (current) blocks.push(current);
      const m = raw.match(/diff --git a\/(.+) b\//);
      const filename = m ? m[1] : raw;
      current = { filename, lines: [] };
      continue;
    }
    if (!current) {
      current = { filename: "(unknown)", lines: [] };
    }
    if (
      raw.startsWith("+++") ||
      raw.startsWith("---") ||
      raw.startsWith("index ") ||
      raw.startsWith("new file") ||
      raw.startsWith("deleted file")
    ) {
      continue;
    }
    if (raw.startsWith("@@")) {
      current.lines.push({ type: "hunk", content: raw });
      continue;
    }
    if (raw.startsWith("+")) {
      current.lines.push({ type: "added", content: raw.slice(1) });
    } else if (raw.startsWith("-")) {
      current.lines.push({ type: "removed", content: raw.slice(1) });
    } else {
      current.lines.push({ type: "context", content: raw.slice(1) });
    }
  }

  if (current) blocks.push(current);
  return blocks;
}

const parsedBlocks = computed<DiffBlock[]>(() =>
  props.diffText ? parseDiff(props.diffText) : [],
);
</script>

<style scoped>
.diff-viewer {
  margin-top: 10px;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 6px;
  overflow: hidden;
  font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", monospace;
  font-size: 12px;
}
.diff-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 10px;
  background: var(--bg2, #1e2230);
  border-bottom: 1px solid var(--border, #2a2f3e);
  font-size: 11px;
}
.diff-viewer__stats {
  display: flex;
  gap: 8px;
  align-items: center;
  color: var(--text2, #9dadd0);
}
.diff-viewer__added {
  color: var(--success, #51cf66);
  font-weight: 600;
}
.diff-viewer__removed {
  color: var(--error, #f03e3e);
  font-weight: 600;
}
.diff-viewer__notice {
  font-size: 11px;
  color: var(--warning, #ffd43b);
  opacity: 0.8;
}
.diff-viewer__content {
  max-height: 500px;
  overflow-y: auto;
}
.diff-block {
  border-bottom: 1px solid var(--border, #2a2f3e);
}
.diff-block:last-child {
  border-bottom: none;
}
.diff-block__filename {
  padding: 4px 10px;
  background: color-mix(in srgb, var(--accent, #3b5bdb) 15%, var(--bg2, #1e2230));
  color: var(--text1, #c8cfe8);
  font-size: 11px;
  font-weight: 600;
  border-bottom: 1px solid var(--border, #2a2f3e);
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
}
.diff-block__filename:hover {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 22%, var(--bg2, #1e2230));
}
.diff-block__collapse-icon {
  font-size: 9px;
  color: var(--text3, #6b7a99);
  width: 10px;
  flex-shrink: 0;
}
.diff-block__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.diff-block__edit-btn {
  background: none;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 10px;
  padding: 2px 7px;
  transition:
    background 0.15s,
    color 0.15s;
  flex-shrink: 0;
}
.diff-block__edit-btn:hover,
.diff-block__edit-btn.active {
  background: var(--accent, #3b5bdb);
  color: #fff;
  border-color: var(--accent, #3b5bdb);
}
.diff-block__editor {
  padding: 8px;
  background: var(--bg, #161922);
}
.diff-block__textarea {
  width: 100%;
  min-height: 220px;
  box-sizing: border-box;
  background: var(--bg2, #1e2230);
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text1, #c8cfe8);
  font-family: inherit;
  font-size: 12px;
  padding: 6px 8px;
  resize: vertical;
  tab-size: 2;
}
.diff-block__editor-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
}
.diff-block__save-btn {
  padding: 4px 14px;
  background: var(--accent, #3b5bdb);
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: opacity 0.15s;
}
.diff-block__save-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.diff-block__cancel-btn {
  padding: 4px 10px;
  background: none;
  border: 1px solid var(--border, #2a2f3e);
  border-radius: 4px;
  color: var(--text2, #9dadd0);
  cursor: pointer;
  font-size: 12px;
}
.diff-block__cancel-btn:hover {
  background: var(--surface2, #252b3b);
}
.diff-block__save-error {
  color: var(--error, #f03e3e);
  font-size: 11px;
}
.diff-block__save-ok {
  color: var(--success, #51cf66);
  font-size: 11px;
}
.diff-block__lines {
  background: var(--bg, #161922);
}
.diff-line {
  display: flex;
  min-height: 18px;
  line-height: 18px;
}
.diff-line--added {
  background: color-mix(in srgb, #51cf66 12%, transparent);
}
.diff-line--removed {
  background: color-mix(in srgb, #f03e3e 12%, transparent);
}
.diff-line--hunk {
  background: color-mix(in srgb, var(--accent, #3b5bdb) 10%, transparent);
  color: var(--text2, #9dadd0);
}
.diff-line__gutter {
  width: 16px;
  min-width: 16px;
  text-align: center;
  color: var(--text2, #9dadd0);
  user-select: none;
  padding: 0 2px;
}
.diff-line--added .diff-line__gutter {
  color: var(--success, #51cf66);
}
.diff-line--removed .diff-line__gutter {
  color: var(--error, #f03e3e);
}
.diff-line__content {
  flex: 1;
  white-space: pre;
  overflow-x: auto;
  color: var(--text1, #c8cfe8);
  padding: 0 4px;
}
.diff-viewer__file-list {
  padding: 8px;
}
.diff-viewer__file-item {
  padding: 4px 6px;
  font-size: 12px;
  color: var(--text2, #9dadd0);
  display: flex;
  align-items: center;
  gap: 6px;
}
.diff-viewer__file-icon {
  font-size: 13px;
}
</style>
