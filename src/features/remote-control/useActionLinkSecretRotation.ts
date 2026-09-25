import { ref } from "vue";
import { describeApiError } from "@/shared/api/api-error-detail";
import { rotateActionLinkSecret } from "@/shared/api/endpoints/remote-control";
import {
  flushGlobalSettingsSync,
  markSecretsSavedOnServer,
} from "@/shared/lib/global-search-keys";
import { generateSecretHex } from "@/shared/lib/secret-generation";

/**
 * Rotation happens on the server: the browser never sees the current secret,
 * so it sends only the new one and the server moves current → previous.
 */
export function useActionLinkSecretRotation() {
  const rotating = ref(false);
  const rotated = ref(false);
  const error = ref("");

  async function rotate(): Promise<void> {
    rotating.value = true;
    rotated.value = false;
    error.value = "";
    try {
      await flushGlobalSettingsSync();
      await rotateActionLinkSecret(generateSecretHex());
      markSecretsSavedOnServer(["swarm_action_link_secret", "swarm_action_link_secret_prev"]);
      rotated.value = true;
    } catch (err) {
      error.value = describeApiError(err);
    } finally {
      rotating.value = false;
    }
  }

  return { rotating, rotated, error, rotate };
}
