import { defineConfig } from "@playwright/test";

import {
  backendEnv,
  E2E_API_URL,
  E2E_BACKEND_DIR,
  E2E_WEB_PORT,
  E2E_WEB_URL,
  E2E_STORAGE_URL,
} from "./e2e/environment";

export { backendEnv, E2E_API_URL, E2E_WEB_PORT, E2E_WEB_URL } from "./e2e/environment";

// The suite boots the real backend and the real Vite app on their own ports, against a dedicated database,
// so it never touches the dev data on 3001/5173. MongoDB and Redis come from the backend's docker-compose.
export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
  // Files run in order in one worker: the withdraw suite mutates data, so it sorts last.
  fullyParallel: false,
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 7_500 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: E2E_WEB_URL,
    channel: "chrome",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    viewport: { width: 1440, height: 900 },
  },
  webServer: [
    {
      command: "npx tsx e2e/document-storage-server.ts",
      url: `${E2E_STORAGE_URL}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: "npm run dev",
      cwd: E2E_BACKEND_DIR,
      url: `${E2E_API_URL}/health`,
      env: backendEnv,
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npm run dev -- --port ${E2E_WEB_PORT} --strictPort`,
      url: E2E_WEB_URL,
      env: { VITE_API_URL: E2E_API_URL },
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
});
