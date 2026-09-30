import {
  ACCOUNTS,
  api,
  displayId,
  expect,
  SEED,
  search,
  statusFilter,
  test,
  TOTAL_APPLICATIONS,
} from "./support";

test.describe("UC-MYAPP-05 search and filter my applications", () => {
  test("AC.N1 keyword matches the job title or the company and is kept in the URL", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications");
    await search(page).fill("pixel");
    await expect(page.getByText(displayId(SEED.offered))).toBeVisible();
    await expect(page.getByText(displayId(SEED.submitted))).toHaveCount(0);
    await expect(page).toHaveURL(/search=pixel/);

    await search(page).fill("Frontend");
    await expect(page.getByText(displayId(SEED.submitted))).toBeVisible();
    await expect(page.getByText(displayId(SEED.hired))).toBeVisible();
    await expect(page.getByText(displayId(SEED.offered))).toHaveCount(0);
    await page.reload();
    await expect(search(page)).toHaveValue("Frontend");
    await expect(page.getByText(displayId(SEED.hired))).toBeVisible();
  });

  test("AC.2 no match shows an empty state and AC.1 clearing returns the default list", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications");
    await search(page).fill("zzz-nothing");
    await expect(
      page.getByRole("heading", { name: "No matching applications" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(search(page)).toHaveValue("");
    await expect(
      page.getByText(`Showing 1–10 of ${TOTAL_APPLICATIONS}`),
    ).toBeVisible();
  });

  test("EX.2 a blank keyword shows validation and searches nothing", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications");
    await expect(page.getByText(displayId(SEED.submitted))).toBeVisible();
    let listCalls = 0;
    await page.route("**/api/v1/me/applications?*", (route) => {
      listCalls += 1;
      return route.continue();
    });
    await search(page).fill("   ");
    await expect(page.getByText(/Enter a keyword/)).toBeVisible();
    await expect(
      page.getByText("These search criteria aren't valid."),
    ).toBeVisible();
    expect(listCalls).toBe(0);
    await expect(search(page)).toHaveAttribute("maxlength", "100");
  });

  test("status popover: presets, several statuses, counts and Select all", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    await statusFilter(page).click();
    await page.getByRole("button", { name: "In progress" }).click();
    await expect(page).toHaveURL(
      /status=submitted%2Cunder_review%2Cinterviewing%2Coffered/,
    );
    await expect(page.getByText(displayId(SEED.interviewing))).toBeVisible();
    await expect(page.getByText(displayId(SEED.hired))).toHaveCount(0);
    await expect(page.getByText(displayId(SEED.withdrawnOpen))).toHaveCount(0);

    await page.getByRole("button", { name: "Closed" }).click();
    await expect(page.getByText(displayId(SEED.positionFilled))).toBeVisible();
    await expect(page.getByText(displayId(SEED.rejected))).toBeVisible();
    await expect(page.getByText(displayId(SEED.submitted))).toHaveCount(0);

    await page.locator("label", { hasText: "Position filled" }).click();
    await expect(page.getByText(displayId(SEED.positionFilled))).toHaveCount(0);
    await page.getByRole("button", { name: "Select all" }).click();
    await expect(
      page.getByText(
        `Showing 1–${TOTAL_APPLICATIONS} of ${TOTAL_APPLICATIONS}`,
      ),
    ).toBeVisible();
  });

  test("the last ticked status cannot be cleared", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?status=hired");
    await statusFilter(page).click();
    await page.locator("label", { hasText: "Hired" }).click();
    await expect(page).toHaveURL(/status=hired/);
  });

  test("review stage filter", async ({ candidate: page }) => {
    await page.goto("/my-applications");
    await page.getByRole("button", { name: /^Stage:/ }).click();
    await page.getByRole("menuitem", { name: "Interview" }).click();
    await expect(page.getByText(displayId(SEED.interviewing))).toBeVisible();
    await expect(page.getByText(displayId(SEED.underReview))).toHaveCount(0);
  });

  test("submitted date presets and a custom range", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    await page.getByRole("button", { name: /^Submitted:/ }).click();
    await page.getByRole("menuitem", { name: "Last 7 days" }).click();
    await expect(page.getByText(displayId(SEED.rowMenu))).toBeVisible(); // 2 days ago
    await expect(page.getByText(displayId(SEED.hired))).toHaveCount(0); // 60 days ago

    await page.getByRole("button", { name: /^Submitted:/ }).click();
    await page.getByRole("menuitem", { name: "Custom range" }).click();
    await page.getByLabel("From", { exact: true }).fill("2000-01-01");
    await page.getByLabel("To", { exact: true }).fill("2000-12-31");
    await expect(
      page.getByRole("heading", { name: "No matching applications" }),
    ).toBeVisible();
  });

  test("EX.3 a contradictory date range is explained and nothing is fetched", async ({
    candidate: page,
  }) => {
    await page.goto(
      "/my-applications?range=custom&from=2026-09-30&to=2026-01-01",
    );
    await expect(
      page
        .getByRole("alert")
        .filter({ hasText: "start date must not be after" }),
    ).toBeVisible();
    await expect(
      page.getByText("These search criteria aren't valid."),
    ).toBeVisible();
  });

  test("EX.3 an unsupported filter in a shared link is explained", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?status=archived");
    await expect(
      page.getByText("These search criteria aren't valid."),
    ).toBeVisible();
    await page.goto("/my-applications?status=hired&jobId=abc");
    await expect(
      page.getByText("These search criteria aren't valid."),
    ).toBeVisible();
  });

  test("job filter from a link shows a chip that can be cleared", async ({
    candidate: page,
  }) => {
    const detail = await api(
      ACCOUNTS.demo,
      `/api/v1/me/applications?search=Orbit`,
    );
    const jobId = (detail.json as { items: { jobId: string }[] }).items[0]!
      .jobId;
    await page.goto(`/my-applications?jobId=${jobId}`);
    await expect(page.getByText(displayId(SEED.positionFilled))).toBeVisible();
    await expect(page.getByText(displayId(SEED.submitted))).toHaveCount(0);
    await page.getByRole("button", { name: "Clear job filter" }).click();
    await expect(page.getByText(displayId(SEED.submitted))).toBeVisible();
  });

  test("filters apply to the board too, with a count per status", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?view=board&status=submitted&limit=50");
    await expect(
      page.getByRole("region", { name: "Submitted" }).getByText(/APP-/),
    ).toHaveCount(5);
    await expect(
      page.getByRole("region", { name: "Hired" }).getByText(/APP-/),
    ).toHaveCount(0);
  });

  test("sorting by a table header changes the order through the URL", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    const firstId = async () =>
      (await page.getByRole("row").nth(1).textContent()) ?? "";
    expect(await firstId()).toContain(displayId(SEED.rowMenu)); // newest submitted first
    await page.getByRole("button", { name: "Submitted", exact: true }).click(); // toggles to ascending
    await expect(page).toHaveURL(/sortOrder=asc/);
    await expect.poll(firstId).toContain(displayId(SEED.hired)); // oldest submitted first
    await page.getByRole("button", { name: "ID", exact: true }).click();
    await expect(page).toHaveURL(/sortBy=id/);
  });

  test("API: status list, sort and scope are enforced by the server", async () => {
    const closed = (
      await api(
        ACCOUNTS.demo,
        "/api/v1/me/applications?status=hired,rejected&limit=100",
      )
    ).json as { items: { status: string }[]; total: number };
    expect(closed.total).toBe(2);
    expect(
      closed.items.every((item) => ["hired", "rejected"].includes(item.status)),
    ).toBe(true);
    const asc = (
      await api(
        ACCOUNTS.demo,
        "/api/v1/me/applications?sortBy=submittedAt&sortOrder=asc&limit=100",
      )
    ).json as { items: { submittedAt: string }[] };
    const dates = asc.items.map((item) => item.submittedAt);
    expect([...dates].sort()).toEqual(dates);
    const other = (await api(ACCOUNTS.other, "/api/v1/me/applications"))
      .json as { total: number };
    expect(other.total).toBe(1);
  });
});
