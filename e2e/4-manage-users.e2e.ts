import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";

import { backendEnv, E2E_API_URL } from "../playwright.config";

const ADMIN_EMAIL = "manage-users-e2e@example.test";
const ADMIN_PASSWORD = "ManageUsers123!";

test("admin edits an account with its loaded version against the real API", async ({ page, request }) => {
  const seed = spawnSync("npm", ["run", "seed:admin"], {
    cwd: "../ittalent-backend",
    env: { ...process.env, ...backendEnv, ADMIN_EMAIL, ADMIN_USERNAME: "manage_users_e2e", ADMIN_PASSWORD },
    encoding: "utf8",
  });
  expect(seed.status, seed.stderr).toBe(0);
  const login = await request.post(`${E2E_API_URL}/api/v1/auth/login`, { data: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(login.ok()).toBe(true);
  const session = await login.json();
  await page.addInitScript((data) => {
    localStorage.setItem("ittalent_access_token", data.tokens.accessToken);
    localStorage.setItem("ittalent_refresh_token", data.tokens.refreshToken);
    sessionStorage.setItem("ittalent_user", JSON.stringify(data.user));
  }, session);
  const headers = { authorization: `Bearer ${session.tokens.accessToken}` };
  const beforeResponse = await request.get(`${E2E_API_URL}/api/v1/users/${session.user.id}`, { headers });
  const before = await beforeResponse.json();
  await page.goto(`/admin/users/${session.user.id}`);
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /edit user/i });
  await expect(dialog.getByLabel("Role", { exact: true })).toHaveAttribute("readonly", "");
  await expect(dialog.getByRole("button", { name: "Save changes" })).toBeDisabled();
  const name = `Managed User ${before.version}`;
  await dialog.getByLabel(/full name/i).fill(name);
  const responsePromise = page.waitForResponse((response) => response.url().endsWith(`/api/v1/users/${session.user.id}`) && response.request().method() === "PATCH");
  await dialog.getByRole("button", { name: "Save changes" }).click();
  const response = await responsePromise;
  expect(response.status()).toBe(200);
  expect(response.request().postDataJSON()).toEqual({ fullName: name, expectedVersion: before.version });
  await expect(dialog).not.toBeVisible();
  const after = await request.get(`${E2E_API_URL}/api/v1/users/${session.user.id}`, { headers });
  expect(await after.json()).toMatchObject({ fullName: name, version: before.version + 1, role: "admin" });
});
