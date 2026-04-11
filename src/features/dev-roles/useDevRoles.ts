import { ref } from "vue";
import type { DevRoleSnap } from "@/shared/store/projects";
import { defaultEnvironmentForRole } from "@/shared/lib/use-swarm-defaults";

export type { DevRoleSnap };

export function useDevRoles(onChangeCb: () => void) {
  const devRoles = ref<DevRoleSnap[]>([]);

  function add(prefill?: Partial<DevRoleSnap>): void {
    devRoles.value.push({
      name: prefill?.name ?? "",
      environment: prefill?.environment ?? defaultEnvironmentForRole(),
      model: prefill?.model ?? "",
      prompt_path: prefill?.prompt_path ?? "",
      scope: prefill?.scope ?? "",
    });
    onChangeCb();
  }

  function remove(idx: number): void {
    devRoles.value.splice(idx, 1);
    onChangeCb();
  }

  function update(idx: number, field: keyof DevRoleSnap, value: string): void {
    const r = devRoles.value[idx];
    if (r) (r as Record<string, string | undefined>)[field] = value;
    onChangeCb();
  }

  function applySnap(list: DevRoleSnap[]): void {
    devRoles.value = Array.isArray(list) ? list.map((r) => ({ ...r })) : [];
  }

  function collectSnap(): DevRoleSnap[] {
    return devRoles.value.filter((r) => r.name.trim());
  }

  function collectForApi(): DevRoleSnap[] {
    return devRoles.value
      .filter((r) => r.name.trim())
      .map((r) => {
        const e: DevRoleSnap = { name: r.name, environment: r.environment };
        if (r.model) e.model = r.model;
        if (r.prompt_path) e.prompt_path = r.prompt_path;
        if (r.scope) e.scope = r.scope;
        return e;
      });
  }

  return { devRoles, add, remove, update, applySnap, collectSnap, collectForApi };
}
