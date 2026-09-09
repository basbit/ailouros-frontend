import { test, expect } from "@playwright/test";

/**
 * Chat-run gate flow, fully mocked at the network layer (no backend needed).
 *
 * Reproduces the reported deadlock: the pipeline pauses on awaiting_human but
 * no answer form ever appeared, because the chat page never re-subscribed the
 * shared WebSocket to the new task id (stubbed sendWsSubscribe) and the SSE
 * sibling key awaiting_clarification was dropped by the stream parser.
 *
 * The flow proved here:
 * 1. send a prompt in the chat
 * 2. backend SSE stream pauses with awaiting_clarification
 * 3. the human gate form appears in the chat page
 * 4. answering submits POST /v1/tasks/{id}/human-resume and the run resumes.
 */

const TASK_ID = "task-e2e-gate-1";

function sseFrame(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

test.describe("chat gate flow (mocked backend)", () => {
  test("awaiting_clarification surfaces the human gate and answer resumes the run", async ({
    page,
  }) => {
    let resumeRequested = false;

    await page.route("**/v1/conversations**", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === "GET" && /\/v1\/conversations\/[^/]+$/.test(url)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            thread: {
              id: "th1",
              title: "t",
              created_at: "",
              updated_at: "",
              turns: [],
            },
          }),
        });
        return;
      }
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ threads: [] }),
        });
        return;
      }
      // POST /v1/conversations (create) and /turn (append)
      const postBody = route.request().postDataJSON() as Record<string, unknown>;
      if ("user_message" in postBody) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            thread: {
              id: "th1",
              title: "t",
              created_at: "",
              updated_at: "",
              turns: [
                {
                  id: "turn1",
                  user_message: String(postBody.user_message),
                  created_at: "",
                  status: "running",
                },
              ],
            },
            turn: {
              id: "turn1",
              user_message: String(postBody.user_message),
              created_at: "",
              status: "running",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          thread: { id: "th1", title: "t", created_at: "", updated_at: "", turns: [] },
        }),
      });
    });

    await page.route("**/v1/tasks/*/clarify-questions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          context: "",
          pending: true,
          questions: [
            {
              index: 1,
              text: "Which stack should the service use?",
              options: ["FastAPI", "Django"],
            },
          ],
        }),
      });
    });

    await page.route("**/v1/tasks/*/workspace-diff", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ files_changed: [], stats: null, source: "none" }),
      });
    });

    await page.route("**/v1/chat/completions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: { "x-task-id": TASK_ID },
        body:
          // step progress line
          sseFrame({
            choices: [
              {
                index: 0,
                delta: { content: "[pm] in_progress: Planning\n" },
                finish_reason: null,
              },
            ],
          }) +
          // pause: sibling key the old parser dropped
          sseFrame({
            choices: [{ index: 0, delta: { content: "" }, finish_reason: null }],
            awaiting_clarification: {
              type: "awaiting_clarification",
              step_id: "clarify_input",
              questions: [
                {
                  index: 1,
                  text: "Which stack should the service use?",
                  options: ["FastAPI", "Django"],
                },
              ],
            },
          }) +
          "data: [DONE]\n\n",
      });
    });

    await page.route("**/v1/tasks/*/human-resume", async (route) => {
      resumeRequested = true;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body:
          sseFrame({
            choices: [
              {
                index: 0,
                delta: { content: "[orchestrator] in_progress: resumed\n" },
                finish_reason: null,
              },
            ],
          }) + "data: [DONE]\n\n",
      });
    });

    await page.route("**/v1/tasks/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: TASK_ID,
          status: resumeRequested ? "in_progress" : "awaiting_human",
          error: null,
          agents: ["pm"],
          history: [
            {
              agent: "pm",
              message: "NEEDS_CLARIFICATION: Which stack?",
              timestamp: "",
            },
          ],
        }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto("/#/run");

    // Send a prompt
    const textarea = page.locator(".prompt-input-wrap textarea");
    await textarea.fill("Build a REST API for a todo app");
    await page.getByRole("button", { name: /Send|Отправить/i }).click();

    // The gate must appear — driven by the SSE awaiting_clarification event
    await expect(page.locator(".human-gate")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".human-gate")).toContainText("Which stack");
  });

  test("typing in the chat input answers the gate without touching the form", async ({
    page,
  }) => {
    let humanResumeBody: Record<string, unknown> | null = null;

    await page.route("**/v1/conversations**", async (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === "GET" && /\/v1\/conversations\/[^/]+$/.test(url)) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            thread: {
              id: "th1",
              title: "t",
              created_at: "",
              updated_at: "",
              turns: [],
            },
          }),
        });
        return;
      }
      if (method === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ threads: [] }),
        });
        return;
      }
      const postBody = route.request().postDataJSON() as Record<string, unknown>;
      if ("user_message" in postBody) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            thread: {
              id: "th1",
              title: "t",
              created_at: "",
              updated_at: "",
              turns: [
                {
                  id: "turn1",
                  user_message: String(postBody.user_message),
                  created_at: "",
                  status: "running",
                },
              ],
            },
            turn: {
              id: "turn1",
              user_message: String(postBody.user_message),
              created_at: "",
              status: "running",
            },
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          thread: { id: "th1", title: "t", created_at: "", updated_at: "", turns: [] },
        }),
      });
    });

    await page.route("**/v1/tasks/*/clarify-questions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          context: "",
          pending: true,
          questions: [
            {
              index: 1,
              text: "Which stack should the service use?",
              options: ["FastAPI", "Django"],
            },
          ],
        }),
      });
    });

    await page.route("**/v1/tasks/*/workspace-diff", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ files_changed: [], stats: null, source: "none" }),
      });
    });

    await page.route("**/v1/chat/completions", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        headers: { "x-task-id": TASK_ID },
        body:
          sseFrame({
            choices: [
              {
                index: 0,
                delta: { content: "[pm] in_progress: Planning\n" },
                finish_reason: null,
              },
            ],
          }) +
          sseFrame({
            choices: [{ index: 0, delta: { content: "" }, finish_reason: null }],
            awaiting_clarification: {
              type: "awaiting_clarification",
              step_id: "clarify_input",
              questions: [
                {
                  index: 1,
                  text: "Which stack should the service use?",
                  options: ["FastAPI", "Django"],
                },
              ],
            },
          }) +
          "data: [DONE]\n\n",
      });
    });

    await page.route("**/v1/tasks/*/pending-human", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ task_id: TASK_ID, context: "", pending: false }),
      });
    });

    await page.route("**/v1/tasks/*/human-resume", async (route) => {
      humanResumeBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body:
          sseFrame({
            choices: [
              {
                index: 0,
                delta: { content: "[orchestrator] resumed\n" },
                finish_reason: null,
              },
            ],
          }) + "data: [DONE]\n\n",
      });
    });

    await page.route("**/v1/tasks/*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          task_id: TASK_ID,
          status: humanResumeBody ? "in_progress" : "awaiting_human",
          error: null,
          agents: ["pm"],
          history: [],
        }),
      });
    });

    await page.addInitScript(() => {
      window.localStorage.clear();
    });
    await page.goto("/#/run");

    // Start a run that pauses on the gate
    const textarea = page.locator(".prompt-input-wrap textarea");
    await textarea.fill("Build a REST API for a todo app");
    await page.getByRole("button", { name: /Send|Отправить/i }).click();
    await expect(page.locator(".human-gate")).toBeVisible({ timeout: 15_000 });

    // The input bar re-aims at the gate; typing + Send answers it in-chat
    await textarea.fill("Use FastAPI, please");
    await page.getByRole("button", { name: /Answer|Ответить|Send|Отправить/i }).click();

    // The resume call carries the typed text as feedback
    await page.waitForTimeout(1200);
    if (!humanResumeBody) {
      console.error("human-resume was not called");
    }
    expect(humanResumeBody).toBeTruthy();
    expect((humanResumeBody as Record<string, unknown> | null)?.["feedback"]).toBe(
      "Use FastAPI, please",
    );
  });
});
