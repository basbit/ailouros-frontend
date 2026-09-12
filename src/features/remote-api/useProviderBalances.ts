import { ref } from "vue";
import type { RemoteProfileRow } from "@/entities/project";
import { fetchProviderBalance, type ProviderBalance } from "./provider-balance-api";

export interface ProviderBalanceEntry {
  loading: boolean;
  balance: ProviderBalance | null;
}

// Balances are keyed by the profile row's object identity rather than its
// array index or its `id` field: unsaved rows can share an empty `id`, and a
// positional array goes stale the instant a row is added, removed, or
// reordered (a later row would inherit an earlier neighbor's stale balance).
// Object identity survives reordering and removal because `useRemoteApiProfiles`
// mutates a row's fields in place and only ever adds/removes whole row objects.
export function useProviderBalances() {
  const entriesByProfile = ref(new Map<RemoteProfileRow, ProviderBalanceEntry>());

  async function refreshAll(profiles: RemoteProfileRow[]): Promise<void> {
    const loadingEntries = new Map<RemoteProfileRow, ProviderBalanceEntry>();
    for (const profile of profiles) {
      loadingEntries.set(profile, { loading: true, balance: null });
    }
    entriesByProfile.value = loadingEntries;

    const results = await Promise.all(
      profiles.map((profile) => fetchProviderBalance(profile)),
    );

    const resolvedEntries = new Map<RemoteProfileRow, ProviderBalanceEntry>();
    profiles.forEach((profile, i) => {
      resolvedEntries.set(profile, { loading: false, balance: results[i]! });
    });
    entriesByProfile.value = resolvedEntries;
  }

  function entryFor(
    profile: RemoteProfileRow | undefined,
  ): ProviderBalanceEntry | undefined {
    return profile ? entriesByProfile.value.get(profile) : undefined;
  }

  function forget(profile: RemoteProfileRow | undefined): void {
    if (!profile || !entriesByProfile.value.has(profile)) return;
    const next = new Map(entriesByProfile.value);
    next.delete(profile);
    entriesByProfile.value = next;
  }

  return {
    refreshAll,
    entryFor,
    forget,
  };
}
