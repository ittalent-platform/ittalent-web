import type { Page } from "@playwright/test";

import {
  BROWSER_CREATED_JOB_TITLE,
  BROWSER_UPDATED_JOB_TITLE,
  JOB_POSTING_ACCOUNTS,
  JOB_POSTING_E2E,
} from "./job-posting-data";
import { api, expect, PASSWORD, test } from "./support";

const JOB_POSTINGS_PATH = "/recruiter/job-postings";
const detailPath = (id: string) => `${JOB_POSTINGS_PATH}/${id}`;
const rowForTitle = (page: Page, title: string) =>
  page.getByRole("row").filter({ hasText: title });

async function confirmAction(
  page: Page,
  actionLabel: string,
  confirmLabel: string,
): Promise<void> {
  await page.getByRole("button", { name: actionLabel, exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await dialog
    .getByRole("button", { name: confirmLabel, exact: true })
    .click();
  await expect(dialog).not.toBeVisible();
}

test.describe("Enterprise Admin Job Posting Management", () => {
  test("logs in through the real form and opens the shared management route", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page
      .getByLabel(/email or username/i)
      .fill(JOB_POSTING_ACCOUNTS.enterpriseAdmin);
    await page.locator("#login-password").fill(PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();

    await expect(page).toHaveURL(
      new RegExp(`${JOB_POSTINGS_PATH.replaceAll("/", "\\/")}$`),
    );
    await expect(
      page.getByRole("heading", { name: "Job postings" }),
    ).toBeVisible();
    await expect(page.getByText("Enterprise admin")).toBeVisible();
  });

  test("lists and opens jobs created by two recruiters in the same enterprise with history", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(JOB_POSTINGS_PATH);
    await expect(
      page.getByRole("heading", { name: "Job postings" }),
    ).toBeVisible();
    await expect(
      rowForTitle(page, JOB_POSTING_E2E.jobs.sharedDetail.title),
    ).toBeVisible();
    await expect(
      rowForTitle(page, JOB_POSTING_E2E.jobs.recruiterTwo.title),
    ).toBeVisible();
    await expect(
      page.getByText(JOB_POSTING_E2E.jobs.foreign.title),
    ).toHaveCount(0);

    await rowForTitle(page, JOB_POSTING_E2E.jobs.sharedDetail.title)
      .getByRole("link")
      .click();
    await expect(
      page.getByRole("heading", {
        name: JOB_POSTING_E2E.jobs.sharedDetail.title,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(JOB_POSTING_E2E.enterpriseAName, { exact: true }),
    ).toBeVisible();
    await expect(page.getByText("Activity history")).toBeVisible();
    await expect(page.getByText("Job created", { exact: true })).toBeVisible();
  });

  test("searches and filters only inside the assigned enterprise", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(JOB_POSTINGS_PATH);
    await page
      .getByPlaceholder("Search by title, description or location…")
      .fill("Searchable");
    await expect(page).toHaveURL(/search=Searchable/);

    await page
      .getByRole("button", { name: /^Type: All/ })
      .click();
    await page.getByRole("menuitem", { name: "Contract" }).click();
    await expect(page).toHaveURL(/type=Contract/);

    await page
      .getByRole("button", { name: /^Publication: All/ })
      .click();
    await page.getByRole("menuitem", { name: "Published" }).click();
    await expect(page).toHaveURL(/publication_status=published/);
    await expect(
      rowForTitle(page, JOB_POSTING_E2E.jobs.searchable.title),
    ).toBeVisible();
    await expect(
      page.getByText(JOB_POSTING_E2E.jobs.sharedDetail.title),
    ).toHaveCount(0);
    await expect(
      page.getByText(JOB_POSTING_E2E.jobs.foreign.title),
    ).toHaveCount(0);
  });

  test("creates a draft and edits it through the browser", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(`${JOB_POSTINGS_PATH}/create`);
    await expect(
      page.getByRole("heading", { name: "Create job posting" }),
    ).toBeVisible();
    await page.getByLabel(/^Title/).fill(BROWSER_CREATED_JOB_TITLE);
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${JOB_POSTINGS_PATH}$`));
    await expect(rowForTitle(page, BROWSER_CREATED_JOB_TITLE)).toBeVisible();

    await rowForTitle(page, BROWSER_CREATED_JOB_TITLE).getByRole("link").click();
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
    await page.getByRole("link", { name: "Edit", exact: true }).click();
    await page.getByLabel(/^Title/).fill(BROWSER_UPDATED_JOB_TITLE);
    await page
      .getByRole("button", { name: "Save draft", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(`${JOB_POSTINGS_PATH}$`));
    await expect(rowForTitle(page, BROWSER_UPDATED_JOB_TITLE)).toBeVisible();
  });

  test("publishes a recruiter draft and moves it back to draft", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(detailPath(JOB_POSTING_E2E.jobs.draftPublish.id));
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();

    await confirmAction(page, "Publish", "Publish job");
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Move to draft", exact: true }),
    ).toBeVisible();

    await confirmAction(page, "Move to draft", "Move to draft");
    await expect(page.getByText("Draft", { exact: true }).first()).toBeVisible();
    await expect(page.getByText("Job published", { exact: true })).toBeVisible();
    await expect(page.getByText("Moved to draft", { exact: true })).toBeVisible();
  });

  test("closes and reopens a recruiter-owned published job", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(detailPath(JOB_POSTING_E2E.jobs.closeReopen.id));
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();

    await confirmAction(page, "Close", "Close job");
    await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reopen", exact: true }),
    ).toBeVisible();

    await confirmAction(page, "Reopen", "Reopen job");
    await expect(page.getByText("Open", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Close", exact: true }),
    ).toBeVisible();
  });

  test("archives a closed job created by another recruiter", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(detailPath(JOB_POSTING_E2E.jobs.archive.id));
    await expect(page.getByText("Closed", { exact: true }).first()).toBeVisible();

    await confirmAction(page, "Archive", "Archive job");
    await expect(page.getByText("Archived", { exact: true }).first()).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Restore", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Edit", exact: true }),
    ).toHaveCount(0);
  });

  test("denies browser and direct API access to another enterprise job", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(detailPath(JOB_POSTING_E2E.jobs.foreign.id));
    const alert = page.getByRole("alert");
    await expect(alert).toContainText("Access denied");
    await expect(alert).toContainText(
      "This job posting belongs to another enterprise.",
    );

    const direct = await api(
      JOB_POSTING_ACCOUNTS.enterpriseAdmin,
      `/api/v1/job-postings/${JOB_POSTING_E2E.jobs.foreign.id}`,
    );
    expect(direct.status).toBe(403);
  });
});
