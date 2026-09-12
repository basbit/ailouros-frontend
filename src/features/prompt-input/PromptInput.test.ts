import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

import PromptInput from "./PromptInput.vue";
import { sanitizeUploadName, timestampedName, looksLikeImage } from "./image-uploader";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

vi.mock("@/shared/api/endpoints/workspace", () => ({
  listWorkspaceFiles: vi.fn().mockResolvedValue({ files: [] }),
}));

vi.mock("@/shared/api/endpoints/runtime", () => ({
  getRuntimeCapabilities: vi
    .fn()
    .mockResolvedValue({ probes: [], ready: 0, total: 0, attachment_max_chars: 20 }),
}));

const httpPostMock = vi.fn();

vi.mock("@/shared/api/http", () => ({
  ApiError: class ApiError extends Error {
    constructor(
      message: string,
      readonly status: number,
      readonly body?: string,
    ) {
      super(message);
      this.name = "ApiError";
    }
  },
  httpPost: (...args: unknown[]) => httpPostMock(...args),
}));

function pngFile(name = "shot.png"): File {
  return new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x00, 0xff])], name, {
    type: "image/png",
  });
}

function textFile(name = "note.txt"): File {
  return new File(["hello world"], name, { type: "text/plain" });
}

describe("PromptInput attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the attach chip list for supplied attachments", () => {
    const wrapper = mount(PromptInput, {
      props: {
        modelValue: "task",
        attachments: [{ name: "spec.md", content: "## spec" }],
      },
    });
    const chips = wrapper.findAll(".attachment-chip");
    expect(chips.length).toBe(1);
    expect(chips[0].text()).toContain("spec.md");
  });

  it("emits updated attachments when a chip is removed", async () => {
    const wrapper = mount(PromptInput, {
      props: {
        modelValue: "task",
        attachments: [
          { name: "a.md", content: "A" },
          { name: "b.txt", content: "B" },
        ],
      },
    });
    await wrapper.find(".attachment-chip__remove").trigger("click");
    const emitted = wrapper.emitted("update:attachments");
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toEqual([{ name: "b.txt", content: "B" }]);
  });

  it("reads picked files and emits attachments via file.text()", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    const file = new File(["hello world"], "note.txt", { type: "text/plain" });
    const inputEl = wrapper.find<HTMLInputElement>(".prompt-input-file");
    Object.defineProperty(inputEl.element, "files", {
      value: [file],
      configurable: true,
    });
    await inputEl.trigger("change");

    // emitted() returns a snapshot: it has to be re-read inside waitFor, or
    // the assertion polls a value captured before the async read finished.
    await vi.waitFor(() => expect(wrapper.emitted("update:attachments")).toBeTruthy());
    const value = wrapper.emitted("update:attachments")![0][0] as {
      name: string;
      content: string;
    }[];
    expect(value).toEqual([{ name: "note.txt", content: "hello world" }]);
  });

  it("refuses a binary file out loud and attaches nothing", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    const inputEl = wrapper.find<HTMLInputElement>(".prompt-input-file");
    Object.defineProperty(inputEl.element, "files", {
      value: [pngFile()],
      configurable: true,
    });
    await inputEl.trigger("change");

    // A PNG now routes to the workspace uploader instead of the binary
    // refusal: with no workspace root set, the image path says so out loud.
    await vi.waitFor(() =>
      expect(wrapper.find(".attachment-notice").exists()).toBe(true),
    );
    expect(wrapper.find(".attachment-notice").text()).toContain(
      "prompt.attach.image.noWorkspace",
    );
    expect(wrapper.emitted("update:attachments")).toBeFalsy();
  });
});

