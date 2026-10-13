import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

import type { Page } from "@playwright/test";

import {
  ACCOUNTS,
  API_URL,
  authenticatedApiResponse,
  expect,
  resetDocumentFixtures,
  signInAs,
  test,
} from "./support";
import { E2E_ACCESS_SECRET } from "./environment";

const IDS = {
  defaultCv: "00000000000000000000e101",
  secondaryCv: "00000000000000000000e102",
  deleteCv: "00000000000000000000e103",
  failedCv: "00000000000000000000e104",
  slowCv: "00000000000000000000e105",
  defaultCover: "00000000000000000000e201",
  secondaryCover: "00000000000000000000e202",
  deleteCover: "00000000000000000000e203",
  failedCover: "00000000000000000000e204",
  foreignCv: "00000000000000000000e301",
  missing: "ffffffffffffffffffffffff",
} as const;

const FILES = {
  defaultCv: "Alice_Default_CV.pdf",
  secondaryCv: "Alice_React_(Senior)_CV.pdf",
  deleteCv: "Alice_Delete_Me_CV.pdf",
  failedCv: "Alice_Storage_Failure_CV.pdf",
  slowCv: "Alice_Slow_Preview_CV.pdf",
  defaultCover: "Alice_Default_Cover_Letter.pdf",
  secondaryCover: "Alice_Product_Cover_Letter.pdf",
  deleteCover: "Alice_Delete_Me_Cover_Letter.pdf",
  failedCover: "Alice_Storage_Failure_Cover.pdf",
  foreignCv: "Bob_Private_CV.pdf",
} as const;

type DocumentItem = {
  id: string;
  fileName: string;
  type: "cv" | "cover_letter";
  isDefault: boolean;
  ownerId: string;
};

