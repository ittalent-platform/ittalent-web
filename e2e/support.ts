import { readFileSync } from "node:fs";
import { test as base, expect, type Page } from "@playwright/test";

export { expect };

export const PASSWORD = "Candidate123!";
export const ACCOUNTS = {
  demo: "candidate-myapps@example.com",
  empty: "candidate-empty@example.com",
  other: "candidate-other@example.com",
} as const;
export const TOKEN_DIR = "e2e/.auth";
export const tokenFile = (email: string) => `${TOKEN_DIR}/${email}.json`;
export const API_URL = "http://localhost:3101";

/** Seed order (see ittalent-backend/src/scripts/seed-applications.ts); ids are derived from the index. */
export const SEED = {
  submitted: 0,
  underReview: 1,
  interviewing: 2,
  offered: 3,
  hired: 4,
  rejected: 5,
  withdrawnLinked: 6,
  positionFilled: 7,
  reapplication: 8,
  withdrawnOpen: 9,
  rowMenu: 10,
  drag: 11,
  bulkA: 12,
  bulkB: 13,
} as const;
export const TOTAL_APPLICATIONS = 14;
const ID_BASE = 1001;

const hex = (index: number) => (ID_BASE + index).toString(16).padStart(24, "0");
/** 24-hex id used in URLs and API calls. */
export const applicationId = (index: number) => hex(index);
/** "APP-03E9" style id shown in the UI (last four hex digits, upper-case). */
export const displayId = (index: number) =>
  `APP-${hex(index).slice(-4).toUpperCase()}`;
export const FOREIGN_APPLICATION_ID = (ID_BASE + 500)
  .toString(16)
  .padStart(24, "0");

type Tokens = {
  user: unknown;
  tokens: { accessToken: string; refreshToken: string };
};
export const loadSession = (email: string): Tokens =>
  JSON.parse(readFileSync(tokenFile(email), "utf8")) as Tokens;

/** Starts the page already signed in as `email` (tokens from global setup), the way the app stores them. */
export async function signInAs(page: Page, email: string): Promise<void> {
  const session = loadSession(email);
  await page.addInitScript((data: Tokens) => {
    localStorage.setItem("ittalent_access_token", data.tokens.accessToken);
    localStorage.setItem("ittalent_refresh_token", data.tokens.refreshToken);
    sessionStorage.setItem("ittalent_user", JSON.stringify(data.user));
  }, session);
}

export const test = base.extend<{ candidate: Page }>({
  candidate: async ({ page }, provide) => {
    await signInAs(page, ACCOUNTS.demo);
    await provide(page);
  },
});

/** Calls the real API as a signed-in account (used to assert what the server enforces regardless of the UI). */
export async function api(
  email: string,
  path: string,
  init: { method?: string; body?: unknown } = {},
): Promise<{ status: number; json: unknown }> {
  const { tokens } = loadSession(email);
  const response = await fetch(`${API_URL}${path}`, {
    method: init.method ?? "GET",
    headers: {
      authorization: `Bearer ${tokens.accessToken}`,
      "content-type": "application/json",
    },
    ...(init.body ? { body: JSON.stringify(init.body) } : {}),
  });
  return {
    status: response.status,
    json: await response.json().catch(() => null),
  };
}

export const search = (page: Page) =>
  page.getByPlaceholder("Search by job title or company…");
export const statusFilter = (page: Page) =>
  page.getByRole("button", { name: /^Status:/ });
export const rowFor = (page: Page, index: number) =>
  page.getByRole("row").filter({ hasText: displayId(index) });
