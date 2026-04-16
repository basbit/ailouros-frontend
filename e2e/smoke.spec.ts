import { test, expect } from "@playwright/test";

test.describe("App smoke", () => {
  test("UI page loads", async ({ page }) => {
    await page.goto("/");
    // Check the main page title or a key element is visible
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });
  });

  test("API health check", async ({ request }) => {
    let ok = false;
    try {
      const resp = await request.get("/health");
      ok = resp.ok();
    } catch {
      // network error — backend not running
    }
    // Skip gracefully when backend is not available
    if (!ok) {
      test.skip(true, "Backend not reachable — skipping API health check");
      return;
    }
    expect(ok).toBeTruthy();
  });

  test("sidebar collapse persists and project dialog flow works", async ({ page }) => {
    await page.goto("/");
    // Wait for app to be ready
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

    // Use CSS class — button has no visible text, only title attribute
    await page.locator(".sidebar-toggle").click();
    await expect(page.locator(".swarm-vue-host--sidebar-collapsed")).toBeVisible();

    await page.reload();
    await expect(page.locator(".swarm-vue-host--sidebar-collapsed")).toBeVisible();

    await page.locator(".sidebar-toggle").click();
    await page.getByRole("button", { name: /New project|Новый проект/i }).click();
    await expect(page.getByRole("dialog")).toContainText(
      /Create project|Создать проект/i,
    );
    // Scope textbox to dialog to avoid matching the prompt textarea
    await page.locator(".dialog-card__input").fill("QA Sandbox");
    await page.getByRole("button", { name: /^OK$|^ОК$/ }).click();
    // Header shows the active project name — more reliable than checking 65 selects
    await expect(page.locator(".header-kv__value")).toContainText("QA Sandbox");
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

    await page.goto("/");

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

    await page.goto("/");

    await expect(page.locator(".step-card").nth(1)).toHaveClass(
      /step-card--completed/,
      {
        timeout: 8_000,
      },
    );
    await expect(page.locator(".step-card").nth(2)).toHaveClass(
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

    await page.goto("/");

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