describe("PromptInput image attachments", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    httpPostMock.mockReset();
  });

  it("uploads pasted images and emits image attachments with the absolute path", async () => {
    httpPostMock.mockResolvedValue({
      ok: true,
      absolute_path: "/ws/assets/shot-1730000000000.png",
      relative_path: "assets/shot-1730000000000.png",
    });
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });

    await wrapper
      .find("textarea")
      .trigger("paste", { clipboardData: { files: [pngFile()] } });

    await vi.waitFor(() =>
      expect(wrapper.emitted("update:imageAttachments")).toBeTruthy(),
    );
    expect(httpPostMock).toHaveBeenCalledTimes(1);
    const [path, form] = httpPostMock.mock.calls[0] as [string, FormData];
    expect(path).toBe("/v1/assets/upload");
    expect(form.get("workspace_root")).toBe("/ws");
    // rename_to is whitespace-free and unique per batch (timestamped), so a
    // repeated paste of the same buffer name cannot overwrite the first file.
    const renameTo = String(form.get("rename_to"));
    expect(renameTo).not.toContain(" ");
    expect(renameTo.startsWith("shot-")).toBe(true);
    expect(renameTo.endsWith(".png")).toBe(true);
    const value = wrapper.emitted("update:imageAttachments")![0][0] as {
      name: string;
      path: string;
    }[];
    expect(value).toEqual([
      { name: renameTo, path: "/ws/assets/shot-1730000000000.png" },
    ]);
  });

  it("sanitizes whitespace in pasted screenshot names (pm_vision tokenises on spaces)", async () => {
    httpPostMock.mockResolvedValue({ ok: true, absolute_path: "/ws/assets/x.png" });
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });

    await wrapper.find("textarea").trigger("paste", {
      clipboardData: { files: [pngFile("Screenshot 2026-08-31 at 10.00.00 .png")] },
    });

    await vi.waitFor(() => expect(httpPostMock).toHaveBeenCalled());
    const form = httpPostMock.mock.calls[0][1] as FormData;
    const renameTo = String(form.get("rename_to"));
    expect(renameTo).not.toContain(" ");
    expect(renameTo.startsWith("Screenshot-")).toBe(true);
    expect(renameTo.endsWith(".png")).toBe(true);
  });

  it("reports an upload failure out loud and attaches nothing", async () => {
    httpPostMock.mockRejectedValue(new Error("HTTP 413"));
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });

    await wrapper
      .find("textarea")
      .trigger("paste", { clipboardData: { files: [pngFile()] } });

    await vi.waitFor(() =>
      expect(wrapper.find(".attachment-notice").exists()).toBe(true),
    );
    expect(wrapper.find(".attachment-notice").text()).toContain(
      "prompt.attach.image.failed",
    );
    expect(wrapper.emitted("update:imageAttachments")).toBeFalsy();
  });

  it("does not upload duplicate names twice in one session", async () => {
    httpPostMock.mockResolvedValue({
      ok: true,
      absolute_path: "/ws/assets/image-1.png",
    });
    const wrapper = mount(PromptInput, {
      props: {
        modelValue: "task",
        workspaceRoot: "/ws",
        imageAttachments: [{ name: "image.png", path: "/ws/assets/image.png" }],
      },
    });

    await wrapper
      .find("textarea")
      .trigger("paste", { clipboardData: { files: [pngFile("image.png")] } });

    await vi.waitFor(() => expect(httpPostMock).toHaveBeenCalled());
    const form = httpPostMock.mock.calls[0][1] as FormData;
    // The taken name is claimed by the existing chip, so the uploader shifts
    // to a free name instead of overwriting the file on disk.
    expect(String(form.get("rename_to"))).not.toBe("image.png");
  });

  it("keeps a plain text paste untouched", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });
    await wrapper.find("textarea").trigger("paste", { clipboardData: { files: [] } });
    expect(httpPostMock).not.toHaveBeenCalled();
    expect(wrapper.emitted("update:modelValue")).toBeFalsy();
  });

  it("shows the chip list for an image-only paste (no text attachments)", async () => {
    httpPostMock.mockResolvedValue({
      ok: true,
      absolute_path: "/ws/assets/pasted-1.png",
      relative_path: "assets/pasted-1.png",
    });
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });

    await wrapper.find("textarea").trigger("paste", {
      clipboardData: { files: [pngFile()] },
    });
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:imageAttachments")).toBeTruthy(),
    );
    const value = wrapper.emitted("update:imageAttachments")![0][0] as {
      name: string;
      path: string;
    }[];
    // Parent wires the emitted array back into the prop.
    await wrapper.setProps({ imageAttachments: value });

    expect(wrapper.find(".attachments-list").exists()).toBe(true);
    const chips = wrapper.findAll(".attachment-chip");
    expect(chips.length).toBe(1);
    expect(chips[0].text()).toContain(value[0].name);
  });

  it("shows the chip list for an image picked via the file dialog", async () => {
    httpPostMock.mockResolvedValue({
      ok: true,
      absolute_path: "/ws/assets/shot.png",
      relative_path: "assets/shot.png",
    });
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", workspaceRoot: "/ws" },
    });

    const inputEl = wrapper.find<HTMLInputElement>(".prompt-input-file");
    Object.defineProperty(inputEl.element, "files", {
      value: [pngFile("shot.png")],
      configurable: true,
    });
    await inputEl.trigger("change");
    await vi.waitFor(() =>
      expect(wrapper.emitted("update:imageAttachments")).toBeTruthy(),
    );
    const value = wrapper.emitted("update:imageAttachments")![0][0] as {
      name: string;
      path: string;
    }[];
    await wrapper.setProps({ imageAttachments: value });

    expect(wrapper.findAll(".attachment-chip").length).toBe(1);
    expect(wrapper.findAll(".attachment-chip")[0].text()).toContain(value[0].name);
  });

  it("renders and removes image chips", async () => {
    const wrapper = mount(PromptInput, {
      props: {
        modelValue: "task",
        attachments: [{ name: "a.md", content: "A" }],
        imageAttachments: [
          { name: "shot.png", path: "/ws/assets/shot.png" },
          { name: "shot-2.png", path: "/ws/assets/shot-2.png" },
        ],
      },
    });
    const chips = wrapper.findAll(".attachment-chip");
    expect(chips.length).toBe(3);
    expect(chips[1].text()).toContain("shot.png");

    await chips[1].find(".attachment-chip__remove").trigger("click");
    const emitted = wrapper.emitted("update:imageAttachments");
    expect(emitted).toBeTruthy();
    expect(emitted![0][0]).toEqual([
      { name: "shot-2.png", path: "/ws/assets/shot-2.png" },
    ]);
    // The text chip's removal is untouched by the image path.
    expect(wrapper.emitted("update:attachments")).toBeFalsy();
  });
});

