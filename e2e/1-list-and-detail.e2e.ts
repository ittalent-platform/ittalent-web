import {
  ACCOUNTS,
  api,
  applicationId,
  displayId,
  expect,
  FOREIGN_APPLICATION_ID,
  SEED,
  search,
  signInAs,
  test,
  TOTAL_APPLICATIONS,
} from "./support";

test.describe("UC-MYAPP-01 view my applications", () => {
  test("signs in through the real form and lands on the candidate app", async ({
    page,
  }) => {
    await page.goto("/login");
    // The form is a lazy chunk: wait until it has hydrated so typed values are not reset by its first render.
    await page.waitForLoadState("networkidle");
    await page
      .getByPlaceholder("you@example.com or username")
      .fill(ACCOUNTS.demo);
    await page.locator("#login-password").fill("Candidate123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/localhost:5174\/$/);
    await page.goto("/my-applications");
    await expect(
      page.getByRole("heading", { name: "My applications" }),
    ).toBeVisible();
  });

  test("lists only my applications with company, status, documents and a paged footer", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    await expect(
      page.getByRole("heading", { name: "My applications" }),
    ).toBeVisible();
    await expect(
      page.getByText(`${TOTAL_APPLICATIONS} applications`),
    ).toBeVisible();
    await expect(
      page.getByText(
        `Showing 1–${TOTAL_APPLICATIONS} of ${TOTAL_APPLICATIONS}`,
      ),
    ).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: displayId(SEED.underReview) }),
    ).toContainText("DataWave");
    await expect(
      page.getByRole("row").filter({ hasText: displayId(SEED.underReview) }),
    ).toContainText("Under Review");
    await expect(
      page.getByRole("row").filter({ hasText: displayId(SEED.interviewing) }),
    ).toContainText("Cover letter");
    // Private data of another candidate never appears.
    await expect(page.getByText("Hidden Corp")).toHaveCount(0);
    await expect(
      page.getByText("Private role of another candidate"),
    ).toHaveCount(0);
  });

  test("AC.2 changes page and page size", async ({ candidate: page }) => {
    await page.goto("/my-applications?limit=5");
    await expect(
      page.getByText(`Showing 1–5 of ${TOTAL_APPLICATIONS}`),
    ).toBeVisible();
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(
      page.getByText(`Showing 6–10 of ${TOTAL_APPLICATIONS}`),
    ).toBeVisible();
  });

  test("AC.3 board shows one column per status with counts, only withdrawable cards are selectable", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications?view=board&limit=50`);
    for (const column of [
      "Submitted",
      "Under Review",
      "Interviewing",
      "Offered",
      "Hired",
      "Rejected",
      "Withdrawn",
    ]) {
      await expect(page.getByRole("region", { name: column })).toBeVisible();
    }
    await expect(
      page.getByRole("region", { name: "Interviewing" }).getByRole("checkbox"),
    ).toHaveCount(0);
    await expect(
      page.getByRole("checkbox", {
        name: `Select ${displayId(SEED.submitted)}`,
      }),
    ).toBeVisible();
    await expect(page.getByRole("region", { name: "Withdrawn" })).toContainText(
      "2",
    );
  });

  test("AC.1 empty list shows guidance and no application", async ({
    page,
  }) => {
    await signInAs(page, ACCOUNTS.empty);
    await page.goto("/my-applications");
    await expect(
      page.getByRole("heading", { name: "No applications yet" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Browse jobs" }),
    ).toBeVisible();
  });

  test("EX.1 an unauthenticated visitor is sent to Sign in", async ({
    page,
  }) => {
    await page.goto("/my-applications");
    await expect(page).toHaveURL(/\/login/);
  });

  test("EX.1 a session that expires mid-use is sent to Sign in", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications");
    await expect(
      page.getByRole("heading", { name: "My applications" }),
    ).toBeVisible();
    await page.route("**/api/v1/applications?*", (route) =>
      route.fulfill({
        status: 401,
        json: { message: "Authentication required" },
      }),
    );
    await page.route("**/api/v1/auth/refresh", (route) =>
      route.fulfill({ status: 401, json: { message: "expired" } }),
    );
    await search(page).fill("Nova");
    await expect(page).toHaveURL(/\/login/);
  });

  test("EX.4 retrieval failure offers Retry and shows no partial data", async ({
    candidate: page,
  }) => {
    let fail = true;
    await page.route("**/api/v1/applications?*", (route) =>
      fail
        ? route.fulfill({ status: 500, json: { message: "boom" } })
        : route.continue(),
    );
    await page.goto("/my-applications");
    await expect(page.getByRole("alert")).toContainText(
      "Could not load your applications.",
    );
    await expect(
      page.getByRole("row").filter({ hasText: displayId(SEED.submitted) }),
    ).toHaveCount(0);
    fail = false;
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByText(displayId(SEED.submitted))).toBeVisible();
  });

  test("BR-APP-008 tags the reapplication and the withdrawn record and links them", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    await expect(
      page.getByRole("link", { name: "2nd application" }),
    ).toHaveAttribute(
      "href",
      `/my-applications/${applicationId(SEED.withdrawnLinked)}`,
    );
    await expect(
      page.getByRole("link", {
        name: `Reapplied as ${displayId(SEED.reapplication)}`,
      }),
    ).toHaveAttribute(
      "href",
      `/my-applications/${applicationId(SEED.reapplication)}`,
    );
    await page.getByRole("link", { name: "2nd application" }).click();
    await expect(page).toHaveURL(
      new RegExp(applicationId(SEED.withdrawnLinked)),
    );
  });

  test("API enforces scope: the list never contains another candidate's record", async () => {
    const list = await api(ACCOUNTS.demo, "/api/v1/applications?limit=100");
    const body = list.json as { items: { id: string }[]; total: number };
    expect(list.status).toBe(200);
    expect(body.total).toBe(TOTAL_APPLICATIONS);
    expect(body.items.map((item) => item.id)).not.toContain(
      FOREIGN_APPLICATION_ID,
    );
    expect(JSON.stringify(body)).not.toMatch(
      /Hidden Corp|note|reviewer|account_id/,
    );
  });

  test("API rejects invalid list parameters without returning data (EX.3)", async () => {
    for (const query of [
      "page=0",
      "limit=1000",
      "sortBy=company",
      "status=archived",
      "search=%20%20",
    ]) {
      const response = await api(
        ACCOUNTS.demo,
        `/api/v1/applications?${query}`,
      );
      expect(response.status, query).toBe(400);
    }
  });
});

test.describe("UC-MYAPP-02 view my application detail", () => {
  test("shows job snapshot, progress, documents and no private notes", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.underReview)}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Chuyên viên Phân tích Dữ liệu",
      }),
    ).toBeVisible();
    await expect(page.getByText("DataWave").first()).toBeVisible();
    await expect(
      page.getByRole("list", { name: "Application progress" }),
    ).toBeVisible();
    await expect(
      page.getByText(displayId(SEED.underReview)).first(),
    ).toBeVisible();
    await expect(page.getByText("Nguyen_Van_An_CV.pdf")).toBeVisible();
    await expect(
      page.getByText(
        "Saved when you applied. The live posting may have changed.",
      ),
    ).toBeVisible();
    await expect(page.getByText("Review stage")).toBeVisible();
    await expect(page.getByText(/reviewer|internal note|private/i)).toHaveCount(
      0,
    );
  });

  test("AC.1 the breadcrumb returns to the list", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.underReview)}`);
    await page.getByRole("link", { name: "My applications" }).first().click();
    await expect(page).toHaveURL(/\/my-applications$/);
  });

  test("EX.2 / EX.4 another candidate's application looks exactly like a missing one", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${FOREIGN_APPLICATION_ID}`);
    await expect(
      page.getByRole("heading", { name: "Application not found" }),
    ).toBeVisible();
    await expect(page.getByText("Hidden Corp")).toHaveCount(0);
    const foreign = await api(
      ACCOUNTS.demo,
      `/api/v1/applications/${FOREIGN_APPLICATION_ID}`,
    );
    const missing = await api(
      ACCOUNTS.demo,
      `/api/v1/applications/${"a".repeat(24)}`,
    );
    expect(foreign.status).toBe(404);
    expect(foreign.json).toEqual(missing.json);
  });

  test("EX.3 a malformed id gets validation guidance", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications/not-an-id");
    await expect(
      page.getByRole("heading", { name: "This link isn't valid" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Back to my applications" }).click();
    await expect(page).toHaveURL(/\/my-applications$/);
  });

  test("EX.5 a retrieval failure offers a retry", async ({
    candidate: page,
  }) => {
    let fail = true;
    await page.route(
      `**/api/v1/applications/${applicationId(SEED.underReview)}`,
      (route) =>
        fail
          ? route.fulfill({ status: 500, json: { message: "boom" } })
          : route.continue(),
    );
    await page.goto(`/my-applications/${applicationId(SEED.underReview)}`);
    await expect(page.getByRole("alert")).toContainText(
      "Could not load your applications.",
    );
    fail = false;
    await page.getByRole("button", { name: "Try again" }).click();
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Chuyên viên Phân tích Dữ liệu",
      }),
    ).toBeVisible();
  });

  test("BR-APP-008 a reapplication links to the earlier record and the withdrawn one links forward", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.reapplication)}`);
    await expect(
      page.getByText("Your second application to this job"),
    ).toBeVisible();
    await expect(
      page.getByText(/The earlier one was withdrawn on/),
    ).toBeVisible();
    await page
      .getByRole("link", { name: `View ${displayId(SEED.withdrawnLinked)}` })
      .click();
    await expect(page.getByText(/You applied again on/)).toBeVisible();
    await expect(page.getByRole("link", { name: "Apply again" })).toHaveCount(
      0,
    );
    await expect(
      page.getByRole("button", { name: "Withdraw application" }),
    ).toHaveCount(0);
  });

  test("a withdrawn first application on an open job offers Apply again", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.withdrawnOpen)}`);
    await expect(
      page.getByText(/You withdrew this application on/),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Apply again" }),
    ).toHaveAttribute("href", /\/jobs\//);
  });

  test("statuses the candidate cannot withdraw show no Withdraw action (Interviewing, Offered, Hired, Rejected)", async ({
    candidate: page,
  }) => {
    for (const index of [
      SEED.interviewing,
      SEED.offered,
      SEED.hired,
      SEED.rejected,
    ]) {
      await page.goto(`/my-applications/${applicationId(index)}`);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Withdraw application" }),
        displayId(index),
      ).toHaveCount(0);
    }
  });
});

test.describe("UC-MYAPP-03 view my application history", () => {
  test("shows newest first with actor roles only, and opens the full history", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.hired)}`);
    const history = page.locator("aside");
    await expect(history.getByText("Moved to Hired")).toBeVisible();
    await expect(history.getByText(/by Company/).first()).toBeVisible();
    await expect(history.getByText(/by You/)).toBeVisible();
    const labels = await history
      .locator("li p.font-semibold")
      .allTextContents();
    expect(labels[0]).toBe("Moved to Hired");
    expect(labels[labels.length - 1]).toBe("Submitted");
  });

  test("a reapplication starts its own history with 'Submitted · applied again'", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.reapplication)}`);
    await expect(page.getByText("Submitted · applied again")).toBeVisible();
    const history = await api(
      ACCOUNTS.demo,
      `/api/v1/applications/${applicationId(SEED.reapplication)}/history`,
    );
    expect((history.json as { total: number }).total).toBe(1);
  });

  test("EX.2 foreign history is denied and EX.3 a malformed id is rejected", async () => {
    expect(
      (
        await api(
          ACCOUNTS.demo,
          `/api/v1/applications/${FOREIGN_APPLICATION_ID}/history`,
        )
      ).status,
    ).toBe(404);
    expect(
      (await api(ACCOUNTS.demo, "/api/v1/applications/not-an-id/history"))
        .status,
    ).toBe(400);
  });

  test("history is append-only from the candidate side: no write endpoint exists", async () => {
    const attempt = await api(
      ACCOUNTS.demo,
      `/api/v1/applications/${applicationId(SEED.hired)}/history`,
      { method: "POST", body: { status: "hired" } },
    );
    expect([404, 405]).toContain(attempt.status);
  });
});
