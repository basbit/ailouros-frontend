import { httpPost } from "@/shared/api/http";
import type { RemoteProfileRow } from "@/entities/project";

type ProviderBalanceStatus = "ok" | "unknown" | "error";

export interface ProviderBalance {
  status: ProviderBalanceStatus;
  limit_remaining: number | null;
  usage: number | null;
  is_free_tier: boolean | null;
}

function errorBalance(): ProviderBalance {
  return { status: "error", limit_remaining: null, usage: null, is_free_tier: null };
}

// The backend always answers 200 with a status field (openrouter only ever
// returns "ok"; other providers answer "unknown"). A caught exception here
// means the request itself failed (network/timeout), which the UI must
// still render as a status rather than crash on.
export async function fetchProviderBalance(
  profile: Pick<RemoteProfileRow, "provider" | "base_url" | "api_key">,
): Promise<ProviderBalance> {
  try {
    return await httpPost<ProviderBalance>("/v1/ui/provider-balance", {
      provider: profile.provider,
      base_url: profile.base_url,
      api_key: profile.api_key,
    });
  } catch {
    return errorBalance();
  }
}
