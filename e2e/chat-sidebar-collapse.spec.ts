import { test, expect } from "@playwright/test";

/**
 * Collapsing the chat sidebar used to be a one-way trip until reload.
 *
 * `.chat-sidebar--collapsed` is 48px wide, but the full-width
 * "new conversation" button stayed rendered in `.chat-sidebar__header`, so the
 * toggle was laid out from x=44 to x=69 — its centre landed on `.chat-feed`,
 * which swallowed every click. Playwright retried 56 times and timed out.
 *
 * A class assertion cannot catch this: the class was always applied correctly.
 * Only real layout can, which is why this lives in the Playwright suite and not
 * the jsdom one (jsdom has no layout at all). Note the explicit wait for the
 * 0.2s width transition to settle — measuring mid-transition reads the sidebar
 * at its old width and the check silently passes on the broken build.
 */
test.describe("chat sidebar collapse", () => {
  test("the collapse toggle stays clickable and re-expands the sidebar", async ({
    page,
  }) => {
    await page.route("**/v1/conversations**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ threads: [] }),
      });
    });

    await page.goto("/#/chat");

    const sidebar = page.getByTestId("chat-sidebar");
    const toggle = page.getByTestId("chat-sidebar-toggle");
    await expect(sidebar).toBeVisible({ timeout: 10_000 });

    await toggle.click();
    await expect(sidebar).toHaveClass(/chat-sidebar--collapsed/);
    await expect(sidebar).toHaveCSS("width", "48px");

    // What the user's pointer actually reaches at the toggle's centre. On the
    // broken build this is DIV.chat-feed.
    const hit = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="chat-sidebar-toggle"]')!;
      const box = el.getBoundingClientRect();
      const top = document.elementFromPoint(
        box.x + box.width / 2,
        box.y + box.height / 2,
      );
      return { isToggle: top === el || el.contains(top), right: box.x + box.width };
    });
    expect(hit.isToggle).toBe(true);
    expect(hit.right).toBeLessThanOrEqual(48);

    // …and the click lands: no forced click, no retry storm.
    await toggle.click({ timeout: 5_000 });
    await expect(sidebar).not.toHaveClass(/chat-sidebar--collapsed/);
  });
});
