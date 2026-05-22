import { computed, reactive, type ComputedRef } from "vue";
import { ApiError } from "@/shared/api/client";
import {
  patchWorkspaceFile,
  tryGetWorkspaceFile,
} from "@/shared/api/endpoints/workspace";

export interface DiffLine {
  type: "added" | "removed" | "hunk" | "context" | "meta";
  content: string;
}

export interface DiffBlock {
  filename: string;
  lines: DiffLine[];
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

interface DiffViewerStateOptions {
  diffText: ComputedRef<string>;
  taskId: ComputedRef<string | undefined>;
}

export function useDiffViewerState({ diffText, taskId }: DiffViewerStateOptions) {
  const collapsed = reactive<Record<number, boolean>>({});
  const editMode = reactive<Record<number, boolean>>({});
  const editContent = reactive<Record<number, string>>({});
  const saving = reactive<Record<number, boolean>>({});
  const saveError = reactive<Record<number, string>>({});
  const saveOk = reactive<Record<number, boolean>>({});

  const parsedBlocks = computed<DiffBlock[]>(() =>
    diffText.value ? parseDiff(diffText.value) : [],
  );

  function toggleCollapse(bi: number): void {
    collapsed[bi] = !collapsed[bi];
  }

  function closeEdit(bi: number): void {
    editMode[bi] = false;
    saveError[bi] = "";
    saveOk[bi] = false;
  }

  function reconstructFromDiff(bi: number): string {
    const block = parsedBlocks.value[bi];
    if (!block) return "";
    return block.lines
      .filter((l) => l.type === "context" || l.type === "added")
      .map((l) => l.content)
      .join("\n");
  }

  async function toggleEdit(bi: number, filename: string): Promise<void> {
    if (editMode[bi]) {
      closeEdit(bi);
      return;
    }
    saveError[bi] = "";
    saveOk[bi] = false;

    if (taskId.value) {
      try {
        const data = await tryGetWorkspaceFile(taskId.value, filename);
        if (data) {
          editContent[bi] = typeof data.content === "string" ? data.content : "";
        } else {
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

  async function saveFile(bi: number, filename: string): Promise<void> {
    if (!taskId.value) return;
    saving[bi] = true;
    saveError[bi] = "";
    saveOk[bi] = false;
    try {
      await patchWorkspaceFile(taskId.value, filename, editContent[bi] ?? "");
      saveOk[bi] = true;
      setTimeout(() => {
        closeEdit(bi);
      }, 1200);
    } catch (e) {
      saveError[bi] =
        e instanceof ApiError
          ? e.body || `HTTP ${e.status}`
          : e instanceof Error
            ? e.message
            : String(e);
    } finally {
      saving[bi] = false;
    }
  }

  return {
    collapsed,
    editMode,
    editContent,
    saving,
    saveError,
    saveOk,
    parsedBlocks,
    toggleCollapse,
    toggleEdit,
    closeEdit,
    saveFile,
  };
}
