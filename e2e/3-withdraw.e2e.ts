import type { Locator, Page, Route } from "@playwright/test";
import {
  ACCOUNTS,
  api,
  applicationId,
  displayId,
  expect,
  FOREIGN_APPLICATION_ID,
  rowFor,
  SEED,
  test,
} from "./support";

const withdrawUrl = (index: number) =>
  `**/api/v1/me/applications/${applicationId(index)}/withdraw`;
const dialog = (page: Page, name: string | RegExp) =>
  page.getByRole("alertdialog", { name });
const statusOf = async (index: number) =>
  (
    (await api(ACCOUNTS.demo, `/api/v1/me/applications/${applicationId(index)}`))
      .json as { status: string; version: number }
  ).status;
const historyOf = async (index: number) =>
  (
    (
      await api(
        ACCOUNTS.demo,
        `/api/v1/me/applications/${applicationId(index)}/history`,
      )
    ).json as { items: { status: string; actorRole: string }[] }
  ).items;

/** Real mouse drag: HTML5 drag-and-drop needs intermediate moves, and the floating target only exists once a card is held. */
async function dragCard(
  page: Page,
  card: Locator,
  target: Locator,
  whileHolding?: () => Promise<void>,
): Promise<void> {
  const from = (await card.boundingBox())!;
  await page.mouse.move(from.x + from.width / 2, from.y + 60);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 20, from.y + 90, {
    steps: 5,
  });
  await target.waitFor();
  await whileHolding?.();
  const to = (await target.boundingBox())!;
  await page.mouse.move(
    to.x + to.width / 2,
    to.y + Math.min(to.height / 2, 120),
    { steps: 20 },
  );
  await page.mouse.up();
}

