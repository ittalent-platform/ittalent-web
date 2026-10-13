import { spawnSync } from "node:child_process";
import { expect, test } from "@playwright/test";

import { backendEnv, E2E_API_URL } from "../playwright.config";

const ADMIN_EMAIL = "manage-users-e2e@example.test";
const ADMIN_PASSWORD = "ManageUsers123!";
const isWindows = process.platform === "win32";
const npmCommand = isWindows ? "cmd.exe" : "npm";

function seedAdmin() {
  return spawnSync(
    npmCommand,
    isWindows
      ? ["/d", "/s", "/c", "npm.cmd", "run", "seed:admin"]
      : ["run", "seed:admin"],
    {
      cwd: "../ittalent-backend",
      env: {
        ...process.env,
        ...backendEnv,
        ADMIN_EMAIL,
        ADMIN_USERNAME: "manage_users_e2e",
        ADMIN_PASSWORD,
      },
      encoding: "utf8",
    },
  );
}

test("admin edits an account with its loaded version against the real API", async ({ page, request }) => {
  const seed = seedAdmin();
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
  await expect(page.getByRole("button", { name: "Suspend", exact: true })).toHaveCount(0); // own account: the API rejects self-suspension
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: /edit information/i });
  await expect(dialog.getByText("Not editable here")).toHaveCount(0);
  await expect(dialog.getByLabel("Email")).toHaveAttribute("readonly", "");
  await dialog.getByLabel("Email").hover();
  await expect(page.locator("[role=tooltip]")).toContainText("Use Change email to change it.");
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

test("admin creates an HR account with an active company and receives invitation delivery feedback", async ({ page, request }) => {
  const seed = seedAdmin();
  expect(seed.status, seed.stderr).toBe(0);
  const login = await request.post(`${E2E_API_URL}/api/v1/auth/login`, { data: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(login.ok()).toBe(true);
  const session = await login.json();
  await page.addInitScript((data) => {
    localStorage.setItem("ittalent_access_token", data.tokens.accessToken);
    localStorage.setItem("ittalent_refresh_token", data.tokens.refreshToken);
    sessionStorage.setItem("ittalent_user", JSON.stringify(data.user));
  }, session);

  const companyResponse = await request.get(`${E2E_API_URL}/api/v1/enterprises?status=active&limit=1`, { headers: { authorization: `Bearer ${session.tokens.accessToken}` } });
  expect(companyResponse.ok()).toBe(true);
  const { items: companies } = await companyResponse.json();
  expect(companies.length).toBeGreaterThan(0);
  const email = `invite-e2e-${Date.now()}@example.test`;
  const username = `invite_${Date.now().toString(36)}`;
  await page.goto("/admin/users");
  await page.getByRole("button", { name: "Create user" }).click();
  const dialog = page.getByRole("dialog", { name: /create user account/i });
  await dialog.getByLabel(/full name/i).fill("Invitation E2E");
  await dialog.getByLabel(/^email/i).fill(email);
  await dialog.getByLabel(/username/i).fill(username);
  await dialog.locator("label", { hasText: /^HR$/ }).click();
  await dialog.getByRole("button", { name: "Company" }).click();
  await page.getByRole("option", { name: new RegExp(companies[0].name) }).click();
  const createResponse = page.waitForResponse((response) => response.url().endsWith("/api/v1/users") && response.request().method() === "POST");
  await dialog.getByRole("button", { name: "Create and send invitation" }).click();
  const created = await createResponse;
  expect(created.status()).toBe(201);
  expect(created.request().postDataJSON()).toMatchObject({ email, username, role: "recruiter", enterpriseId: companies[0].id });
  const body = await created.json();
  expect(body).toMatchObject({ user: { status: "invited", role: "recruiter" }, invitation: { deliveryStatus: "sent" } });
  await expect(dialog).not.toBeVisible();
  // The success toast links straight to the new account.
  await page.getByRole("button", { name: "View", exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`/admin/users/${body.user.id}$`));
});

test("admin filters the users list with multi-select filters kept in the URL", async ({ page, request }) => {
  const seed = seedAdmin();
  expect(seed.status, seed.stderr).toBe(0);
  const login = await request.post(`${E2E_API_URL}/api/v1/auth/login`, { data: { identifier: ADMIN_EMAIL, password: ADMIN_PASSWORD } });
  expect(login.ok()).toBe(true);
  const session = await login.json();
  await page.addInitScript((data) => {
    localStorage.setItem("ittalent_access_token", data.tokens.accessToken);
    localStorage.setItem("ittalent_refresh_token", data.tokens.refreshToken);
    sessionStorage.setItem("ittalent_user", JSON.stringify(data.user));
  }, session);

  await page.goto("/admin/users?role=admin&status=bogus");
  await expect(page.getByText(/weren't valid and were removed/)).toBeVisible();
  await expect(page.getByRole("list", { name: "Active filters" }).getByText("Role: Admin", { exact: true })).toBeVisible();

  const listResponse = page.waitForResponse((response) => response.url().includes("/api/v1/users?") && response.url().includes("role=admin%2Crecruiter"));
  await page.getByRole("button", { name: /^Role:/ }).click();
  await page.getByRole("menuitem", { name: "HR" }).click();
  await page.keyboard.press("Escape");
  expect((await listResponse).status()).toBe(200);
  await expect(page.getByRole("button", { name: "Role: 2" })).toBeVisible();
  await expect(page).toHaveURL(/role=admin(%2C|,)recruiter/);

  await page.getByRole("button", { name: "Clear all" }).click();
  await expect(page).not.toHaveURL(/role=/);
});
