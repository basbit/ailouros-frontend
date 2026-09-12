import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import RemoteApiProfiles from "./RemoteApiProfiles.vue";
import type { RemoteProfileRow } from "@/entities/project";
import type { ProviderBalance } from "./provider-balance-api";

const balanceApi = vi.hoisted(() => ({
  fetchProviderBalance:
    vi.fn<(profile: RemoteProfileRow) => Promise<ProviderBalance>>(),
}));

vi.mock("@/features/remote-api/provider-balance-api", () => balanceApi);

const OPENROUTER_KEY = "sk-or-v1-super-secret-should-never-render";
const GOOGLE_KEY = "aiza-super-secret-should-never-render";

const profiles: RemoteProfileRow[] = [
  {
    id: "or1",
    provider: "openrouter",
    api_key: OPENROUTER_KEY,
    base_url: "https://openrouter.ai/api/v1",
  },
  {
    id: "gem1",
    provider: "google",
    api_key: GOOGLE_KEY,
    base_url: "https://generativelanguage.googleapis.com/v1beta/openai/",
  },
];

function mockBalanceForProfile(profile: RemoteProfileRow): Promise<ProviderBalance> {
  if (profile.provider === "openrouter") {
    return Promise.resolve({
      status: "ok",
      limit_remaining: 4.2,
      usage: 0.8,
      is_free_tier: false,
    });
  }
  return Promise.resolve({
    status: "unknown",
    limit_remaining: null,
    usage: null,
    is_free_tier: null,
  });
}

function balanceCells(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll(".rprof-balance").map((cell) => cell.text());
}

describe("RemoteApiProfiles — balance column", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "ru");
    setActivePinia(createPinia());
    balanceApi.fetchProviderBalance.mockReset();
    balanceApi.fetchProviderBalance.mockImplementation(mockBalanceForProfile);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders the openrouter limit and the gemini fallback label on mount", async () => {
    const wrapper = mount(RemoteApiProfiles, { props: { profiles } });
    await flushPromises();

    expect(wrapper.text()).toContain("4.2");
    expect(wrapper.text()).toContain("по факту");
  });

  it("re-fetches every profile's balance when the refresh action is clicked", async () => {
    const wrapper = mount(RemoteApiProfiles, { props: { profiles } });
    await flushPromises();
    balanceApi.fetchProviderBalance.mockClear();

    const refreshButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "Обновить лимиты");
    expect(refreshButton).toBeTruthy();
    await refreshButton!.trigger("click");
    await flushPromises();

    expect(balanceApi.fetchProviderBalance).toHaveBeenCalledTimes(2);
  });

  it("renders the balanceUnknown label for status ok with a null limit_remaining", async () => {
    balanceApi.fetchProviderBalance.mockImplementation(() =>
      Promise.resolve({
        status: "ok",
        limit_remaining: null,
        usage: null,
        is_free_tier: null,
      }),
    );

    const wrapper = mount(RemoteApiProfiles, { props: { profiles } });
    await flushPromises();

    for (const cell of balanceCells(wrapper)) {
      expect(cell).toBe("по факту");
      expect(cell).not.toBe("—");
    }
  });

  it("keeps each remaining row's own balance after a middle profile is removed", async () => {
    const third: RemoteProfileRow = {
      id: "grok1",
      provider: "openrouter",
      api_key: "sk-or-v1-third-secret",
      base_url: "https://openrouter.ai/api/v1",
    };
    const threeProfiles = [profiles[0]!, profiles[1]!, third];
    balanceApi.fetchProviderBalance.mockImplementation((profile) => {
      if (profile.id === "or1") {
        return Promise.resolve({
          status: "ok",
          limit_remaining: 4.2,
          usage: 0.8,
          is_free_tier: false,
        });
      }
      if (profile.id === "gem1") {
        return Promise.resolve({
          status: "unknown",
          limit_remaining: null,
          usage: null,
          is_free_tier: null,
        });
      }
      return Promise.resolve({
        status: "ok",
        limit_remaining: 9.9,
        usage: 0.1,
        is_free_tier: false,
      });
    });

    const wrapper = mount(RemoteApiProfiles, { props: { profiles: threeProfiles } });
    await flushPromises();
    expect(balanceCells(wrapper)).toEqual(["4.2", "по факту", "9.9"]);

    // Remove the middle row (gem1) — the remaining rows (or1, grok1) must
    // keep displaying THEIR OWN balances, not shift into each other's slot.
    const remaining = [threeProfiles[0]!, threeProfiles[2]!];
    await wrapper.setProps({ profiles: remaining });
    await flushPromises();

    expect(balanceCells(wrapper)).toEqual(["4.2", "9.9"]);
  });

  it("never renders or logs the api_key while showing balances", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const wrapper = mount(RemoteApiProfiles, { props: { profiles } });
    await flushPromises();

    // `.text()` is the visible textContent — the balance cells (and every
    // other label) must never interpolate the raw key into it. The api_key
    // input itself is a deliberate, masked `type="password"` editable field
    // and is out of scope here.
    expect(wrapper.text()).not.toContain(OPENROUTER_KEY);
    expect(wrapper.text()).not.toContain(GOOGLE_KEY);

    for (const spy of [logSpy, warnSpy, errorSpy]) {
      for (const call of spy.mock.calls) {
        const serialized = call.map((arg) => String(arg)).join(" ");
        expect(serialized).not.toContain(OPENROUTER_KEY);
        expect(serialized).not.toContain(GOOGLE_KEY);
      }
    }

    logSpy.mockRestore();
    warnSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
