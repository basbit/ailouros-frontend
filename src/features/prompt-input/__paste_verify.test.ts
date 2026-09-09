// TEMP scratch test — delete before commit. Kept only to pin the paste-path
// chip behaviour while the feature stabilises.
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.mock("@/shared/lib/i18n", () => ({ useI18n: () => ({ t: (k: string) => k }) }));
vi.mock("@/shared/api/endpoints/workspace", () => ({
  listWorkspaceFiles: vi.fn().mockResolvedValue({ files: [] }),
}));
const httpPostMock = vi.fn().mockResolvedValue({
  ok: true,
  absolute_path: "/ws/assets/pasted-1.png",
  relative_path: "assets/pasted-1.png",
});
vi.mock("@/shared/api/http", () => ({
  httpPost: (...a: unknown[]) => httpPostMock(...a),
}));

import PromptInput from "@/features/prompt-input/PromptInput.vue";

function pngFile(name = "paste.png"): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], name, {
    type: "image/png",
  });
}

describe("pasted-file chips (scratch)", () => {
  it("image-only paste renders the chip list", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });
    await wrapper.find("textarea").trigger("paste", {
      clipboardData: { files: [pngFile()] },
    });
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:imageAttachments")).toBeTruthy(),
    );
    const val = wrapper.emitted("update:imageAttachments")![0][0] as {
      name: string;
      path: string;
    }[];
    await wrapper.setProps({ imageAttachments: val });
    expect(wrapper.find(".attachments-list").exists()).toBe(true);
    expect(wrapper.findAll(".attachment-chip").length).toBe(1);
    expect(wrapper.findAll(".attachment-chip")[0].text()).toContain(val[0].name);
  });
});
