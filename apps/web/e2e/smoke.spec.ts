import { test, expect } from "@playwright/test";

/**
 * Public-page smoke / regression suite.
 *
 * These run against the real production build (`next start`) with NO API
 * available, so every assertion targets server-rendered, fallback-safe
 * content. The global <footer> is rendered on every route and never depends
 * on the API or client hydration, which makes it a reliable "the layout
 * mounted and the route resolved" signal.
 */

const PUBLIC_PAGES = [
  "/",
  "/about",
  "/faq",
  "/contact",
  "/download",
  "/challenges",
  "/categories",
  "/privacy",
  "/terms",
  "/health-disclaimer",
];

test.describe("public pages smoke", () => {
  for (const path of PUBLIC_PAGES) {
    test(`GET ${path} renders with the global footer`, async ({ page }) => {
      const response = await page.goto(path, { waitUntil: "domcontentloaded" });
      expect(response?.status(), `HTTP status for ${path}`).toBeLessThan(400);

      // Scope to the footer landmark: the company name also appears in the
      // body copy of the legal pages, so an unscoped match is ambiguous.
      const footer = page.getByRole("contentinfo");
      await expect(footer).toBeVisible();
      await expect(
        footer.getByText("Prodigi Solutions LLC", { exact: false }),
      ).toBeVisible();
    });
  }

  test("landing page carries the Vital30 title", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page).toHaveTitle(/Vital30/);
  });

  test("footer exposes the legal links", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const footer = page.getByRole("contentinfo");
    await expect(
      footer.getByRole("link", { name: "Privacy policy" }),
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Terms of service" }),
    ).toBeVisible();
    await expect(
      footer.getByRole("link", { name: "Health disclaimer" }),
    ).toBeVisible();
  });

  test("unknown route returns a 404", async ({ page }) => {
    const response = await page.goto("/this-page-does-not-exist", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(404);
  });
});
