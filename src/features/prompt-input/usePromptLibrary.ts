import { computed, ref } from "vue";

export interface PromptEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

const STORAGE_KEY_PREFIX = "ailouros.prompt-library.";

function makeStorageKey(projectId: string): string {
  return `${STORAGE_KEY_PREFIX}${projectId}`;
}

function safeParse(raw: string | null): PromptEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is Record<string, unknown> =>
          typeof item === "object" && item !== null,
      )
      .map((item) => ({
        id: String(item.id ?? ""),
        title: String(item.title ?? "").trim(),
        body: String(item.body ?? "").trim(),
        tags: Array.isArray(item.tags)
          ? ((item.tags as unknown[]).filter(
              (tag) => typeof tag === "string",
            ) as string[])
          : [],
      }))
      .filter((entry) => entry.id && entry.title && entry.body);
  } catch {
    return [];
  }
}

export function usePromptLibrary(currentProjectId: () => string) {
  const open = ref(false);
  const cached = ref<PromptEntry[]>([]);

  const entries = computed<PromptEntry[]>(() => cached.value);

  function reload(): void {
    if (typeof localStorage === "undefined") {
      cached.value = [];
      return;
    }
    cached.value = safeParse(localStorage.getItem(makeStorageKey(currentProjectId())));
  }

  function persist(): void {
    if (typeof localStorage === "undefined") return;
    try {
      localStorage.setItem(
        makeStorageKey(currentProjectId()),
        JSON.stringify(cached.value),
      );
    } catch {
      /* ignore quota */
    }
  }

  function openPanel(): void {
    reload();
    open.value = true;
  }

  function closePanel(): void {
    open.value = false;
  }

  function add(entry: Omit<PromptEntry, "id">): PromptEntry {
    reload();
    const id = `p${Date.now().toString(36)}`;
    const fresh: PromptEntry = {
      id,
      title: entry.title.trim() || entry.body.slice(0, 40),
      body: entry.body.trim(),
      tags: (entry.tags || []).map((tag) => tag.trim()).filter(Boolean),
    };
    cached.value = [fresh, ...cached.value].slice(0, 200);
    persist();
    return fresh;
  }

  function remove(id: string): void {
    cached.value = cached.value.filter((entry) => entry.id !== id);
    persist();
  }

  return {
    open,
    entries,
    openPanel,
    closePanel,
    add,
    remove,
    reload,
  };
}
