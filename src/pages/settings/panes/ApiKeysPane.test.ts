import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick, reactive, ref } from "vue";

import ApiKeysPane from "./ApiKeysPane.vue";
import { APP_SETTINGS_KEY } from "@/entities/app-settings/contract";
import { GLOBAL_SETTINGS_KEY } from "@/features/global-settings/globalSettingsContext";
import type { RemoteProfileRow } from "@/entities/project";

function makeSettingsStub() {
  const profiles = ref<RemoteProfileRow[]>([
    { id: "", provider: "openai", api_key: "", base_url: "" },
  ]);
  return {
    profilesState: {
      profiles,
      // Mirror the real updateProfile: mutate the row in place.
      updateProfile: (i: number, field: keyof RemoteProfileRow, val: string) => {
        (profiles.value[i] as Record<string, string>)[field] = val;
      },
      addProfile: () => {},
      removeProfile: () => {},
    },
    rolesState: { refreshAllProfileSelects: () => {} },
  };
}

function makeGlobalStub() {
  return {
    state: reactive({
      tavily_api_key: "",
      exa_api_key: "",
      scrapingdog_api_key: "",
      github_token: "",
    }),
    setKey: () => {},
  };
}

function mountPane() {
  return mount(ApiKeysPane, {
    attachTo: document.body,
    global: {
      provide: {
        [APP_SETTINGS_KEY as symbol]: makeSettingsStub(),
        [GLOBAL_SETTINGS_KEY as symbol]: makeGlobalStub(),
      },
    },
  });
}

describe("ApiKeysPane", () => {
  it("keeps focus on the provider id input while typing its name", async () => {
    const wrapper = mountPane();
    const row = wrapper.get(".api-keys-pane__row");
    const idInput = row.findAll("input.api-keys-pane__input")[0]
      .element as HTMLInputElement;

    idInput.focus();
    expect(document.activeElement).toBe(idInput);

    // Type one character into the id field.
    idInput.value = "g";
    await row.findAll("input.api-keys-pane__input")[0].trigger("input");
    await nextTick();

    const idInputAfter = wrapper
      .get(".api-keys-pane__row")
      .findAll("input.api-keys-pane__input")[0].element as HTMLInputElement;

    // The row must not be re-keyed/remounted on each keystroke.
    expect(idInputAfter).toBe(idInput);
    expect(document.activeElement).toBe(idInputAfter);

    wrapper.unmount();
  });
});

describe("ApiKeysPane backend API token", () => {
  it("persists what the operator types so authenticated deployments are reachable", async () => {
    const { API_TOKEN_STORAGE_KEY, getApiToken, clearApiToken } = await import(
      "@/shared/api/token"
    );
    clearApiToken();

    const wrapper = mountPane();
    const field = wrapper.find('[data-testid="backend-api-token"]');
    expect(field.exists()).toBe(true);

    await field.setValue("s3cret-token");
    await nextTick();

    expect(localStorage.getItem(API_TOKEN_STORAGE_KEY)).toBe("s3cret-token");
    expect(getApiToken()).toBe("s3cret-token");

    await field.setValue("");
    expect(localStorage.getItem(API_TOKEN_STORAGE_KEY)).toBeNull();

    clearApiToken();
  });

  it("shows the token that is already stored", async () => {
    const { setApiToken, clearApiToken } = await import("@/shared/api/token");
    setApiToken("existing-token");

    const wrapper = mountPane();
    const field = wrapper.find('[data-testid="backend-api-token"]');
    expect((field.element as HTMLInputElement).value).toBe("existing-token");

    clearApiToken();
  });
});
