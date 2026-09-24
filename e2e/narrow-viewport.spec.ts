import { expect, test } from "@playwright/test";

/**
 * Narrow viewports must not clip the chrome or push the page sideways.
 *
 * Measured on 2026-09-16: at 900px the run pill was cut mid-word to 46px
 * ("No ⋮") because `min-width: 0` lets a flex item shrink past its content,
 * and at 375px the settings pane kept its 220px rail, leaving a content column
 * so narrow that every sentence wrapped to one word per line.
 */
const VIEWPORTS = [
  { name: "tablet", width: 900, height: 800 },
  { name: "phone", width: 375, height: 760 },
] as const;

for (const viewport of VIEWPORTS) {
  test(`settings has no horizontal overflow at ${viewport.name} width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/#/settings/api-keys");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

    const overflow = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollWidth,
      docClient: document.documentElement.clientWidth,
    }));
    expect(overflow.docScroll).toBeLessThanOrEqual(overflow.docClient + 1);
  });

  test(`no header text is cut off at ${viewport.name} width`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto("/#/settings/api-keys");
    await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

    const cut = await page.evaluate(() => {
      const offenders: { text: string; client: number; scroll: number }[] = [];
      document.querySelectorAll("header *").forEach((element) => {
        const el = element as HTMLElement;
        if (el.clientWidth === 0 || el.children.length > 0) return;
        const clipped = el.scrollWidth > el.clientWidth + 1;
        const ellipsised = getComputedStyle(el).textOverflow === "ellipsis";
        if (clipped && !ellipsised) {
          offenders.push({
            text: (el.textContent ?? "").trim().slice(0, 40),
            client: el.clientWidth,
            scroll: el.scrollWidth,
          });
        }
      });
      return offenders;
    });
    expect(cut).toEqual([]);
  });
}

test("the settings pane keeps a readable content column at phone width", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 760 });
  await page.goto("/#/settings/api-keys");
  await expect(page.getByRole("main")).toBeVisible({ timeout: 10_000 });

  const mainWidth = await page.evaluate(
    () => document.querySelector("main")?.clientWidth ?? 0,
  );
  // The 220px rail must have stacked; anything under half the viewport means
  // it is still taking the row.
  expect(mainWidth).toBeGreaterThan(280);
});
