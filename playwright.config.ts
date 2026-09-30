import { defineConfig } from "@playwright/test";

// The suite boots the real backend and the real Vite app on their own ports, against a dedicated database,
// so it never touches the dev data on 3001/5173. MongoDB and Redis come from the backend's docker-compose.
export const E2E_BACKEND_PORT = 3101;
export const E2E_WEB_PORT = 5174;
export const E2E_API_URL = `http://localhost:${E2E_BACKEND_PORT}`;
export const E2E_WEB_URL = `http://localhost:${E2E_WEB_PORT}`;
export const E2E_MONGODB_URI =
  process.env.E2E_MONGODB_URI ??
  "mongodb://127.0.0.1:27018/ittalent_myapps_e2e?replicaSet=rs0&directConnection=true";

const backendDir = "../ittalent-backend";
export const backendEnv = {
  PORT: String(E2E_BACKEND_PORT),
  MONGODB_URI: E2E_MONGODB_URI,
  CORS_ORIGIN: E2E_WEB_URL,
  APP_BASE_URL: E2E_WEB_URL,
  WEB_URL: E2E_WEB_URL,
  OPENAPI_SERVER_URL: E2E_API_URL,
  NODE_ENV: "development",
  // Global setup and the sign-in test log in several times per run; the default 5 per minute would fail back-to-back runs.
  LOGIN_RATE_LIMIT_MAX_ATTEMPTS: "1000",
};

export default defineConfig({
  testDir: "./e2e",
  testMatch: "**/*.e2e.ts",
  globalSetup: "./e2e/global-setup.ts",
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
      command: "npm run dev",
      cwd: backendDir,
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
