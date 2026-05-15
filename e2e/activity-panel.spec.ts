import { test, expect } from "@playwright/test";

test.describe("Tool activity panel (backend-backed)", () => {
  test.skip(
    !process.env.SWARM_E2E_BACKEND,
    "requires a running backend (set SWARM_E2E_BACKEND=1)",
  );

  test("activity endpoint returns 200 for valid task", async ({ request }) => {
    const response = await request.get(
      "/v1/tasks/playwright-smoke/activity/mcp_calls?limit=10",
    );
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.channel).toBe("mcp_calls");
    expect(Array.isArray(data.entries)).toBeTruthy();
  });

  test("activity endpoint returns 404 for unknown channel", async ({ request }) => {
    const response = await request.get("/v1/tasks/playwright-smoke/activity/bogus");
    expect(response.status()).toBe(404);
  });

  test("resume-options endpoint returns 404 for missing task", async ({ request }) => {
    const response = await request.get("/v1/tasks/does-not-exist/resume-options");
    expect(response.status()).toBe(404);
  });
});
