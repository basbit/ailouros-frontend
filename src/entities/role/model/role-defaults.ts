import { swarmDefaultsSnapshot } from "@/shared/lib/use-swarm-defaults";

export function defaultEnvironmentForRole(): string {
  return swarmDefaultsSnapshot().default_role_environment;
}

export function defaultModelForRole(roleId: string, environment: string): string {
  return swarmDefaultsSnapshot().model_defaults[roleId]?.[environment] ?? "";
}

export function defaultPromptPathForRole(roleId: string): string {
  return swarmDefaultsSnapshot().prompt_defaults[roleId] ?? "";
}

export function promptChoicesForRole(roleId: string): [string, string][] {
  return (swarmDefaultsSnapshot().prompt_choices[roleId] ?? []) as [string, string][];
}
