import { Ban, Eye, MoreVertical, Pencil, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PersonAvatar } from "@/components/common/person-avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useSession } from "@/auth/use-session";
import { adminUserPath } from "@/config/routes";
import { formatDate } from "@/lib/format";

import { EmailStatusBadge, RoleBadge, StatusBadge } from "./user-badges";
import { emailBadgeKind, userDisplayName } from "./user-display";
import { USER_SORT_FIELD_BY_COLUMN, type UserSortField, type UserSortOrder } from "./users.constants";

type UsersTableProps = {
  isLoading: boolean;
  highlightId?: string | null;
  items: UserDto[];
  onEdit: (user: UserDto) => void;
  onSort: (field: UserSortField) => void;
  onSuspend: (user: UserDto) => void;
  onView: (user: UserDto) => void;
  sortBy: UserSortField;
  sortOrder: UserSortOrder;
};

/** The table column whose header shows the active sort. */
function sortColumn(field: UserSortField): string {
  return Object.entries(USER_SORT_FIELD_BY_COLUMN).find(([, value]) => value === field)?.[0] ?? "createdAt";
}

export function UsersTable({ highlightId, isLoading, items, onEdit, onSort, onSuspend, onView, sortBy, sortOrder }: UsersTableProps) {
  const { t } = useTranslation();
  // The API rejects self-suspension, so the signed-in administrator's own row has no Suspend action.
  const currentUserId = useSession().data?.user.id;
  const columns: DataTableColumn<UserDto>[] = [
    {
      cell: (user) => (
        <Link className="group flex min-w-0 items-center gap-2.5 no-underline" to={adminUserPath(user.id)}>
          <PersonAvatar tone="peach" className="size-9 shrink-0 text-[13px] no-underline" name={userDisplayName(user)} />
          <span className="flex min-w-0 flex-col">
            <span className="truncate font-semibold text-foreground transition-colors group-hover:text-(--link-hover)" title={userDisplayName(user)}>{userDisplayName(user)}</span>
            <span className="truncate text-[12.5px] text-muted-foreground" title={user.email}>{user.email}</span>
          </span>
        </Link>
      ),
      header: t("adminUsers.table.name"),
      key: "name",
      sortable: true,
      className: "w-[26%]",
    },
    { cell: (user) => <RoleBadge role={user.role} />, className: "w-[14%]", header: t("adminUsers.table.role"), key: "role" },
    { cell: (user) => <span className="block truncate text-foreground" title={user.enterpriseName ?? undefined}>{user.enterpriseName ?? "—"}</span>, className: "w-[12%]", header: t("adminUsers.table.company"), key: "company" },
    { cell: (user) => <EmailStatusBadge kind={emailBadgeKind(user)} />, className: "w-[17%]", header: t("adminUsers.table.email"), key: "emailStatus" },
    { cell: (user) => <StatusBadge status={user.status} />, className: "w-[12%]", header: t("adminUsers.table.accountStatus"), key: "status" },
    { cell: (user) => <span className="text-foreground">{formatDate(user.createdAt)}</span>, className: "w-[12%] whitespace-nowrap", header: t("adminUsers.table.created"), key: "createdAt", sortable: true },
    {
      cell: (user) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("adminUsers.table.rowActions", { name: userDisplayName(user) })}
                className="grid size-8 cursor-pointer place-items-center rounded-[10px] text-muted-foreground hover:bg-muted"
                type="button"
              >
                <MoreVertical aria-hidden className="size-4 opacity-60" />
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
              {user.status === "active" && user.id !== currentUserId ? (
                <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px] text-destructive focus:text-destructive" onSelect={() => onSuspend(user)}>
                  <Ban className="size-4" />
                  {t("adminUsers.table.suspend")}
                </DropdownMenuItem>
              ) : null}
              {user.status === "suspended" || user.status === "blocked" ? (
                <DropdownMenuItem className="gap-2.5 px-3.5 py-2.5 text-[13.5px] text-(--status-success-fg) focus:text-(--status-success-fg)" onSelect={() => onSuspend(user)}>
                  <RotateCcw className="size-4" />
                  {t("adminUsers.table.reactivate")}
                </DropdownMenuItem>
              ) : null}
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
      className="table-fixed"
      columns={columns}
      emptyState={<p className="py-10 text-center text-[13.5px] text-muted-foreground">{t("adminUsers.table.empty")}</p>}
      isLoading={isLoading}
      onSort={(key) => {
        const field = USER_SORT_FIELD_BY_COLUMN[key];
        if (field) onSort(field);
      }}
      rowClassName={(user) => (user.id === highlightId ? "bg-primary/5" : undefined)}
      rowKey={(user) => user.id}
      rows={items}
      sort={{ direction: sortOrder, key: sortColumn(sortBy) }}
    />
  );
}
