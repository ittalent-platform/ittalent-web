import { useState } from "react";
import { useNavigate } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { TableSurface } from "@/components/common/data-table";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";

import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";
import { DEFAULT_PAGE_SIZE, useUsersListQuery } from "./users.queries";

type RoleFilter = "user" | "admin" | "all";
type StatusFilter = "active" | "inactive" | "suspended" | "all";

export function UsersPage() {
  const navigate = useNavigate();
  const { page, limit, search, set } = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const [role, setRole] = useState<RoleFilter>("all");
  const [status, setStatus] = useState<StatusFilter>("all");

  const listQuery = useUsersListQuery({
    limit,
    page,
    ...(role !== "all" ? { role } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(search ? { search } : {}),
  });

  const users = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  function handleSearchChange(value: string) {
    set("search", value);
    set("page", "1");
  }

  function handlePageChange(newPage: number) {
    set("page", String(newPage));
  }

  function handleLimitChange(newLimit: number) {
    set("limit", String(newLimit));
    set("page", "1");
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        description="View and inspect registered user accounts and system permissions."
        title="Users"
      />

      <UsersToolbar
        onRoleChange={(r) => {
          setRole(r);
          set("page", "1");
        }}
        onSearchChange={handleSearchChange}
        onStatusChange={(s) => {
          setStatus(s);
          set("page", "1");
        }}
        role={role}
        search={search}
        status={status}
      />

      <TableSurface>
        <UsersTable
          isLoading={listQuery.isLoading}
          items={users}
          onView={(user: UserDto) => navigate(`/admin/users/${user.id}`)}
        />
      </TableSurface>

      {total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={handleLimitChange}
          onPageChange={handlePageChange}
          page={page}
          total={total}
          totalPages={totalPages}
        />
      ) : null}
    </div>
  );
}
