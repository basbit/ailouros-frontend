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
    const s = skills.value[idx];
    if (s) (s as Record<string, string>)[field] = value;
    onChangeCb();
  }

  function applySnap(list: SkillCatalogSnap[]): void {
    skills.value = Array.isArray(list) ? list.map((s) => ({ ...s })) : [];
  }

  function collectSnap(): SkillCatalogSnap[] {
    return skills.value.filter((s) => {
      const id = s.id
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
    for (const s of skills.value) {
      const id = s.id
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_-]+/g, "_")
        .replace(/^_+|_+$/, "")
        .slice(0, 64);
      if (!id || !/^[a-z][a-z0-9_-]{0,63}$/.test(id)) continue;
      const path = s.path.trim();
      if (!path) continue;
      const ent: { path: string; title?: string } = { path };
      const t = s.title.trim();
      if (t) ent.title = t;
      out[id] = ent;
    }
    return out;
  }

  return { skills, add, remove, update, applySnap, collectSnap, collectForApi };
}
