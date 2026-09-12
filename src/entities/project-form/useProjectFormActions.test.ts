import { beforeEach, describe, expect, it, vi } from "vitest";
import { createPinia, setActivePinia } from "pinia";

import { useProjectsStore } from "@/entities/project";
import {
  DEFAULT_PROJECT_FORM_VALUES,
  type ProjectFormValues,
} from "@/entities/project";
import type { AppSettingsContract } from "@/entities/app-settings/contract";
import { ApiError } from "@/shared/api/http";
import { useProjectFormActions } from "./useProjectFormActions";

vi.mock("@/shared/lib/i18n", () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));

const getDesktopInfoMock = vi.hoisted(() => vi.fn());
const initDesktopProjectMock = vi.hoisted(() => vi.fn());

vi.mock("@/shared/api/endpoints/desktop", () => ({
  getDesktopInfo: getDesktopInfoMock,
  initDesktopProject: initDesktopProjectMock,
}));

function buildSettings(): AppSettingsContract {
  const form = { ...DEFAULT_PROJECT_FORM_VALUES, workspace_context_mode: "full" };
  return {
    form,
    saveSettingsSoon: vi.fn(),
  } as unknown as AppSettingsContract;
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

describe("useProjectFormActions desktop-probe degradation", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  function buildCreateSettings(): AppSettingsContract {
    const form = { ...DEFAULT_PROJECT_FORM_VALUES };
    return {
      form,
      saveSettingsSoon: vi.fn(),
      newProject: vi.fn().mockResolvedValue("proj-new"),
      flushSaveAsync: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppSettingsContract;
  }

  it("still creates the project when the /v1/desktop/info probe fails", async () => {
    getDesktopInfoMock.mockRejectedValue(new ApiError("HTTP 500", 500));

    const settings = buildCreateSettings();
    const actions = useProjectFormActions(settings, {
      syncTaskFromServer: vi.fn(),
      sendWsSubscribe: vi.fn(),
    });

    actions.onNewProject();

    // The probe is an optional capability check: its failure must not escape to
    // the app-level ErrorBoundary and blank the whole UI.
    await expect(
      actions.onProjectFormSubmit({
        ...DEFAULT_PROJECT_FORM_VALUES,
        name: "Offline Project",
        workspace_root: "",
      }),
    ).resolves.toBeUndefined();

    expect(settings.newProject).toHaveBeenCalledWith("Offline Project");
    expect(settings.flushSaveAsync).toHaveBeenCalled();
    expect(settings.form.workspace_root).toBe("");
    expect(initDesktopProjectMock).not.toHaveBeenCalled();
  });

  it("keeps resolving the desktop workspace root when the probe succeeds", async () => {
    getDesktopInfoMock.mockResolvedValue({
      is_desktop: true,
      workspaces_dir: "/home/u/workspaces",
    });
    initDesktopProjectMock.mockResolvedValue({
      workspace_root: "/home/u/workspaces/proj-new",
    });

    const settings = buildCreateSettings();
    const actions = useProjectFormActions(settings, {
      syncTaskFromServer: vi.fn(),
      sendWsSubscribe: vi.fn(),
    });

    actions.onNewProject();
    await actions.onProjectFormSubmit({
      ...DEFAULT_PROJECT_FORM_VALUES,
      name: "Desktop Project",
      workspace_root: "",
    });

    expect(initDesktopProjectMock).toHaveBeenCalledWith("proj-new");
    expect(settings.form.workspace_root).toBe("/home/u/workspaces/proj-new");
  });
});
