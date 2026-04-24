import { ref, readonly } from "vue";
import {
  listPrompts,
  listSkills,
  type PromptChoice,
  type SkillChoice,
} from "@/shared/api/endpoints/catalog";

const _prompts = ref<PromptChoice[]>([]);
let _promptsLoaded = false;
let _promptsLoading: Promise<void> | null = null;

const _skills = ref<SkillChoice[]>([]);
let _skillsWorkspace = "";
let _skillsLoading: Promise<void> | null = null;

export async function ensurePromptsLoaded(force = false): Promise<void> {
  if (_promptsLoaded && !force) return;
  if (_promptsLoading) return _promptsLoading;
  _promptsLoading = (async () => {
    try {
      _prompts.value = await listPrompts();
      _promptsLoaded = true;
    } catch {
      _prompts.value = [];
    } finally {
      _promptsLoading = null;
    }
  })();
  return _promptsLoading;
}

export async function ensureSkillsLoaded(
  workspaceRoot: string,
  force = false,
): Promise<void> {
  const ws = (workspaceRoot || "").trim();
  if (
    !force &&
    _skillsWorkspace === ws &&
    _skills.value.length >= 0 &&
    _skillsLoading === null
  ) {
    // Already loaded (possibly with 0 results) for this workspace.
    if (_skillsWorkspace === ws) return;
  }
  if (_skillsLoading) return _skillsLoading;
  _skillsLoading = (async () => {
    try {
      _skills.value = await listSkills(ws);
      _skillsWorkspace = ws;
    } catch {
      _skills.value = [];
      _skillsWorkspace = ws;
    } finally {
      _skillsLoading = null;
    }
  })();
  return _skillsLoading;
}

export function usePromptsCatalog() {
  void ensurePromptsLoaded();
  return { prompts: readonly(_prompts) };
}

export function useWorkspaceSkills(workspaceRoot: () => string) {
  void ensureSkillsLoaded(workspaceRoot());
  return {
    skills: readonly(_skills),
    reload: (force = true) => ensureSkillsLoaded(workspaceRoot(), force),
  };
}
