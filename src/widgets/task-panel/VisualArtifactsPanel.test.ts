import { beforeEach, describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import VisualArtifactsPanel from "@/widgets/task-panel/VisualArtifactsPanel.vue";

describe("VisualArtifactsPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem("ailouros.locale", "en");
    setActivePinia(createPinia());
  });

  it("renders visual evidence links and screenshots from the manifest", () => {
    const wrapper = mount(VisualArtifactsPanel, {
      props: {
        manifest: {
          status: "passed",
          summary: "2 pages checked",
          manifest_url: "/artifacts/visual/task-1/run-1/manifest.json",
          pages: [
            {
              page_path: "/",
              viewport: "desktop",
              har_url: "/artifacts/visual/task-1/run-1/desktop.har",
              trace_url: "/artifacts/visual/task-1/run-1/desktop-trace.zip",
              screenshot: {
                url: "/artifacts/visual/task-1/run-1/desktop.png",
              },
            },
          ],
        },
      },
      global: {
        plugins: [createPinia()],
      },
    });

    expect(wrapper.text()).toContain("Visual evidence");
    expect(wrapper.text()).toContain("2 pages checked");
    expect(wrapper.find(".visual-artifacts__status--passed").exists()).toBe(true);

    const links = wrapper
      .findAll("a")
      .map((link) => [link.text(), link.attributes("href")]);
    expect(links).toContainEqual([
      "Open manifest",
      "/artifacts/visual/task-1/run-1/manifest.json",
    ]);
    expect(links).toContainEqual([
      "desktop /",
      "/artifacts/visual/task-1/run-1/desktop.png",
    ]);
    expect(links).toContainEqual([
      "HAR desktop /",
      "/artifacts/visual/task-1/run-1/desktop.har",
    ]);
    expect(links).toContainEqual([
      "trace desktop /",
      "/artifacts/visual/task-1/run-1/desktop-trace.zip",
    ]);
    expect(wrapper.find("img").attributes("src")).toBe(
      "/artifacts/visual/task-1/run-1/desktop.png",
    );
  });

  it("keeps skipped status neutral instead of showing it as a failure", () => {
    const wrapper = mount(VisualArtifactsPanel, {
      props: {
        manifest: {
          status: "skipped",
          summary: "Visual probe disabled",
        },
      },
      global: {
        plugins: [createPinia()],
      },
    });

    const status = wrapper.find(".visual-artifacts__status");
    expect(status.exists()).toBe(true);
    expect(status.classes()).not.toContain("visual-artifacts__status--passed");
    expect(status.classes()).not.toContain("visual-artifacts__status--failed");
  });
});
