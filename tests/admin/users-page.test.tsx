import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdminUserDetailPage } from "@/features/admin/users/user-detail-page";
import { UsersPage } from "@/features/admin/users/users-page";
import * as usersQueries from "@/features/admin/users/users.queries";

const user = {
  createdAt: "2026-01-01T00:00:00.000Z",
  email: "dev@example.com",
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

function renderList() {
  render(
    <MemoryRouter initialEntries={["/admin/users"]}>
      <UsersPage />
    </MemoryRouter>,
  );
}

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
    expect(screen.queryByRole("columnheader", { name: /mobile/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: /email status/i })).not.toBeInTheDocument();
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
