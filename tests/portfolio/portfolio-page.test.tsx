import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/api/generated";
import type { PortfolioLink } from "@/api/generated/types.gen";
import { ToastProvider } from "@/components/toast/toast-provider";
import { validatePortfolioItem } from "@/features/portfolio/portfolio-form-dialog";
import { PortfolioPage } from "@/features/portfolio/portfolio-page";

vi.mock("@/api/generated", () => ({
  deleteApiV1MePortfolioLinksById: vi.fn(),
  getApiV1MePortfolioLinks: vi.fn(),
  patchApiV1MePortfolioLinksById: vi.fn(),
  postApiV1MePortfolioLinks: vi.fn(),
}));

const item = (over: Partial<PortfolioLink>): PortfolioLink => ({
  createdAt: "2026-10-01T00:00:00.000Z", description: "Led a 6-person team to ship a loan dashboard.", id: "p1", title: "Fintech loan dashboard", updatedAt: "2026-10-03T00:00:00.000Z",
  url: "https://www.anguyen.dev/work/loan-dashboard", version: 3, ...over,
});
const list = (items: PortfolioLink[], extra: object = {}) => ({ data: { items, limit: 20, page: 1, total: items.length, totalPages: items.length ? 1 : 0, ...extra }, response: { ok: true, status: 200 } });
const ok = (data: unknown, status = 200) => ({ data, response: { ok: true, status } }) as never;
const fail = (status: number, code?: string) => ({ error: { code, message: "no" }, response: { ok: false, status } }) as never;

function renderPage(path = "/portfolio") {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider><MemoryRouter initialEntries={[path]}><PortfolioPage /></MemoryRouter></ToastProvider>
    </QueryClientProvider>,
  );
}

const menu = async (name: string, action: string | RegExp) => {
  fireEvent.pointerDown(await screen.findByRole("button", { name: `Actions for ${name}` }), { button: 0, ctrlKey: false });
  fireEvent.click(await screen.findByRole("menuitem", { name: action }));
};
const fill = (label: string, value: string) => fireEvent.change(screen.getByLabelText(new RegExp(`^${label}`)), { target: { value } });

