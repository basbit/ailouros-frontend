import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import { defineComponent, nextTick } from "vue";

import RunLiveDiagnostics from "./RunLiveDiagnostics.vue";

function stubReporting(visible: boolean) {
  return defineComponent({
    emits: ["visibility"],
    mounted() {
      this.$emit("visibility", visible);
    },
    template: "<div />",
  });
}

async function mountWith(planVisible: boolean, diagnosticsVisible: boolean) {
  const wrapper = mount(RunLiveDiagnostics, {
    props: { taskId: "task-1", workspaceRoot: "/tmp/work" },
    global: {
      stubs: {
        RunPlanCard: stubReporting(planVisible),
        RunDiagnosticsCard: stubReporting(diagnosticsVisible),
      },
    },
  });
  await nextTick();
  return wrapper;
}

function isHidden(wrapper: Awaited<ReturnType<typeof mountWith>>): boolean {
  return (wrapper.find("details").element as HTMLElement).style.display === "none";
}

describe("RunLiveDiagnostics wrapper", () => {
  it("hides the disclosure when both cards have nothing to show", async () => {
    expect(isHidden(await mountWith(false, false))).toBe(true);
  });

  it("shows the disclosure when the run plan has content", async () => {
    expect(isHidden(await mountWith(true, false))).toBe(false);
  });

  it("shows the disclosure when diagnostics have content", async () => {
    expect(isHidden(await mountWith(false, true))).toBe(false);
  });

  it("keeps the cards mounted while hidden so they can report content later", async () => {
    const wrapper = await mountWith(false, false);
    expect(wrapper.find("details").exists()).toBe(true);
  });
});
