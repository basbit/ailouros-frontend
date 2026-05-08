import { test, expect } from "@playwright/test";

const SCENARIO_CATALOG = {
  scenarios: [
    {
      id: "build_feature",
      title: "Build Feature",
      category: "development",
      description: "Implement a feature end to end with PM, BA, Architect, Dev, QA.",
      pipeline_steps: ["clarify_input", "pm", "ba", "architect", "dev", "qa"],
      default_gates: ["human_qa"],
      expected_artifacts: ["pipeline.json", "agents/dev.txt"],
      required_tools: ["workspace_write"],
      workspace_write_default: true,
      recommended_models: {},
      tags: ["development", "writes_files"],
      quality_checks: [],
      inputs: [
        {
          key: "prompt",
          label: "Feature description",
          hint: "Describe what to build.",
          required: true,
        },
      ],
    },
    {
      id: "research_brief",
      title: "Research Brief",
      category: "research",
      description: "Cited research brief with sources.",
      pipeline_steps: [
        "crole_web_researcher",
        "crole_source_reviewer",
        "crole_synthesis_writer",
      ],
      default_gates: [],
      expected_artifacts: ["agents/crole_synthesis_writer.txt"],
      required_tools: ["web_search"],
      workspace_write_default: false,
      recommended_models: {},
      tags: ["research"],
      quality_checks: [],
      inputs: [
        {
          key: "prompt",
          label: "Research question",
          hint: "What should be investigated?",
          required: true,
        },
      ],
    },
  ],
};

test.describe("Scenario board", () => {
  test("chip switch updates pipeline graph steps before run", async ({ page }) => {
    await page.route("**/v1/scenarios", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(SCENARIO_CATALOG),
      });
    });

    await page.route("**/v1/scenarios/preview*", async (route) => {
      const url = new URL(route.request().url());
      const id = url.searchParams.get("scenario_id") ?? "build_feature";
      const matching = SCENARIO_CATALOG.scenarios.find((entry) => entry.id === id);
      const scenario = matching ?? SCENARIO_CATALOG.scenarios[0];
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          scenario,
          pipeline_steps: scenario.pipeline_steps,
          default_gates: scenario.default_gates,
          expected_artifacts: scenario.expected_artifacts,
          required_tools: scenario.required_tools,
          recommended_models: scenario.recommended_models,
          agent_config: {},
          workspace_write: scenario.workspace_write_default,
          warnings: [],
          skipped_gates: [],
          model_profile_applied: {},
        }),
      });
    });

    await page.goto("/");

    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

    const buildFeatureChip = page.locator(".pg-header__chip", {
      hasText: "Build Feature",
    });
    await buildFeatureChip.first().click();

    await expect(page.locator('.step-card[data-step-id="pm"]')).toBeVisible({
      timeout: 8_000,
    });
    await expect(page.locator('.step-card[data-step-id="dev"]')).toBeVisible();

    const researchChip = page.locator(".pg-header__chip", {
      hasText: "Research Brief",
    });
    await researchChip.first().click();

    await expect(
      page.locator('.step-card[data-step-id="crole_synthesis_writer"]'),
    ).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('.step-card[data-step-id="dev"]')).toHaveCount(0);
  });
});
