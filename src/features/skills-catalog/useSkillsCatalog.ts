import { ref } from "vue";
import type { SkillCatalogSnap } from "@/shared/store/projects";

export type { SkillCatalogSnap };

export function useSkillsCatalog(onChangeCb: () => void) {
  const skills = ref<SkillCatalogSnap[]>([]);

  function add(prefill?: Partial<SkillCatalogSnap>): void {
    skills.value.push({
      id: prefill?.id ?? "",
      title: prefill?.title ?? "",
      path: prefill?.path ?? "",
    });
    onChangeCb();
  }

  function remove(idx: number): void {
    skills.value.splice(idx, 1);
    onChangeCb();
  }

  function update(idx: number, field: keyof SkillCatalogSnap, value: string): void {
    const skill = skills.value[idx];
    if (skill) (skill as Record<string, string>)[field] = value;
    onChangeCb();
  }

  function applySnap(list: SkillCatalogSnap[]): void {
    skills.value = Array.isArray(list) ? list.map((skill) => ({ ...skill })) : [];
  }

  function collectSnap(): SkillCatalogSnap[] {
    return skills.value.filter((skill) => {
      const id = skill.id
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/, "")
        .slice(0, 64);
      return id && /^[a-z][a-z0-9_-]{0,63}$/.test(id);
    });
  }

  function collectForApi(): Record<string, { path: string; title?: string }> {
    const out: Record<string, { path: string; title?: string }> = {};
    for (const skill of skills.value) {
      const id = skill.id
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/, "")
        .slice(0, 64);
      if (!id || !/^[a-z][a-z0-9_-]{0,63}$/.test(id)) continue;
      const path = skill.path.trim();
      if (!path) continue;
      const entry: { path: string; title?: string } = { path };
      const title = skill.title.trim();
      if (title) entry.title = title;
      out[id] = entry;
    }
    return out;
  }

  return { skills, add, remove, update, applySnap, collectSnap, collectForApi };
}
