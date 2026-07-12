import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import ProjectFormBasicSection from "../ProjectFormBasicSection.vue";
import { useProjectFormState } from "../useProjectFormState";
import { WORKSPACE_CONTEXT_MODES } from "@/shared/model/workspace-context-mode-types";

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("ailouros.locale", "en");
});

function mountSection(form: ReturnType<typeof useProjectFormState>["form"]) {
  return mount(ProjectFormBasicSection, {
    props: { form, capabilities: null, capsWarn: false },
  });
}

describe("ProjectFormBasicSection workspace_context_mode select", () => {
  it("offers exactly the backend's canonical workspace_context_mode options, defaulting to retrieve", () => {
    const { form } = useProjectFormState({
      open: ref(true),
      initial: ref(undefined),
      capabilities: ref(null),
    });
    const wrapper = mountSection(form);

    const select = wrapper.find("#pf-context-mode");
    const optionValues = select.findAll("option").map((o) => o.element.value);
    expect(optionValues).toEqual([...WORKSPACE_CONTEXT_MODES]);
    expect((select.element as HTMLSelectElement).value).toBe("retrieve");
  });

  it("round-trips the selected mode into the submitted project payload", async () => {
    const { form, buildSubmitPayload } = useProjectFormState({
      open: ref(true),
      initial: ref({ name: "demo-project" }),
      capabilities: ref(null),
    });
    const wrapper = mountSection(form);

    await wrapper.find("#pf-context-mode").setValue("tools_only");

    const emitted = wrapper.emitted("update:field");
    expect(emitted?.at(-1)).toEqual(["workspace_context_mode", "tools_only"]);

    // Mirror ProjectFormDialog's onFieldChange, which applies the emitted
    // field directly onto the reactive form before submit.
    form.workspace_context_mode = "tools_only";

    const payload = buildSubmitPayload();
    expect(payload?.workspace_context_mode).toBe("tools_only");
  });
});
