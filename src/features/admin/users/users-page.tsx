import { Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { TableSurface } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { adminUserPath } from "@/config/routes";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

import { SuspendUserDialog } from "./suspend-user-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";
import {
  ALL_FILTER,
  USER_DEFAULT_SORT,
  USER_SORT_FIELDS,
  USER_SORT_PARAM,
  type UserEmailFilter,
  type UserRoleFilter,
  type UserSortField,
  type UserSortOrder,
  type UserStatusFilter,
} from "./users.constants";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, useUsersListQuery } from "./users.queries";

type Dialog = { kind: "create" } | { kind: "edit"; user: UserDto } | { kind: "suspend"; user: UserDto } | null;

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { page, limit, search, set, setMany } = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const sortBy = USER_SORT_FIELDS.find((field) => field === searchParams.get(USER_SORT_PARAM.sortBy)) ?? USER_DEFAULT_SORT.sortBy;
  const rawOrder = searchParams.get(USER_SORT_PARAM.sortOrder);
  const sortOrder: UserSortOrder = rawOrder === "asc" || rawOrder === "desc" ? rawOrder : USER_DEFAULT_SORT.sortOrder;
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);
  const [role, setRole] = useState<UserRoleFilter>(ALL_FILTER);
  const [status, setStatus] = useState<UserStatusFilter>(ALL_FILTER);
  const [email, setEmail] = useState<UserEmailFilter>(ALL_FILTER);
  const [dialog, setDialog] = useState<Dialog>(null);

  const listQuery = useUsersListQuery({
    limit,
    page,
    ...(role !== ALL_FILTER ? { role } : {}),
    ...(status !== ALL_FILTER ? { status } : {}),
    ...(email !== ALL_FILTER ? { emailVerified: email === "verified" } : {}),
    ...(search ? { search } : {}),
    sortBy,
    sortOrder,
  });

  // Clicking the active column flips its direction; a new column starts at the default (newest / A-Z order).
  function changeSort(field: UserSortField) {
    const nextOrder: UserSortOrder = field === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
    setMany({ [USER_SORT_PARAM.sortBy]: field, [USER_SORT_PARAM.sortOrder]: nextOrder });
  }

  const users = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        actions={
          <Button className="h-11 px-5" onClick={() => setDialog({ kind: "create" })} shape="pill" type="button">
            <Plus aria-hidden className="size-4" />
            {t("adminUsers.page.create")}
          </Button>
        }
        description={total > 0 ? t("adminUsers.page.count", { count: total }) : undefined}
        title={t("adminUsers.page.title")}
      />

      <UsersToolbar
        onRoleChange={(next) => {
          setRole(next);
          set("page", "1");
        }}
        email={email}
        onEmailChange={(next) => {
          setEmail(next);
          set("page", "1");
        }}
        onSearchChange={setSearchText}
        onStatusChange={(next) => {
          setStatus(next);
          set("page", "1");
        }}
        role={role}
        search={searchText}
        status={status}
      />

      <TableSurface className="rounded-2xl">
        <UsersTable
          isLoading={listQuery.isLoading}
          items={users}
          onEdit={(user) => setDialog({ kind: "edit", user })}
          onSort={changeSort}
          onSuspend={(user) => setDialog({ kind: "suspend", user })}
          onView={(user) => navigate(adminUserPath(user.id))}
          sortBy={sortBy}
          sortOrder={sortOrder}
        />
      </TableSurface>

      <Pagination
        limit={limit}
        onLimitChange={(next) => {
          set("limit", String(next));
          set("page", "1");
        }}
        onPageChange={(next) => set("page", String(next))}
        page={page}
        pageSizeOptions={PAGE_SIZE_OPTIONS}
        total={total}
        totalPages={totalPages}
      />

      <UserFormDialog onOpenChange={(open) => !open && setDialog(null)} open={dialog?.kind === "create"} />
      {dialog?.kind === "edit" ? <UserFormDialog onOpenChange={(open) => !open && setDialog(null)} open user={dialog.user} /> : null}
      {dialog?.kind === "suspend" ? <SuspendUserDialog onOpenChange={(open) => !open && setDialog(null)} open user={dialog.user} /> : null}
    </div>
  );
}