describe("Portfolio page (UC-S4-PORT-01..04, 06)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.getApiV1MePortfolioLinks).mockResolvedValue(list([
      item({}),
      item({ description: null, id: "p2", title: "Talk: Running Scrum", url: "http://youtube.com/watch?v=1", version: 1 }),
    ]) as never);
  });

  it("lists title, description, host, version and flags a link that is not HTTPS", async () => {
    renderPage();
    expect(await screen.findByText("Fintech loan dashboard")).toBeInTheDocument();
    expect(screen.getByText("Led a 6-person team to ship a loan dashboard.")).toBeInTheDocument();
    expect(screen.getByText("anguyen.dev")).toBeInTheDocument();
    expect(screen.getByText("Version 3")).toBeInTheDocument();
    expect(screen.getByText("No description")).toBeInTheDocument();
    expect(screen.getAllByText("Not HTTPS")).toHaveLength(1);
    expect(screen.getByText("Showing 1–2 of 2")).toBeInTheDocument();
  });

  it("shows the empty state with a way to add the first item", async () => {
    vi.mocked(api.getApiV1MePortfolioLinks).mockResolvedValue(list([]) as never);
    renderPage();
    expect(await screen.findByText("No portfolio items yet")).toBeInTheDocument();
    expect(screen.queryByPlaceholderText("Search title, description or link")).not.toBeInTheDocument();
  });

  it("says the list didn't load and tries again, never showing an empty list", async () => {
    vi.mocked(api.getApiV1MePortfolioLinks).mockResolvedValueOnce(fail(500)).mockResolvedValue(list([item({})]) as never);
    renderPage();
    expect(await screen.findByText("Your portfolio didn't load")).toBeInTheDocument();
    expect(screen.queryByText("No portfolio items yet")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Fintech loan dashboard")).toBeInTheDocument();
  });

  it("asks to sign in again when the session or access changed", async () => {
    vi.mocked(api.getApiV1MePortfolioLinks).mockResolvedValue(fail(401));
    renderPage();
    expect(await screen.findByText("Sign in again to see your portfolio")).toBeInTheDocument();
  });

  it("falls back to the first page when the page in the link doesn't exist", async () => {
    vi.mocked(api.getApiV1MePortfolioLinks).mockImplementation((async ({ query }: { query: { page: number } }) =>
      query.page > 1 ? list([], { page: query.page, total: 1, totalPages: 1 }) : list([item({})])) as never);
    renderPage("/portfolio?page=4");
    expect(await screen.findByText("Fintech loan dashboard")).toBeInTheDocument();
    // The notice stays once the first page is showing, until the user pages or searches.
    expect(screen.getByText("That page doesn't exist")).toBeInTheDocument();
    expect(screen.getByText("Showing the first page of your portfolio.")).toBeInTheDocument();
  });

  describe("search", () => {
    // The field's own "x" and the action under it share a name: the action is the last one on the page.
    const clearAction = () => screen.getAllByRole("button", { name: "Clear search" }).at(-1) as HTMLElement;
    const search = async (text: string) => fireEvent.change(await screen.findByPlaceholderText("Search title, description or link"), { target: { value: text } });

    it("sends the keyword, says how many results, and clears with one action", async () => {
      renderPage();
      await search("dashboard");
      await waitFor(() => expect(api.getApiV1MePortfolioLinks).toHaveBeenLastCalledWith({ query: { keyword: "dashboard", limit: 20, page: 1 } }), { timeout: 3000 });
      expect(await screen.findByText(/2 results for “dashboard”/)).toBeInTheDocument();
      fireEvent.click(clearAction());
      await waitFor(() => expect(api.getApiV1MePortfolioLinks).toHaveBeenLastCalledWith({ query: { limit: 20, page: 1 } }), { timeout: 3000 });
    });

    it("keeps the typed text and offers to clear when nothing matches", async () => {
      renderPage();
      await search("kotlin");
      vi.mocked(api.getApiV1MePortfolioLinks).mockResolvedValue(list([]) as never);
      expect(await screen.findByText("Nothing matches “kotlin”", undefined, { timeout: 3000 })).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Search title, description or link")).toHaveValue("kotlin");
      fireEvent.click(clearAction());
      expect(screen.getByPlaceholderText("Search title, description or link")).toHaveValue("");
    });

    it("searches nothing while the text is longer than 100 characters", async () => {
      renderPage();
      await search("a".repeat(101));
      expect(await screen.findByText("Use up to 100 characters.")).toBeInTheDocument();
      await new Promise((resolve) => setTimeout(resolve, 900));
      expect(api.getApiV1MePortfolioLinks).toHaveBeenCalledTimes(1);
    });
  });

  describe("add", () => {
    const open = async () => {
      fireEvent.click(await screen.findByRole("button", { name: "Add portfolio item" }));
      return screen.findByRole("dialog", { name: "Add portfolio item" });
    };

    it("asks for a title and an allowed link before sending anything", async () => {
      renderPage();
      const dialog = await open();
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      expect(await within(dialog).findByText("Title is required.")).toBeInTheDocument();
      expect(within(dialog).getByText("Link is required.")).toBeInTheDocument();
      fill("Link", "https://an:secret@anguyen.dev/work");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      expect(await within(dialog).findByText(/without a username or password in it/)).toBeInTheDocument();
      fill("Link", "javascript:alert(1)");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      expect(await within(dialog).findByText(/This link isn't allowed/)).toBeInTheDocument();
      expect(api.postApiV1MePortfolioLinks).not.toHaveBeenCalled();
    });

    it("adds an item without a description, then shows the toast", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockResolvedValue(ok(item({ description: null, id: "p3", title: "Mobile wallet", version: 1 }), 201));
      renderPage();
      await open();
      fill("Title", " Mobile wallet ");
      fill("Link", "https://anguyen.dev/work/wallet");
      fireEvent.click(screen.getByRole("button", { name: "Add item" }));
      await waitFor(() => expect(api.postApiV1MePortfolioLinks).toHaveBeenCalledWith({ body: { title: "Mobile wallet", url: "https://anguyen.dev/work/wallet" }, headers: { "Idempotency-Key": expect.any(String) } }));
      expect(await screen.findByText("Portfolio item added.")).toBeInTheDocument();
    });

    it("sends the description when there is one", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockResolvedValue(ok(item({ id: "p3" }), 201));
      renderPage();
      await open();
      fill("Title", "Mobile wallet");
      fill("Link", "https://anguyen.dev/work/wallet");
      fill("Description", "Sign-up completion up 18%.");
      fireEvent.click(screen.getByRole("button", { name: "Add item" }));
      await waitFor(() => expect(api.postApiV1MePortfolioLinks).toHaveBeenCalledWith(expect.objectContaining({ body: { description: "Sign-up completion up 18%.", title: "Mobile wallet", url: "https://anguyen.dev/work/wallet" } })));
    });

    it("says the link is already in the list and creates nothing", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockResolvedValue(fail(409, "DUPLICATE_PORTFOLIO_URL"));
      renderPage();
      const dialog = await open();
      fill("Title", "Again");
      fill("Link", "https://github.com/anguyen/delivery-metrics");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      expect(await within(dialog).findByText("You already added this link.")).toBeInTheDocument();
    });

    it("keeps the form and says nothing was added when saving fails", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockResolvedValue(fail(500));
      renderPage();
      const dialog = await open();
      fill("Title", "Mobile wallet");
      fill("Link", "https://anguyen.dev/work/wallet");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      expect(await within(dialog).findByText("Couldn't save the portfolio item. Nothing was added. Please try again.")).toBeInTheDocument();
      expect(within(dialog).getByLabelText(/^Title/)).toHaveValue("Mobile wallet");
    });

    it("uses a new key when the entries changed after a failed attempt, and the same key when they did not", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockResolvedValueOnce(fail(500)).mockResolvedValueOnce(fail(500)).mockResolvedValue(ok(item({ id: "p3" })));
      renderPage();
      const dialog = await open();
      fill("Title", "Mobile wallet");
      fill("Link", "https://anguyen.dev/work/wallet");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      await within(dialog).findByText(/Nothing was added/);
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      await waitFor(() => expect(api.postApiV1MePortfolioLinks).toHaveBeenCalledTimes(2));
      fill("Title", "Mobile wallet onboarding");
      fireEvent.click(within(dialog).getByRole("button", { name: "Add item" }));
      await waitFor(() => expect(api.postApiV1MePortfolioLinks).toHaveBeenCalledTimes(3));
      const keys = vi.mocked(api.postApiV1MePortfolioLinks).mock.calls.map(([options]) => (options.headers as Record<string, string>)["Idempotency-Key"]);
      expect(keys[1]).toBe(keys[0]);
      expect(keys[2]).not.toBe(keys[0]);
    });

    it("asks again with the same key when the connection drops, so it is never added twice", async () => {
      vi.mocked(api.postApiV1MePortfolioLinks).mockRejectedValueOnce(new TypeError("Failed to fetch")).mockResolvedValue(ok(item({ id: "p3" })));
      renderPage();
      await open();
      fill("Title", "Mobile wallet");
      fill("Link", "https://anguyen.dev/work/wallet");
      fireEvent.click(screen.getByRole("button", { name: "Add item" }));
      expect(await screen.findByText("Portfolio item added.")).toBeInTheDocument();
      const [first, second] = vi.mocked(api.postApiV1MePortfolioLinks).mock.calls;
      expect(api.postApiV1MePortfolioLinks).toHaveBeenCalledTimes(2);
      expect(second?.[0].headers).toEqual(first?.[0].headers);
    });
  });

  describe("edit", () => {
    const open = async () => {
      renderPage();
      await menu("Fintech loan dashboard", "Edit");
      return screen.findByRole("dialog", { name: "Edit portfolio item" });
    };

    it("shows the version and sends only the link when only the link changed", async () => {
      vi.mocked(api.patchApiV1MePortfolioLinksById).mockResolvedValue(ok(item({ version: 4 })));
      const dialog = await open();
      expect(within(dialog).getByText("Version 3 · last changed 3 Oct 2026.")).toBeInTheDocument();
      fill("Link", "https://anguyen.dev/case-studies/loan-dashboard");
      expect(within(dialog).getByText("Changed from anguyen.dev/work/loan-dashboard")).toBeInTheDocument();
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(api.patchApiV1MePortfolioLinksById).toHaveBeenCalledWith({ body: { expectedVersion: 3, url: "https://anguyen.dev/case-studies/loan-dashboard" }, path: { id: "p1" } }));
      expect(await screen.findByText("Portfolio item saved.")).toBeInTheDocument();
    });

    it("clears the description by sending null", async () => {
      vi.mocked(api.patchApiV1MePortfolioLinksById).mockResolvedValue(ok(item({ description: null, version: 4 })));
      const dialog = await open();
      fill("Description", "  ");
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(api.patchApiV1MePortfolioLinksById).toHaveBeenCalledWith({ body: { description: null, expectedVersion: 3 }, path: { id: "p1" } }));
    });

    it("closes without a request when nothing changed", async () => {
      const dialog = await open();
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      await waitFor(() => expect(screen.queryByRole("dialog", { name: "Edit portfolio item" })).not.toBeInTheDocument());
      expect(api.patchApiV1MePortfolioLinksById).not.toHaveBeenCalled();
    });

    it.each([
      ["a newer version exists", 409, "VERSION_CONFLICT", "This item changed somewhere else"],
      ["it was deleted elsewhere", 404, undefined, "This portfolio item isn't available"],
    ])("tells the user when %s", async (_name, status, code, title) => {
      vi.mocked(api.patchApiV1MePortfolioLinksById).mockResolvedValue(fail(status, code));
      const dialog = await open();
      fill("Title", "New title");
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      expect(await screen.findByRole("alertdialog", { name: title })).toBeInTheDocument();
    });

    it("keeps the form and says so when account access changed", async () => {
      vi.mocked(api.patchApiV1MePortfolioLinksById).mockResolvedValue(fail(403));
      const dialog = await open();
      fill("Title", "New title");
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      expect(await within(dialog).findByText(/because your account access changed/)).toBeInTheDocument();
    });

    it("refuses an unsafe replacement link with guidance", async () => {
      const dialog = await open();
      fill("Link", "data:text/html,hi");
      fireEvent.click(within(dialog).getByRole("button", { name: "Save changes" }));
      expect(await within(dialog).findByText(/This link isn't allowed/)).toBeInTheDocument();
      expect(api.patchApiV1MePortfolioLinksById).not.toHaveBeenCalled();
    });
  });

  describe("delete", () => {
    const open = async () => {
      renderPage();
      await menu("Fintech loan dashboard", /Delete/);
      return screen.findByRole("alertdialog", { name: "Delete this portfolio item?" });
    };

    it("names the item, says the website isn't touched, and deletes with the loaded version", async () => {
      vi.mocked(api.deleteApiV1MePortfolioLinksById).mockResolvedValue(ok(undefined, 204));
      const dialog = await open();
      expect(dialog.textContent).toContain("Fintech loan dashboard is removed from your list. Your website itself isn't touched.");
      fireEvent.click(within(dialog).getByRole("button", { name: "Delete" }));
      await waitFor(() => expect(api.deleteApiV1MePortfolioLinksById).toHaveBeenCalledWith({ path: { id: "p1" }, query: { expectedVersion: 3 } }));
      expect(await screen.findByText("Portfolio item deleted. Sent applications keep their copy.")).toBeInTheDocument();
    });

    it("keeps the item when the user keeps it", async () => {
      const dialog = await open();
      fireEvent.click(within(dialog).getByRole("button", { name: "Keep it" }));
      await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
      expect(api.deleteApiV1MePortfolioLinksById).not.toHaveBeenCalled();
      expect(screen.getByText("Fintech loan dashboard")).toBeInTheDocument();
    });

    it("asks to load the latest version when the item changed elsewhere", async () => {
      vi.mocked(api.deleteApiV1MePortfolioLinksById).mockResolvedValue(fail(409, "VERSION_CONFLICT"));
      fireEvent.click(within(await open()).getByRole("button", { name: "Delete" }));
      const dialog = await screen.findByRole("alertdialog", { name: "This item changed somewhere else" });
      expect(within(dialog).getByText("Load the latest version before deleting it.")).toBeInTheDocument();
    });

    it("says the item is still in the list when deleting fails", async () => {
      vi.mocked(api.deleteApiV1MePortfolioLinksById).mockResolvedValue(fail(500));
      fireEvent.click(within(await open()).getByRole("button", { name: "Delete" }));
      expect(await screen.findByText("Couldn't delete the portfolio item. It's still in your list. Please try again.")).toBeInTheDocument();
    });
  });

  it("validates title and a web link only", () => {
    const base = { description: "", title: "Case study", url: "https://anguyen.dev/work" };
    expect(validatePortfolioItem(base)).toEqual({});
    expect(validatePortfolioItem({ ...base, title: " " })).toHaveProperty("title");
    expect(validatePortfolioItem({ ...base, url: "" })).toHaveProperty("url", "portfolio.form.errors.urlRequired");
    expect(validatePortfolioItem({ ...base, url: "file:///etc/passwd" })).toHaveProperty("url", "portfolio.form.errors.url");
    expect(validatePortfolioItem({ ...base, url: "https://u:p@anguyen.dev" })).toHaveProperty("url", "portfolio.form.errors.urlCredentials");
  });
});
