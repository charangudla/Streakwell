import { defineConfig, devices } from "@playwright/test";

// Public marketing + legal pages render from the production build with no
// backend (challenge data falls back to lib/fallback-challenges.ts at build
// time), so these smoke tests run against `next start` with nothing else up.
const PORT = 3001;
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  // Fail the build if someone leaves a `test.only` in.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Serve the production build. The workflow runs `npm run build` first;
  // locally Playwright will reuse an already-running server on :3001.
  webServer: {
    command: "npm run start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
