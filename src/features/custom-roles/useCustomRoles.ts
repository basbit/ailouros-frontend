import { ref } from "vue";
import type { CustomRoleSnap } from "@/shared/store/projects";
import { defaultEnvironmentForRole } from "@/shared/lib/use-swarm-defaults";

export type { CustomRoleSnap };

export function useCustomRoles(onChangeCb: () => void) {
  const customRoles = ref<CustomRoleSnap[]>([]);

  function add(prefill?: Partial<CustomRoleSnap>): void {
    customRoles.value.push({
      id: prefill?.id ?? "",
      label: prefill?.label ?? "",
      environment: prefill?.environment ?? defaultEnvironmentForRole(),
      model: prefill?.model ?? "",
      prompt_path: prefill?.prompt_path ?? "",
      prompt_text: prefill?.prompt_text ?? "",
      skill_ids: prefill?.skill_ids ?? "",
    });
    onChangeCb();
  }

  function remove(idx: number): void {
    customRoles.value.splice(idx, 1);
    onChangeCb();
  }

  function update(idx: number, field: keyof CustomRoleSnap, value: string): void {
    const r = customRoles.value[idx];
    if (r) (r as Record<string, string>)[field] = value;
    onChangeCb();
  }

  function applySnap(list: CustomRoleSnap[]): void {
    customRoles.value = Array.isArray(list) ? list.map((r) => ({ ...r })) : [];
  }

  function collectSnap(): CustomRoleSnap[] {
    return customRoles.value
      .map((r) => ({
        ...r,
        id: r.id
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, "_")
          .replace(/^_+|_+$/, ""),
      }))
      .filter((r) => r.id);
  }

  return { customRoles, add, remove, update, applySnap, collectSnap };
}
