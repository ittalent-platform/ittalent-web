import { Eye, MoreVertical, Pencil, UserX } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PersonAvatar } from "@/components/common/person-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { adminUserPath } from "@/config/routes";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";

import { EmailStatusBadge, RoleBadge, StatusBadge } from "./user-badges";
import { USER_SORT_FIELD_BY_COLUMN, type UserSortField, type UserSortOrder } from "./users.constants";

type UsersTableProps = {
  isLoading: boolean;
  items: UserDto[];
  onEdit: (user: UserDto) => void;
  onSort: (field: UserSortField) => void;
  onSuspend: (user: UserDto) => void;
  onView: (user: UserDto) => void;
  sortBy: UserSortField;
  sortOrder: UserSortOrder;
};

/** The table column whose header shows the active sort (the API sorts the Name column by username). */
function sortColumn(field: UserSortField): string {
  return Object.entries(USER_SORT_FIELD_BY_COLUMN).find(([, value]) => value === field)?.[0] ?? "createdAt";
}

export function UsersTable({ isLoading, items, onEdit, onSort, onSuspend, onView, sortBy, sortOrder }: UsersTableProps) {
  const { t } = useTranslation();
  const columns: DataTableColumn<UserDto>[] = [
    {
      cell: (user) => <span className="itt-mono text-xs text-muted-foreground">{userDisplayId(user.id)}</span>,
      className: "w-[110px]",
      header: t("adminUsers.table.id"),
      key: "id",
      sortable: true,
    },
    {
      cell: (user) => (
        <Link className="group flex min-w-0 items-center gap-2.5 font-bold text-foreground no-underline" to={adminUserPath(user.id)}>
          <PersonAvatar tone="peach" className="size-9 text-[13px] no-underline" name={user.username} />
          <span className="truncate transition-colors group-hover:text-(--link-hover)">{user.username}</span>
        </Link>
      ),
      header: t("adminUsers.table.name"),
      key: "name",
      sortable: true,
    },
    { cell: (user) => <span className="break-all">{user.email}</span>, header: t("adminUsers.table.email"), key: "email", sortable: true },
    { cell: (user) => <RoleBadge role={user.role} />, header: t("adminUsers.table.role"), key: "role" },
    { cell: (user) => <EmailStatusBadge verified={user.emailVerified} />, header: t("adminUsers.table.emailStatus"), key: "emailStatus" },
    { cell: (user) => <StatusBadge status={user.status} />, header: t("adminUsers.table.accountStatus"), key: "status" },
    { cell: (user) => <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>, header: t("adminUsers.table.created"), key: "createdAt", sortable: true },
    {
      cell: (user) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("adminUsers.table.rowActions", { name: user.username })}
                className="grid size-8 cursor-pointer place-items-center rounded-[10px] text-muted-foreground hover:bg-muted"
                type="button"
              >
                <MoreVertical aria-hidden className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl py-1">
              <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px]" onSelect={() => onView(user)}>
                <Eye className="size-4" />
                {t("adminUsers.table.view")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px]" onSelect={() => onEdit(user)}>
                <Pencil className="size-4" />
                {t("adminUsers.table.edit")}
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px] text-destructive focus:text-destructive" onSelect={() => onSuspend(user)}>
                <UserX className="size-4" />
                {t("adminUsers.table.suspend")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      className: "w-[56px]",
      header: <span className="sr-only">{t("adminUsers.table.actions")}</span>,
      key: "actions",
    },
  ];

  return (
    <DataTable<UserDto>
      columns={columns}
      emptyState={<p className="py-10 text-center text-[13.5px] text-muted-foreground">{t("adminUsers.table.empty")}</p>}
      isLoading={isLoading}
      onSort={(key) => {
        const field = USER_SORT_FIELD_BY_COLUMN[key];
        if (field) onSort(field);
      }}
      rowKey={(user) => user.id}
      rows={items}
      sort={{ direction: sortOrder, key: sortColumn(sortBy) }}
    />
  );
}
