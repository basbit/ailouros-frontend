import { beforeEach, describe, expect, it, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";

const getSpecList = vi.hoisted(() => vi.fn());
const getSpecInit = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/endpoints/spec", () => ({
  getSpecList,
  getSpecInit,
}));

import SpecListPanel from "@/widgets/spec-list-panel/SpecListPanel.vue";

describe("SpecListPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
    getSpecList.mockReset();
    getSpecInit.mockReset();
  });

  it("lists the fetched spec ids and emits selection", async () => {
    getSpecList.mockResolvedValue({ spec_ids: ["spec:auth", "spec:users"] });
    const wrapper = mount(SpecListPanel, { props: { workspaceRoot: "/ws" } });
    await flushPromises();
    expect(getSpecList).toHaveBeenCalledWith("/ws");
    expect(wrapper.text()).toContain("spec:auth");
    expect(wrapper.text()).toContain("spec:users");
    expect(wrapper.findAll(".spec-list-panel__item")).toHaveLength(2);

    await wrapper.find(".spec-list-panel__item").trigger("click");
    expect(wrapper.emitted("select")).toEqual([["spec:auth"]]);
  });

  it("shows the init button when no specs exist and bootstraps on click", async () => {
    getSpecList.mockResolvedValue({ spec_ids: [] });
    const wrapper = mount(SpecListPanel, { props: { workspaceRoot: "/ws" } });
    await flushPromises();
    expect(wrapper.text()).toContain("Init specs");

    getSpecList.mockResolvedValue({ spec_ids: ["spec:boot"] });
    await wrapper.find(".spec-list-panel__init").trigger("click");
    await flushPromises();
    expect(getSpecInit).toHaveBeenCalledWith({ workspace_root: "/ws" });
    expect(wrapper.text()).toContain("spec:boot");
  });

  it("does not call the list endpoint without a workspace", async () => {
    const wrapper = mount(SpecListPanel, { props: { workspaceRoot: "" } });
    await flushPromises();
    expect(getSpecList).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("no workspace_root");
  });
});