// This file mutates data (each test owns a record) and therefore runs after the read-only suites.
test.describe("UC-MYAPP-04 withdraw my application", () => {
  test("AC.1 cancelling keeps the status and history and sends no request", async ({
    candidate: page,
  }) => {
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.method() === "PATCH") requests.push(request.url());
    });
    await page.goto(`/my-applications/${applicationId(SEED.submitted)}`);
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      "After that you can’t apply to it again.",
    );
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Keep application" })
      .click();
    await expect(dialog(page, "Withdraw this application?")).toHaveCount(0);
    expect(requests).toHaveLength(0);
    expect(await statusOf(SEED.submitted)).toBe("submitted");
    expect(await historyOf(SEED.submitted)).toHaveLength(1);
  });

  test("N1 confirming withdraws, records the candidate in history and freezes the record", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.submitted)}`);
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await dialog(page, "Withdraw this application?")
      .getByLabel("Reason (optional)")
      .fill("Accepted another offer");
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(
      page.getByText(`${displayId(SEED.submitted)} has been withdrawn.`),
    ).toBeVisible();
    await expect(page.getByText("Withdrawn").first()).toBeVisible();
    await expect(
      page.getByText("Your reason: Accepted another offer"),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Withdraw application" }),
    ).toHaveCount(0);
    await expect(page.getByRole("link", { name: "Apply again" })).toBeVisible();
    const history = await historyOf(SEED.submitted);
    expect(history.at(-1)).toMatchObject({
      status: "withdrawn",
      actorRole: "candidate",
    });
    expect(history).toHaveLength(2);
    // Withdrawn is terminal: a second attempt is refused and adds no event.
    const again = await api(
      ACCOUNTS.demo,
      `/api/v1/me/applications/${applicationId(SEED.submitted)}/withdraw`,
      { method: "PATCH", body: { expectedVersion: 2 } },
    );
    expect(again.status).toBe(400);
    expect(await historyOf(SEED.submitted)).toHaveLength(2);
  });

  test("EX.5 a persistence failure is reported as retryable, not as a withdrawal, and the retry works", async ({
    candidate: page,
  }) => {
    let fail = true;
    await page.route(withdrawUrl(SEED.underReview), (route: Route) =>
      fail
        ? route.fulfill({ status: 500, json: { message: "write failed" } })
        : route.continue(),
    );
    await page.goto(`/my-applications/${applicationId(SEED.underReview)}`);
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      "Withdrawal failed. Nothing was changed.",
    );
    expect(await statusOf(SEED.underReview)).toBe("under_review");
    fail = false;
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(
      page.getByText(`${displayId(SEED.underReview)} has been withdrawn.`),
    ).toBeVisible();
    expect(await statusOf(SEED.underReview)).toBe("withdrawn");
  });

  test("EX.4 a status changed by the company meanwhile is reported and the latest state stays authoritative", async ({
    candidate: page,
  }) => {
    await page.goto(`/my-applications/${applicationId(SEED.reapplication)}`);
    // The company moves it after the page loaded, so the version the page holds is stale.
    await page.route(withdrawUrl(SEED.reapplication), (route) =>
      route.fulfill({
        status: 409,
        json: {
          message:
            "Application state changed before the withdrawal could be applied",
        },
      }),
    );
    await page.getByRole("button", { name: "Withdraw application" }).click();
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      "already your second application",
    );
    await expect(dialog(page, "Withdraw this application?")).not.toContainText(
      "After that you can’t apply",
    );
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      "moved this application while it was open",
    );
    expect(await statusOf(SEED.reapplication)).toBe("submitted");
  });

  test("EX.4 a stale expectedVersion is rejected by the server without changing anything", async () => {
    const stale = await api(
      ACCOUNTS.demo,
      `/api/v1/me/applications/${applicationId(SEED.reapplication)}/withdraw`,
      { method: "PATCH", body: { expectedVersion: 99 } },
    );
    expect(stale.status).toBe(409);
    expect(await statusOf(SEED.reapplication)).toBe("submitted");
    expect(await historyOf(SEED.reapplication)).toHaveLength(1);
  });

  test("EX.2 another candidate's application cannot be withdrawn", async () => {
    const attempt = await api(
      ACCOUNTS.demo,
      `/api/v1/me/applications/${FOREIGN_APPLICATION_ID}/withdraw`,
      { method: "PATCH", body: { expectedVersion: 0 } },
    );
    expect(attempt.status).toBe(404);
    const owner = await api(
      ACCOUNTS.other,
      `/api/v1/me/applications/${FOREIGN_APPLICATION_ID}`,
    );
    expect((owner.json as { status: string }).status).toBe("submitted");
  });

  test("EX.3 the server refuses every status other than Submitted and Under Review", async () => {
    for (const index of [
      SEED.interviewing,
      SEED.offered,
      SEED.hired,
      SEED.rejected,
      SEED.withdrawnLinked,
    ]) {
      const before = (
        await api(ACCOUNTS.demo, `/api/v1/me/applications/${applicationId(index)}`)
      ).json as { version: number; status: string };
      const attempt = await api(
        ACCOUNTS.demo,
        `/api/v1/me/applications/${applicationId(index)}/withdraw`,
        { method: "PATCH", body: { expectedVersion: before.version } },
      );
      expect(attempt.status, before.status).toBe(400);
      expect(await statusOf(index)).toBe(before.status);
    }
  });

  test("EX.1 a signed-out request cannot withdraw", async () => {
    const response = await fetch(
      `http://localhost:3101/api/v1/me/applications/${applicationId(SEED.drag)}/withdraw`,
      {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ expectedVersion: 0 }),
      },
    );
    expect(response.status).toBe(401);
    expect(await statusOf(SEED.drag)).toBe("submitted");
  });

  test("row menu: Withdraw is offered only when allowed, and works from the table", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?limit=50");
    await rowFor(page, SEED.hired)
      .getByRole("button", { name: /Row actions/ })
      .click();
    await expect(
      page.getByRole("menuitem", { name: "View detail" }),
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: "Withdraw application" }),
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    await rowFor(page, SEED.rowMenu)
      .getByRole("button", { name: /Row actions/ })
      .click();
    await page.getByRole("menuitem", { name: "Withdraw application" }).click();
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(
      page.getByText(`${displayId(SEED.rowMenu)} has been withdrawn.`),
    ).toBeVisible();
    await expect(rowFor(page, SEED.rowMenu)).toContainText("Withdrawn");
  });

  test("EX.6 dropping a card on a company-only column, or dragging a closed card, does nothing", async ({
    candidate: page,
  }) => {
    let patches = 0;
    page.on("request", (request) => {
      if (request.method() === "PATCH") patches += 1;
    });
    await page.goto("/my-applications?view=board&limit=50");
    await dragCard(
      page,
      page.locator('[draggable="true"]', { hasText: displayId(SEED.drag) }),
      page.getByRole("region", { name: "Interviewing" }),
    );
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Submitted" })).toContainText(
      displayId(SEED.drag),
    );
    // While a card is held, the company-only columns say so and only Withdrawn is a target.
    await expect(
      page.locator('[draggable="true"]', { hasText: displayId(SEED.hired) }),
    ).toHaveCount(0);
    expect(patches).toBe(0);
    expect(await statusOf(SEED.drag)).toBe("submitted");
  });

  test("AC.2 dragging a card onto the Withdrawn target confirms and withdraws only that application", async ({
    candidate: page,
  }) => {
    await page.goto("/my-applications?view=board&limit=50");
    const card = page.locator('[draggable="true"]', {
      hasText: displayId(SEED.drag),
    });
    await dragCard(
      page,
      card,
      page.getByRole("region", { name: "Withdraw drop target" }),
      async () => {
        await expect(
          page.getByRole("region", { name: "Interviewing" }),
        ).toContainText("Company only");
      },
    );
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      displayId(SEED.drag),
    );
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(
      page.getByText(`${displayId(SEED.drag)} has been withdrawn.`),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: "Withdrawn", exact: true }),
    ).toContainText(displayId(SEED.drag));
    expect(await statusOf(SEED.drag)).toBe("withdrawn");
    expect(await statusOf(SEED.bulkA)).toBe("submitted");
  });

  test("AC.3 several applications: one confirmation, per-application result, failures stay listed", async ({
    candidate: page,
  }) => {
    await page.route(withdrawUrl(SEED.bulkB), (route) =>
      route.fulfill({ status: 409, json: { message: "changed" } }),
    );
    await page.goto("/my-applications?view=board&limit=50");
    await page
      .getByRole("checkbox", { name: `Select ${displayId(SEED.bulkA)}` })
      .click();
    await page
      .getByRole("checkbox", { name: `Select ${displayId(SEED.bulkB)}` })
      .click();
    await expect(page.getByText("2 selected")).toBeVisible();
    await page.getByRole("button", { name: "Clear" }).click();
    await expect(page.getByText("2 selected")).toHaveCount(0);
    await page
      .getByRole("checkbox", { name: `Select ${displayId(SEED.bulkA)}` })
      .click();
    await page
      .getByRole("checkbox", { name: `Select ${displayId(SEED.bulkB)}` })
      .click();
    await page.getByRole("button", { name: "Withdraw", exact: true }).click();
    await dialog(page, "Withdraw 2 applications?")
      .getByRole("button", { name: "Withdraw 2 applications" })
      .click();
    await expect(dialog(page, "Withdraw this application?")).toContainText(
      "1 withdrawn, 1 left unchanged.",
    );
    expect(await statusOf(SEED.bulkA)).toBe("withdrawn");
    expect(await statusOf(SEED.bulkB)).toBe("under_review");
    // The failed one stays listed; once the company no longer interferes it can be withdrawn.
    await page.unroute(withdrawUrl(SEED.bulkB));
    await dialog(page, "Withdraw this application?")
      .getByRole("button", { name: "Withdraw application" })
      .click();
    await expect(
      page.getByText(`${displayId(SEED.bulkB)} has been withdrawn.`),
    ).toBeVisible();
    expect(await statusOf(SEED.bulkB)).toBe("withdrawn");
  });

  test("BR-APP-008 after withdrawing a first application, the pair still allows only one active record", async () => {
    const list = (await api(ACCOUNTS.demo, "/api/v1/me/applications?limit=100"))
      .json as {
      items: { status: string; canApplyAgain: boolean; id: string }[];
    };
    const again = list.items
      .filter((item) => item.canApplyAgain)
      .map((item) => item.id);
    expect(again).toContain(applicationId(SEED.withdrawnOpen));
    expect(again).toContain(applicationId(SEED.submitted));
    expect(again).not.toContain(applicationId(SEED.withdrawnLinked));
  });
});
