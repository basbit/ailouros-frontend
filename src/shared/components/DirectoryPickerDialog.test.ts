import { afterEach, describe, expect, it, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import DirectoryPickerDialog from "./DirectoryPickerDialog.vue";
import type { DirectoryListing } from "@/shared/api/endpoints/filesystem";

const fsApi = vi.hoisted(() => ({
  listDirectories: vi.fn<(path: string) => Promise<DirectoryListing>>(),
}));

vi.mock("@/shared/api/endpoints/filesystem", () => fsApi);

function listing(path: string, entries: string[]): DirectoryListing {
  return {
    path,
    parent: path === "/root" ? null : "/root",
    entries: entries.map((name) => ({ name, path: `${path}/${name}` })),
  };
}

afterEach(() => {
  fsApi.listDirectories.mockReset();
});

describe("DirectoryPickerDialog", () => {
  it("loads the start path and lists sub-folders on open", async () => {
    fsApi.listDirectories.mockResolvedValue(listing("/root", ["alpha", "beta"]));
    const wrapper = mount(DirectoryPickerDialog, {
      props: { visible: true, startPath: "/root" },
    });
    await flushPromises();

    expect(fsApi.listDirectories).toHaveBeenCalledWith("/root");
    const names = wrapper.findAll(".dir-picker__item-btn").map((b) => b.text());
    expect(names).toEqual(["alpha", "beta"]);
  });

  it("navigates into a folder when its row is clicked", async () => {
    fsApi.listDirectories
      .mockResolvedValueOnce(listing("/root", ["alpha"]))
      .mockResolvedValueOnce(listing("/root/alpha", ["nested"]));
    const wrapper = mount(DirectoryPickerDialog, {
      props: { visible: true, startPath: "/root" },
    });
    await flushPromises();

    await wrapper.find(".dir-picker__item-btn").trigger("click");
    await flushPromises();

    expect(fsApi.listDirectories).toHaveBeenLastCalledWith("/root/alpha");
    expect(wrapper.find(".dir-picker__path").text()).toBe("/root/alpha");
  });

  it("emits the current path when 'select' is confirmed", async () => {
    fsApi.listDirectories.mockResolvedValue(listing("/root/alpha", []));
    const wrapper = mount(DirectoryPickerDialog, {
      props: { visible: true, startPath: "/root/alpha" },
    });
    await flushPromises();

    await wrapper.find(".dir-picker__confirm").trigger("click");
    expect(wrapper.emitted("select")?.[0]).toEqual(["/root/alpha"]);
  });

  it("shows an error message when the listing fails", async () => {
    fsApi.listDirectories.mockRejectedValue(new Error("boom"));
    const wrapper = mount(DirectoryPickerDialog, {
      props: { visible: true, startPath: "/nope" },
    });
    await flushPromises();

    expect(wrapper.find(".dir-picker__error").exists()).toBe(true);
  });
});
