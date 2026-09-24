import { MemoryRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { UsersPage } from "@/features/admin/users/users-page";
import * as usersQueries from "@/features/admin/users/users.queries";

describe("UsersPage", () => {
  it("renders page header and user table with items", () => {
    vi.spyOn(usersQueries, "useUsersListQuery").mockReturnValue({
      data: {
        items: [
          {
            id: "6a4a5424c8097df77a6ed9be",
            email: "dev@example.com",
            username: "johndoe",
            role: "user",
            status: "active",
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "7b4a5424c8097df77a6ed9bf",
            email: "admin@example.com",
            username: "adminboss",
            role: "admin",
            status: "active",
            createdAt: "2026-01-02T00:00:00.000Z",
          },
        ],
        limit: 10,
        page: 1,
        total: 2,
        totalPages: 1,
      },
      isLoading: false,
    } as ReturnType<typeof usersQueries.useUsersListQuery>);

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <UsersPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("dev@example.com")).toBeInTheDocument();
    expect(screen.getByText("adminboss")).toBeInTheDocument();
  });
});
