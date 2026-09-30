import { act, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminUserDetailPage } from "@/features/admin/users/user-detail-page";
import { UsersPage } from "@/features/admin/users/users-page";
import * as usersQueries from "@/features/admin/users/users.queries";

const user = {
  createdAt: "2026-01-01T00:00:00.000Z",
  email: "dev@example.com",
  emailVerified: true,
  enterpriseId: null,
  id: "6a4a5424c8097df77a6ed9be",
  role: "user",
  status: "active",
  username: "johndoe",
};

function mockList(items: unknown[], total = items.length) {
  vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
    data: { items, limit: 10, page: 1, total, totalPages: total ? 1 : 0 },
    isLoading: false,
  } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
}

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}

function renderList(path = "/admin/users") {
  render(
    <MemoryRouter initialEntries={[path]}>
      <UsersPage />
      <LocationProbe />
    </MemoryRouter>,
  );
}

const lastListParams = (spy: { mock: { calls: unknown[][] } }) => spy.mock.calls.at(-1)?.[0] as Record<string, unknown>;

afterEach(() => vi.restoreAllMocks());

describe("UsersPage", () => {
  it("renders the header, filters and one row per user with backed columns only", () => {
    mockList([user, { ...user, email: "admin@example.com", id: "7b4a5424c8097df77a6ed9bf", role: "admin", username: "adminboss" }]);
    renderList();

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("2 accounts in your authorized scope")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /create user/i })).toBeInTheDocument();
    expect(screen.getByText("Role:")).toBeInTheDocument();
    expect(screen.getByText("Status:")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /johndoe/ })).toHaveAttribute("href", "/admin/users/6a4a5424c8097df77a6ed9be");
    expect(screen.getByText("dev@example.com")).toBeInTheDocument();
    expect(screen.getByText("Applicant")).toBeInTheDocument();
    expect(screen.getByText("Email:")).toBeInTheDocument();
    // Full name and phone are not stored yet, so there is no column for them.
    expect(screen.queryByRole("columnheader", { name: /mobile/i })).not.toBeInTheDocument();
  });

  it("shows each account's email status", () => {
    mockList([user, { ...user, emailVerified: false, id: "7b4a5424c8097df77a6ed9bf", username: "newcomer" }]);
    renderList();

    expect(screen.getByRole("columnheader", { name: /email status/i })).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.getByText("Unverified")).toBeInTheDocument();
  });

  it("keeps every typed character and puts the term in the URL once typing pauses", () => {
    vi.useFakeTimers();
    try {
      mockList([user]);
      renderList("/admin/users?page=3");
      const box = screen.getByRole("searchbox");

      // Several changes before the router could answer: none may be lost.
      fireEvent.change(box, { target: { value: "f" } });
      fireEvent.change(box, { target: { value: "fl" } });
      fireEvent.change(box, { target: { value: "flakeian" } });
      expect(box).toHaveValue("flakeian");
      expect(screen.getByTestId("location")).toHaveTextContent("?page=3");

      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByTestId("location")).toHaveTextContent("?search=flakeian");
      expect(screen.getByTestId("location")).not.toHaveTextContent("page=3");
      expect(box).toHaveValue("flakeian");
      expect(box).toHaveAttribute("placeholder", "Search by name or email…");
    } finally {
      vi.useRealTimers();
    }
  });

  it("shows the search term from the URL and clears it back to all accounts", () => {
    vi.useFakeTimers();
    try {
      const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
        data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
        isLoading: false,
      } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
      renderList("/admin/users?search=johndoe");

      expect(screen.getByRole("searchbox")).toHaveValue("johndoe");
      expect(lastListParams(spy)).toMatchObject({ search: "johndoe" });

      fireEvent.change(screen.getByRole("searchbox"), { target: { value: "" } });
      act(() => vi.advanceTimersByTime(300));

      expect(screen.getByTestId("location")).toHaveTextContent(/^$/);
      expect(lastListParams(spy)).not.toHaveProperty("search");
    } finally {
      vi.useRealTimers();
    }
  });

  it("asks for the newest accounts first by default", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList();

    expect(lastListParams(spy)).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("sorts by a column header, flips the direction on a second click and returns to the first page", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 30, totalPages: 3 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?page=2");

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^email$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ page: 1, sortBy: "email", sortOrder: "asc" });
    expect(screen.getByTestId("location")).toHaveTextContent("sortBy=email");

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^email$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ sortBy: "email", sortOrder: "desc" });

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^name$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ sortBy: "username", sortOrder: "asc" });

    fireEvent.click(within(screen.getByRole("columnheader", { name: /^id$/i })).getByRole("button"));
    expect(lastListParams(spy)).toMatchObject({ sortBy: "id", sortOrder: "asc" });
  });

  it("filters by email status and returns to the first page", async () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 30, totalPages: 3 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?page=2");
    const userEvents = userEvent.setup();

    await userEvents.click(screen.getByRole("button", { name: /email:/i }));
    // The only "Unverified" on screen is the filter option (the fixture account is verified).
    await userEvents.click(await screen.findByText("Unverified"));

    expect(lastListParams(spy)).toMatchObject({ emailVerified: false });
    expect(screen.getByTestId("location")).not.toHaveTextContent("page=2");
  });

  it("only offers sorting for the columns the API can sort by", () => {
    mockList([user]);
    renderList();

    for (const name of [/^id$/i, /^name$/i, /^email$/i, /^created$/i]) {
      expect(within(screen.getByRole("columnheader", { name })).getByRole("button")).toBeInTheDocument();
    }
    for (const name of [/^role$/i, /email status/i, /account status/i]) {
      expect(within(screen.getByRole("columnheader", { name })).queryByRole("button")).not.toBeInTheDocument();
    }
  });

  it("ignores an unsupported sort column in the URL", () => {
    const spy = vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: { items: [user], limit: 10, page: 1, total: 1, totalPages: 1 },
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUsersListQuery>);
    renderList("/admin/users?sortBy=password_hash&sortOrder=sideways");

    expect(lastListParams(spy)).toMatchObject({ sortBy: "createdAt", sortOrder: "desc" });
  });

  it("shows the table header and an empty message without a count when the API has no users", () => {
    mockList([]);
    renderList();

    expect(screen.getByRole("columnheader", { name: "ID" })).toBeInTheDocument();
    expect(screen.getByText("No users found.")).toBeInTheDocument();
    expect(screen.queryByText(/accounts in your authorized scope/)).not.toBeInTheDocument();
  });

  it("opens the create dialog with a disabled submit while the API is read-only", () => {
    mockList([]);
    renderList();

    fireEvent.click(screen.getByRole("button", { name: /create user/i }));

    expect(screen.getByRole("dialog", { name: "Create internal user" })).toBeInTheDocument();
    expect(screen.getByText(/saving changes isn't available yet/i)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: "Create user" }).at(-1)).toBeDisabled();
  });
});

