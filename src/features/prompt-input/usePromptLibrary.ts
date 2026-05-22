import { computed, ref } from "vue";
import { readTyped, writeTyped } from "@/shared/lib/storage-utils";
import { typedPromptLibrary } from "@/shared/lib/storage-keys";

export interface PromptEntry {
  id: string;
  title: string;
  body: string;
  tags: string[];
}

function normalizeEntries(raw: unknown): PromptEntry[] {
  if (!Array.isArray(raw)) return [];
  return raw
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
}

export function usePromptLibrary(currentProjectId: () => string) {
  const open = ref(false);
  const cached = ref<PromptEntry[]>([]);

  const entries = computed<PromptEntry[]>(() => cached.value);

  function reload(): void {
    const stored = readTyped(typedPromptLibrary<unknown[]>(currentProjectId(), []));
    cached.value = normalizeEntries(stored);
  }

  function persist(): void {
    writeTyped(typedPromptLibrary<PromptEntry[]>(currentProjectId(), []), cached.value);
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
