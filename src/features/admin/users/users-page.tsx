import { Plus } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { TableSurface } from "@/components/common/data-table";
import { Button } from "@/components/ui/button";
import { adminUserPath } from "@/config/routes";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";

import { SuspendUserDialog } from "./suspend-user-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";
import { ALL_FILTER, type UserRoleFilter, type UserStatusFilter } from "./users.constants";
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, useUsersListQuery } from "./users.queries";

type Dialog = { kind: "create" } | { kind: "edit"; user: UserDto } | { kind: "suspend"; user: UserDto } | null;

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { page, limit, search, set } = useListParams({ defaultLimit: DEFAULT_PAGE_SIZE });
  const [role, setRole] = useState<UserRoleFilter>(ALL_FILTER);
  const [status, setStatus] = useState<UserStatusFilter>(ALL_FILTER);
  const [dialog, setDialog] = useState<Dialog>(null);

  const listQuery = useUsersListQuery({
    limit,
    page,
    ...(role !== ALL_FILTER ? { role } : {}),
    ...(status !== ALL_FILTER ? { status } : {}),
    ...(search ? { search } : {}),
  });

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
        onSearchChange={(value) => {
          set("search", value);
          set("page", "1");
        }}
        onStatusChange={(next) => {
          setStatus(next);
          set("page", "1");
        }}
        role={role}
        search={search}
        status={status}
      />

      <TableSurface className="rounded-2xl">
        <UsersTable
          isLoading={listQuery.isLoading}
          items={users}
          onEdit={(user) => setDialog({ kind: "edit", user })}
          onSuspend={(user) => setDialog({ kind: "suspend", user })}
          onView={(user) => navigate(adminUserPath(user.id))}
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