describe("AdminUserDetailPage", () => {
  function renderDetail() {
    vi.spyOn(usersQueries, "useUserDetailQuery").mockReturnValue({
      data: user,
      error: null,
      isLoading: false,
    } as unknown as ReturnType<typeof usersQueries.useUserDetailQuery>);
    render(
      <MemoryRouter initialEntries={["/admin/users/6a4a5424c8097df77a6ed9be"]}>
        <Routes>
          <Route element={<AdminUserDetailPage />} path="/admin/users/:userId" />
        </Routes>
      </MemoryRouter>,
    );
  }

  it("shows only the account fields the API returns, with Edit and Suspend actions", () => {
    renderDetail();

    expect(screen.getByRole("heading", { name: "johndoe" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Users" })).toHaveAttribute("href", "/admin/users");
    expect(screen.getByText("Account information")).toBeInTheDocument();
    expect(screen.getByText("Account ID")).toBeInTheDocument();
    expect(screen.getByText("Email status")).toBeInTheDocument();
    expect(screen.getByText("Verified")).toBeInTheDocument();
    expect(screen.queryByText("Activity")).not.toBeInTheDocument();
    expect(screen.queryByText(/audit history/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/last sign-in/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("opens the suspend confirmation but keeps the confirm action disabled", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Suspend" }));

    expect(screen.getByRole("alertdialog")).toHaveTextContent("Suspend johndoe?");
    expect(screen.getByRole("button", { name: "Suspend account" })).toBeDisabled();
  });

  it("edits with a read-only status", () => {
    renderDetail();

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));

    expect(screen.getByRole("dialog", { name: "Edit user" })).toBeInTheDocument();
    expect(screen.getByText(/status can't be changed in this form/i)).toBeInTheDocument();
  });
});