type DocumentList = {
  items: DocumentItem[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function row(page: Page, fileName: string) {
  return page.getByRole("row").filter({ hasText: fileName });
}

async function openDocuments(page: Page, account = ACCOUNTS.documentA) {
  await signInAs(page, account);
  await page.goto("/documents?limit=50");
  await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
}

async function list(account = ACCOUNTS.documentA, query = "limit=100") {
  const response = await authenticatedApiResponse(
    account,
    `/api/v1/documents?${query}`,
  );
  expect(response.status).toBe(200);
  return (await response.json()) as DocumentList;
}

function expiredAccessToken(): string {
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode({
    sub: "00000000000000000000d001",
    role: "user",
    iat: 1,
    exp: 2,
  });
  const unsigned = `${header}.${payload}`;
  const signature = createHmac("sha256", E2E_ACCESS_SECRET)
    .update(unsigned)
    .digest("base64url");
  return `${unsigned}.${signature}`;
}

test.describe("Document management — real API, database and storage", () => {
  test.beforeEach(() => {
    resetDocumentFixtures();
  });

  test("logs in and lists only Applicant A documents with metadata, defaults and pagination", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page
      .getByPlaceholder("you@example.com or username")
      .fill(ACCOUNTS.documentA);
    await page.locator("#login-password").fill("DocumentE2E123!");
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).toHaveURL(/localhost:5174\/$/);
    await page.goto("/documents?limit=5");

    await expect(page.getByRole("heading", { name: "My documents" })).toBeVisible();
    await expect(row(page, FILES.defaultCover)).toContainText("Cover letter");
    await expect(row(page, FILES.defaultCover)).toContainText("Default");
    await expect(page.getByText(/Showing 1–5 of 14/)).toBeVisible();
    await expect(page.getByText(FILES.foreignCv)).toHaveCount(0);
    await page.getByRole("button", { name: "Next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText(/Showing 6–10 of 14/)).toBeVisible();

    const mine = await list();
    expect(mine.total).toBe(14);
    expect(mine.items.every((item) => item.ownerId === "00000000000000000000d001")).toBe(true);
    expect(mine.items.some((item) => item.fileName === FILES.foreignCv)).toBe(false);
  });

  test("search handles normal, no-result, special-character, whitespace and clear states", async ({
    page,
  }) => {
    await openDocuments(page);
    const search = page.getByPlaceholder("Search by file name…");

    await search.fill("Product");
    await expect(row(page, FILES.secondaryCover)).toBeVisible();
    await expect(row(page, FILES.defaultCv)).toHaveCount(0);

    await search.fill("React_(Senior)");
    await expect(row(page, FILES.secondaryCv)).toBeVisible();
    await expect(page.getByText(FILES.foreignCv)).toHaveCount(0);

    await search.fill("no-document-has-this-name");
    await expect(page.getByRole("heading", { name: "No matching documents" })).toBeVisible();

    await search.fill("   ");
    await expect(row(page, FILES.defaultCv)).toBeVisible();
    await expect(page.getByRole("heading", { name: "No matching documents" })).toHaveCount(0);

    await search.fill("");
    await expect(page).not.toHaveURL(/search=/);
    await expect(row(page, FILES.defaultCover)).toBeVisible();
  });

  test("filters, sorting, combined search and pagination remain URL-backed and can be cleared", async ({
    page,
  }) => {
    await openDocuments(page);
    await page.getByRole("button", { name: "Cover letters" }).click();
    await expect(page).toHaveURL(/type=cover_letter/);
    await expect(row(page, FILES.defaultCover)).toBeVisible();
    await expect(page.getByText(FILES.defaultCv)).toHaveCount(0);

    await page.getByPlaceholder("Search by file name…").fill("Product");
    await expect(row(page, FILES.secondaryCover)).toBeVisible();
    await expect(row(page, FILES.defaultCover)).toHaveCount(0);

    await page.getByRole("button", { name: "All default states" }).click();
    await page.getByRole("menuitem", { name: "Default only" }).click();
    await expect(page).toHaveURL(/default=true/);
    await expect(page.getByRole("heading", { name: "No matching documents" })).toBeVisible();

    await page.getByRole("button", { name: "Clear filters" }).click();
    await expect(page).toHaveURL(/\/documents\?limit=50$/);
    await page.getByRole("button", { name: "Upload date" }).click();
    await page.getByRole("menuitem", { name: "File name" }).click();
    await page.getByRole("button", { name: "Descending" }).click();
    await page.getByRole("menuitem", { name: "Ascending" }).click();
    await expect(page).toHaveURL(/sort_by=file_name/);
    await expect(page).toHaveURL(/sort_order=asc/);

    await page.goto("/documents?limit=5&page=2");
    await expect(page.getByText(/Showing 6–10 of 14/)).toBeVisible();
    await page.getByRole("button", { name: "All documents" }).click();
    await expect(page).not.toHaveURL(/page=2/);
  });

  test("previews real CV and cover-letter PDF bytes in browser popups", async ({ page }) => {
    await openDocuments(page);
    for (const fileName of [FILES.defaultCv, FILES.defaultCover]) {
      const popupPromise = page.waitForEvent("popup");
      await page.getByRole("button", { name: `Preview ${fileName}` }).click();
      const popup = await popupPromise;
      await expect.poll(() => popup.url()).toMatch(/^blob:/);
      await popup.close();
    }

    for (const id of [IDS.defaultCv, IDS.defaultCover]) {
      const response = await authenticatedApiResponse(
        ACCOUNTS.documentA,
        `/api/v1/documents/${id}/preview`,
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/pdf");
      expect(response.headers.get("content-disposition")).toContain("inline");
      const bytes = Buffer.from(await response.arrayBuffer());
      expect(bytes.subarray(0, 8).toString()).toBe("%PDF-1.4");
      expect(bytes.toString()).toContain("ITTalent Document E2E");
    }
  });

  test("preview returns indistinguishable 404s for missing and foreign ids and reports real storage failure", async ({
    page,
  }) => {
    const notFoundBodies: unknown[] = [];
    for (const id of [IDS.missing, IDS.foreignCv]) {
      const response = await authenticatedApiResponse(
        ACCOUNTS.documentA,
        `/api/v1/documents/${id}/preview`,
      );
      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body).toMatchObject({ message: "Document not found" });
      notFoundBodies.push(body);
    }
    expect(notFoundBodies[0]).toEqual(notFoundBodies[1]);
    await openDocuments(page);
    await page.getByRole("button", { name: `Preview ${FILES.failedCv}` }).click();
    await expect(page.getByRole("status")).toContainText("Document file could not be downloaded");
  });

  test("downloads CV and cover letter through browser download events with filename, MIME and real content", async ({
    page,
  }) => {
    await openDocuments(page);
    for (const [id, fileName] of [
      [IDS.defaultCv, FILES.defaultCv],
      [IDS.defaultCover, FILES.defaultCover],
    ] as const) {
      const downloadPromise = page.waitForEvent("download");
      await page.getByRole("button", { name: `Download ${fileName}` }).click();
      const download = await downloadPromise;
      expect(download.suggestedFilename()).toBe(fileName);
      const path = await download.path();
      expect(path).not.toBeNull();
      const bytes = await readFile(path!);
      expect(bytes.subarray(0, 8).toString()).toBe("%PDF-1.4");
      expect(bytes.toString()).toContain("ITTalent Document E2E");

      const response = await authenticatedApiResponse(
        ACCOUNTS.documentA,
        `/api/v1/documents/${id}/download`,
      );
      expect(response.headers.get("content-type")).toContain("application/pdf");
      expect(response.headers.get("content-disposition")).toContain("attachment");
      await response.body?.cancel();
    }
  });

  test("download denies missing and foreign documents and surfaces a real upstream storage error", async ({
    page,
  }) => {
    for (const id of [IDS.missing, IDS.foreignCv]) {
      const response = await authenticatedApiResponse(
        ACCOUNTS.documentA,
        `/api/v1/documents/${id}/download`,
      );
      expect(response.status).toBe(404);
    }
    const failed = await authenticatedApiResponse(
      ACCOUNTS.documentA,
      `/api/v1/documents/${IDS.failedCover}/download`,
    );
    expect(failed.status).toBe(502);

    await openDocuments(page);
    await page
      .getByRole("button", { name: `Download ${FILES.failedCover}` })
      .click();
    await expect(page.getByRole("status")).toContainText("Document file could not be downloaded");
  });

  test("delete supports cancel and removes owned CV and cover letter with success feedback", async ({
    page,
  }) => {
    await openDocuments(page);
    await page.getByRole("button", { name: `Delete ${FILES.deleteCv}` }).click();
    await expect(page.getByRole("heading", { name: `Delete “${FILES.deleteCv}”?` })).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(row(page, FILES.deleteCv)).toBeVisible();

    for (const fileName of [FILES.deleteCv, FILES.deleteCover]) {
      await page.getByRole("button", { name: `Delete ${fileName}` }).click();
      await page.getByRole("button", { name: "Delete document" }).click();
      await expect(
        page.getByRole("status").filter({ hasText: `${fileName} was removed` }),
      ).toBeVisible();
      await expect(row(page, fileName)).toHaveCount(0);
    }
  });

  test("deleting a default promotes the newest remaining document and persists after reload", async ({
    page,
  }) => {
    await openDocuments(page);
    await page.getByRole("button", { name: `Delete ${FILES.defaultCv}` }).click();
    await page.getByRole("button", { name: "Delete document" }).click();
    await expect(row(page, FILES.defaultCv)).toHaveCount(0);

    const defaults = await list(ACCOUNTS.documentA, "type=cv&is_default=true&limit=100");
    expect(defaults.total).toBe(1);
    expect(defaults.items[0]?.fileName).toBe("Alice_Frontend_CV.pdf");
    await page.reload();
    await expect(row(page, "Alice_Frontend_CV.pdf")).toContainText("Default");
  });

  test("delete denies missing and foreign documents and blocks application-referenced files", async () => {
    for (const id of [IDS.missing, IDS.foreignCv]) {
      const response = await authenticatedApiResponse(
        ACCOUNTS.documentA,
        `/api/v1/documents/${id}`,
        { method: "DELETE" },
      );
      expect(response.status).toBe(404);
    }
    const applicantDocuments = await list(ACCOUNTS.demo);
    const referenced = applicantDocuments.items[0];
    expect(referenced).toBeDefined();
    const response = await authenticatedApiResponse(
      ACCOUNTS.demo,
      `/api/v1/documents/${referenced!.id}`,
      { method: "DELETE" },
    );
    expect(response.status).toBe(409);
  });

  test("sets one default per type, unsets the previous document and persists across reload", async ({
    page,
  }) => {
    await openDocuments(page);
    await page.getByRole("button", { name: `Set ${FILES.secondaryCv} as default` }).click();
    await expect(page.getByRole("status")).toContainText(`${FILES.secondaryCv} is now the default`);
    await page.getByRole("button", { name: "Cover letters" }).click();
    await page.getByRole("button", { name: `Set ${FILES.secondaryCover} as default` }).click();
    await expect(
      page.getByRole("status").filter({
        hasText: `${FILES.secondaryCover} is now the default`,
      }),
    ).toBeVisible();

    await page.reload();
    await expect(row(page, FILES.secondaryCover).getByText("Default", { exact: true })).toBeVisible();
    await expect(row(page, FILES.defaultCover).getByText("Default", { exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "CVs" }).click();
    await expect(row(page, FILES.secondaryCv).getByText("Default", { exact: true })).toBeVisible();
    await expect(row(page, FILES.defaultCv).getByText("Default", { exact: true })).toHaveCount(0);

    const mine = await list();
    for (const type of ["cv", "cover_letter"] as const) {
      expect(mine.items.filter((item) => item.type === type && item.isDefault)).toHaveLength(1);
    }
  });

  test("set-default denies a foreign id without changing either applicant", async () => {
    const beforeA = await list();
    const beforeB = await list(ACCOUNTS.documentB);
    const response = await authenticatedApiResponse(
      ACCOUNTS.documentA,
      `/api/v1/documents/${IDS.foreignCv}/default`,
      { method: "PATCH" },
    );
    expect(response.status).toBe(404);
    const afterA = await list();
    const afterB = await list(ACCOUNTS.documentB);
    expect(afterA.items.filter((item) => item.isDefault).map((item) => item.id)).toEqual(
      beforeA.items.filter((item) => item.isDefault).map((item) => item.id),
    );
    expect(afterB.items.filter((item) => item.isDefault).map((item) => item.id)).toEqual(
      beforeB.items.filter((item) => item.isDefault).map((item) => item.id),
    );
  });

  test("guest, missing, invalid and expired access tokens cannot read documents", async ({
    browser,
    page,
  }) => {
    const guestContext = await browser.newContext();
    const guest = await guestContext.newPage();
    await guest.goto("http://localhost:5174/documents");
    await expect(guest).toHaveURL(/\/login/);
    await guestContext.close();

    const authHeaders = [
      undefined,
      { authorization: "Bearer not-a-jwt" },
      { authorization: `Bearer ${expiredAccessToken()}` },
    ];
    for (const headers of authHeaders) {
      const response = await fetch(`${API_URL}/api/v1/documents`, { headers });
      expect(response.status).toBe(401);
    }

    await signInAs(page, ACCOUNTS.documentA);
    await page.addInitScript((expired) => {
      localStorage.setItem("ittalent_access_token", expired);
      localStorage.removeItem("ittalent_refresh_token");
    }, expiredAccessToken());
    await page.goto("/documents");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows empty, real loading/error feedback and remains operable at a mobile viewport", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDocuments(page, ACCOUNTS.empty);
    await expect(page.getByRole("heading", { name: "No documents yet" })).toBeVisible();

    await openDocuments(page);
    const slowButton = page.getByRole("button", { name: `Preview ${FILES.slowCv}` });
    await slowButton.click();
    await expect(slowButton).toBeDisabled();
    await expect.poll(() => slowButton.isEnabled()).toBe(true);

    await page.getByRole("button", { name: `Download ${FILES.failedCv}` }).click();
    await expect(page.getByRole("status")).toContainText("Document file could not be downloaded");
    await expect(page.getByRole("button", { name: `Delete ${FILES.deleteCv}` })).toBeVisible();
  });
});
