import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useProjectsStore } from "@/shared/store/projects";
import {
  DEFAULT_PROJECT_FORM_VALUES,
  type ProjectFormValues,
} from "@/entities/project";
import type { AppSettings } from "@/entities/app-settings/contract";
import { useProjectFormActions } from "./useProjectFormActions";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

function buildSettings(): AppSettings {
  const form = { ...DEFAULT_PROJECT_FORM_VALUES, workspace_context_mode: "full" };
  return {
    form,
    saveSettingsSoon: vi.fn(),
  } as unknown as AppSettings;
}

describe("useProjectFormActions ADVANCED_FORM_FIELDS connector", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("onProjectFormSubmit copies workspace_context_mode onto settings.form for the current project", async () => {
    const projectsStore = useProjectsStore();
    projectsStore.ensure();
    const projectId = projectsStore.currentId;

    const settings = buildSettings();
    const actions = useProjectFormActions(settings, {
      syncTaskFromServer: vi.fn(),
      sendWsSubscribe: vi.fn(),
    });

    actions.onEditProjectById(projectId);

    const submitted: ProjectFormValues = {
      ...DEFAULT_PROJECT_FORM_VALUES,
      name: "Renamed",
      workspace_context_mode: "tools_only",
    };

    await actions.onProjectFormSubmit(submitted);

    expect(settings.form.workspace_context_mode).toBe("tools_only");
  });
});
