import { test, expect } from "@playwright/test";

test.describe("App smoke", () => {
  test("UI page loads", async ({ page }) => {
    await page.goto("/");
    // Check the main page title or a key element is visible
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });
  });

  test("API health check (backend-backed only)", async ({ request }) => {
    // Only meaningful when a real backend is reachable; skip in pure-frontend CI.
    test.skip(
      !process.env.SWARM_E2E_BACKEND,
      "requires a running backend (set SWARM_E2E_BACKEND=1)",
    );
    const resp = await request.get("/health");
    expect(resp.ok()).toBeTruthy();
  });

  test("project switcher creates a project, makes it current and switches back", async ({
    page,
  }) => {
    // The create-project flow asks the backend whether this is a desktop build
    // before it resolves a workspace root; stub it so the scenario exercises the
    // UI flow itself rather than the presence of a server (the sibling tests in
    // this file stub their backend calls the same way).
    await page.route("**/v1/desktop/info", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ is_desktop: false, workspaces_dir: "" }),
      });
    });

    await page.goto("/");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

    const trigger = page.getByTestId("project-switcher-trigger");
    const current = page.getByTestId("project-switcher-current");
    await expect(current).toHaveText("Default");

    await trigger.click();
    await page.getByTestId("project-switcher-new").click();

    const dialog = page.getByTestId("project-form-dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByTestId("project-form-name").fill("QA Sandbox");
    await dialog.getByTestId("project-form-submit").click();

    await expect(dialog).toBeHidden();
    await expect(current).toHaveText("QA Sandbox");

    // The new project is a real, switchable entry, not just a relabelled header.
    await trigger.click();
    const items = page.getByTestId("project-switcher-item");
    await expect(items).toHaveCount(2);
    await items.filter({ hasText: "Default" }).click();
    await expect(current).toHaveText("Default");

    // …and it survives a reload, which is what persistence of the project store means.
    await page.reload();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });
    await trigger.click();
    await expect(page.getByTestId("project-switcher-item")).toHaveCount(2);
  });

  test("terminal summary and graph failed-step status are rendered from persisted task state", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "swarm_ui_active_task_v1_default",
        JSON.stringify({ taskId: "task-terminal-1" }),
      );
    });

    await page.route("**/tasks/task-terminal-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "task-terminal-1",
          status: "failed",
          error: "spec_gate: ENOENT",
          agents: ["pm", "dev"],
          history: [
            { agent: "pm", message: "done", timestamp: "2026-04-09T10:00:00Z" },
            { agent: "dev", message: "failed", timestamp: "2026-04-09T10:02:00Z" },
          ],
        }),
      });
    });

    await page.route("**/artifacts/task-terminal-1/pipeline.json", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          pipeline_steps: ["pm", "dev", "qa"],
          failed_step: "qa",
        }),
      });
    });

    await page.goto("/#/legacy");

    await expect(page.locator(".status-line")).toContainText(/Failed|Ошибка/i);
    await expect(page.locator(".status-line")).toContainText("pipeline.json");
    // Step card renders as select in editor mode — check card presence and badge
    await expect(page.locator(".step-card--failed")).toBeVisible({ timeout: 8_000 });
    await expect(page.locator(".step-card--failed .badge-fail")).toBeVisible();
  });

  test("pipeline graph normalizes agent casing and marks completed steps while running", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "swarm_ui_active_task_v1_default",
        JSON.stringify({ taskId: "task-running-casing-1" }),
      );
    });

    await page.route("**/tasks/task-running-casing-1", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "task-running-casing-1",
          status: "running",
          agents: ["PM", "BA"],
          history: [
            {
              agent: "PM",
              message: "Plan the work breakdown",
              timestamp: "2026-04-13T10:01:54Z",
            },
            { agent: "BA", message: "ba started", timestamp: "2026-04-13T10:01:55Z" },
          ],
        }),
      });
    });

    await page.route(
      "**/artifacts/task-running-casing-1/pipeline.json",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pipeline_steps: ["clarify_input", "pm", "ba", "review_qa"],
          }),
        });
      },
    );

    await page.goto("/#/legacy");

    await expect(page.locator('.step-card[data-step-id="pm"]')).toHaveClass(
      /step-card--completed/,
      {
        timeout: 8_000,
      },
    );
    await expect(page.locator('.step-card[data-step-id="ba"]')).toHaveClass(
      /step-card--in_progress/,
    );
  });

  test("history filters and playback reopen a persisted multi-run task", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "swarm_ui_history_v1_default",
        JSON.stringify([
          {
            id: "run-billing",
            at: Date.parse("2026-04-09T09:00:00Z"),
            prompt: "Investigate billing sync regression",
            agent_config: {},
            pipeline_steps: ["pm", "dev", "qa"],
            taskId: "task-history-billing",
            workspace_root: "/tmp/workspace",
            status: "failed",
            error: "qa failed",
            durationMs: 182000,
          },
          {
            id: "run-docs",
            at: Date.parse("2026-04-09T08:00:00Z"),
            prompt: "Refresh onboarding documentation",
            agent_config: {},
            pipeline_steps: ["pm", "doc_generate"],
            taskId: "task-history-docs",
            workspace_root: "/tmp/workspace",
            status: "completed",
            durationMs: 64000,
          },
        ]),
      );
    });

    await page.route("**/tasks/task-history-billing", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: "task-history-billing",
          status: "failed",
          error: "qa failed",
          agents: ["pm", "dev", "qa"],
          history: [
            { agent: "pm", message: "planned", timestamp: "2026-04-09T09:00:00Z" },
            { agent: "dev", message: "implemented", timestamp: "2026-04-09T09:01:00Z" },
            { agent: "qa", message: "failed", timestamp: "2026-04-09T09:03:00Z" },
          ],
        }),
      });
    });

    await page.route(
      "**/artifacts/task-history-billing/pipeline.json",
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            pipeline_steps: ["pm", "dev", "qa"],
            failed_step: "qa",
          }),
        });
      },
    );

    await page.goto("/#/legacy");

    await page.locator(".history-search").fill("billing");
    await expect(page.locator(".history-item")).toHaveCount(1);
    await expect(page.locator(".history-item")).toContainText(/billing sync/i);

    await page.locator(".history-filter").selectOption("failed");
    await expect(page.locator(".history-item")).toHaveCount(1);
    await page.getByRole("button", { name: /Open run|Открыть прогон/i }).click();

    await expect(page.locator(".status-line")).toContainText(/Failed|Ошибка/i);
    // Status line shows task ID truncated to 8 chars
    await expect(page.locator(".status-line")).toContainText("task-his");
    await expect(page.locator(".step-card--failed")).toBeVisible({ timeout: 8_000 });
  });
});
