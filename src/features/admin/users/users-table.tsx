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

import { RoleBadge, StatusBadge } from "./user-badges";

type UsersTableProps = {
  isLoading: boolean;
  items: UserDto[];
  onEdit: (user: UserDto) => void;
  onSuspend: (user: UserDto) => void;
  onView: (user: UserDto) => void;
};

export function UsersTable({ isLoading, items, onEdit, onSuspend, onView }: UsersTableProps) {
  const { t } = useTranslation();
  const columns: DataTableColumn<UserDto>[] = [
    {
      cell: (user) => <span className="itt-mono text-xs text-muted-foreground">{userDisplayId(user.id)}</span>,
      className: "w-[110px]",
      header: t("adminUsers.table.id"),
      key: "id",
    },
    {
      cell: (user) => (
        <Link className="flex min-w-0 items-center gap-2.5 font-bold text-foreground no-underline hover:underline" to={adminUserPath(user.id)}>
          <PersonAvatar tone="peach" className="size-9 text-[13px]" name={user.username} />
          <span className="truncate">{user.username}</span>
        </Link>
      ),
      header: t("adminUsers.table.name"),
      key: "name",
    },
    { cell: (user) => <span className="break-all">{user.email}</span>, header: t("adminUsers.table.email"), key: "email" },
    { cell: (user) => <RoleBadge role={user.role} />, header: t("adminUsers.table.role"), key: "role" },
    { cell: (user) => <StatusBadge status={user.status} />, header: t("adminUsers.table.accountStatus"), key: "status" },
    { cell: (user) => <span className="text-muted-foreground">{formatDate(user.createdAt)}</span>, header: t("adminUsers.table.created"), key: "createdAt" },
    {
      cell: (user) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label={t("adminUsers.table.rowActions", { name: user.username })}
                className="grid size-8 cursor-pointer place-items-center rounded-xl text-muted-foreground hover:bg-muted"
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
      rowKey={(user) => user.id}
      rows={items}
    />
  );
}
