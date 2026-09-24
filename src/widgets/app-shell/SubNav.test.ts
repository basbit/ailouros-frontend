/**
 * Each pane button's accessible name is its visible label: nothing in the
 * button is aria-hidden and no empty-named button reaches the tree.
 */
import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SubNav from "./SubNav.vue";

describe("SubNav accessibility", () => {
  it("every pane button is named by its label text", () => {
    const wrapper = mount(SubNav, {
      props: {
        entries: [
          { key: "api-keys", label: "API keys" },
          { key: "about", label: "About", hint: "v3" },
        ],
        active: "about",
        label: "Settings",
      },
    });

    const buttons = wrapper.findAll("button");
    expect(buttons.map((b) => b.text())).toEqual(["API keys", "About v3"]);
    for (const button of buttons) {
      expect(button.text().trim()).not.toBe("");
      expect(button.find("[aria-hidden='true']").exists()).toBe(false);
    }
    expect(wrapper.get("nav").attributes("aria-label")).toBe("Settings");
  });
});
