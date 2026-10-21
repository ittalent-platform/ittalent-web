import type { Page } from "@playwright/test";

import { JOB_POSTING_ACCOUNTS, JOB_POSTING_E2E } from "./job-posting-data";
import { api, expect, PASSWORD, test } from "./support";

const JOB_POSTINGS_PATH = "/recruiter/job-postings";
const detailPath = (id: string) => `${JOB_POSTINGS_PATH}/${id}`;
const rowForTitle = (page: Page, title: string) =>
  page.getByRole("row").filter({ hasText: title });

test.describe("Enterprise Admin Job Postings (read-only)", () => {
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
    const activity = page.getByRole("region", { name: "Activity" });
    await expect(activity).toBeVisible();
    await activity.getByRole("button", { name: "View history" }).click();
    await expect(
      page.getByRole("dialog").getByText("Job created", { exact: true }),
    ).toBeVisible();
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
      .getByRole("button", { name: /^Status: All/ })
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

  test("shows job postings read-only, without create or lifecycle actions", async ({
    enterpriseAdmin: page,
  }) => {
    await page.goto(JOB_POSTINGS_PATH);
    await expect(
      rowForTitle(page, JOB_POSTING_E2E.jobs.sharedDetail.title),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: /create/i })).toHaveCount(0);

    await page.goto(detailPath(JOB_POSTING_E2E.jobs.closeReopen.id));
    await expect(page.getByRole("button", { name: "Refresh" })).toBeVisible();
    for (const name of ["Publish", "Close", "Move to draft", "Archive", "Reopen", "Restore"])
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toHaveCount(0);
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