describe("image name helpers", () => {
  it("sanitizeUploadName strips spaces and unsafe characters", () => {
    expect(sanitizeUploadName("Screenshot 2026-08-31 at 10.00.00 .png")).toBe(
      "Screenshot-2026-08-31-at-10.00.00-.png",
    );
    expect(sanitizeUploadName("скрин.png")).toBe("image.png");
    expect(sanitizeUploadName("no extension")).toBe("no-extension.png");
  });

  it("sanitizeUploadName keeps the original suffix when it is an image type", () => {
    expect(sanitizeUploadName("pic.JPEG")).toBe("pic.jpeg");
    expect(sanitizeUploadName("my photo.webp")).toBe("my-photo.webp");
  });

  it("timestampedName appends a stamp before the suffix", () => {
    expect(timestampedName("shot.png", 1730000000000)).toBe("shot-1730000000000.png");
    expect(timestampedName("shot", 7)).toBe("shot-7");
  });

  it("looksLikeImage accepts image mime types and known suffixes only", () => {
    expect(looksLikeImage(pngFile())).toBe(true);
    expect(looksLikeImage(new File(["a"], "x.webp", { type: "" }))).toBe(true);
    expect(looksLikeImage(textFile())).toBe(false);
  });
});

describe("PromptInput drag and drop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("attaches a dropped text file", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    await flushPromises();

    await wrapper.find(".prompt-input-wrap").trigger("drop", {
      dataTransfer: { files: [textFile("dropped.txt")] },
    });
    await flushPromises();

    const emitted = wrapper.emitted("update:attachments");
    expect(emitted).toBeTruthy();
    expect((emitted?.at(-1)?.[0] as { name: string }[]).map((a) => a.name)).toEqual([
      "dropped.txt",
    ]);
  });

  it("shows the drop affordance only while dragging over", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    const wrap = wrapper.find(".prompt-input-wrap");

    expect(wrapper.find(".prompt-input-drop").exists()).toBe(false);
    await wrap.trigger("dragover");
    expect(wrapper.find(".prompt-input-drop").exists()).toBe(true);
    await wrap.trigger("dragleave");
    expect(wrapper.find(".prompt-input-drop").exists()).toBe(false);
  });

  it("refuses a dropped file over the backend limit and says so", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    await flushPromises();

    const big = new File(["x".repeat(50)], "big.txt", { type: "text/plain" });
    await wrapper.find(".prompt-input-wrap").trigger("drop", {
      dataTransfer: { files: [big] },
    });
    await flushPromises();

    expect(wrapper.emitted("update:attachments")).toBeFalsy();
    expect(wrapper.find(".attachment-notice").text()).toContain(
      "prompt.attach.rejected.too_large",
    );
  });

  it("shows the limit before anything is attached", async () => {
    const wrapper = mount(PromptInput, {
      props: { modelValue: "task", attachments: [] },
    });
    await flushPromises();

    expect(wrapper.find(".attachment-limit-hint").exists()).toBe(true);
  });
});
