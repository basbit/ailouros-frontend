import type { GlobalSearchKeysState } from "./types";

/** Signed action links can be minted and opened: on, a secret, an https base URL. */
export function signedLinksReady(state: GlobalSearchKeysState): boolean {
  return (
    state.swarm_human_gate_enabled &&
    state.swarm_action_link_secret.trim() !== "" &&
    state.swarm_telegram_ingress_public_base_url.trim().toLowerCase().startsWith("https://")
  );
}
