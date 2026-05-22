import { inject, type InjectionKey } from "vue";
import type { useSwarmRunController } from "./useSwarmRunController";

export type SwarmRunController = ReturnType<typeof useSwarmRunController>;

export const SWARM_RUN_CONTROLLER_KEY: InjectionKey<SwarmRunController> =
  Symbol("swarmRunController");

export function useInjectedSwarmRunController(): SwarmRunController {
  const controller = inject(SWARM_RUN_CONTROLLER_KEY);
  if (!controller) {
    throw new Error("SWARM_RUN_CONTROLLER_KEY was not provided by the app bootstrap");
  }
  return controller;
}
