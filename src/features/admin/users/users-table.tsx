import { Eye } from "lucide-react";
import type { UserDto } from "@/api/generated/types.gen";
import { DataTable, type DataTableColumn } from "@/components/common/data-table";
import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { userDisplayId } from "@/lib/display-id";
import { formatDate } from "@/lib/format";
import { RoleBadge, StatusBadge } from "./user-badges";
import { useTranslation } from "react-i18next";

type UsersTableProps = {
  isLoading: boolean;
  items: UserDto[];
  onView: (user: UserDto) => void;
};

export function UsersTable({ isLoading, items, onView }: UsersTableProps) {
  const { t } = useTranslation();
  const columns: DataTableColumn<UserDto>[] = [
    {
      cell: (user) => (
        <span className="itt-mono text-xs font-semibold text-muted-foreground">
          {userDisplayId(user.id)}
        </span>
      ),
      className: "w-[90px]",
      header: t("adminUsers.table.id"),
      key: "id",
    },
    {
      cell: (user) => (
        <div className="flex items-center gap-3">
          <PersonAvatar className="size-8 text-xs" name={user.username} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-foreground text-sm">
              {user.username}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {user.email}
            </p>
          </div>
        </div>
      ),
      header: t("adminUsers.table.user"),
      key: "user",
    },
    {
      cell: (user) => <RoleBadge role={user.role} />,
      className: "w-[110px]",
      header: t("adminUsers.table.role"),
      key: "role",
    },
    {
      cell: (user) => <StatusBadge status={user.status} />,
      className: "w-[120px]",
      header: t("adminUsers.table.status"),
      key: "status",
    },
    {
      cell: (user) => (
        <span className="text-xs text-muted-foreground">
          {formatDate(user.createdAt)}
        </span>
      ),
      className: "w-[130px]",
      header: t("adminUsers.table.created"),
      key: "createdAt",
    },
    {
      cell: (user) => (
        <div className="flex justify-end">
          <Button
            aria-label={t("adminUsers.table.viewDetails", { name: user.username })}
            onClick={() => onView(user)}
            size="sm"
            variant="ghost"
          >
            <Eye className="size-4" />
            <span className="hidden sm:inline">{t("adminUsers.table.view")}</span>
          </Button>
        </div>
      ),
      className: "w-[90px] text-right",
      header: t("adminUsers.table.actions"),
      key: "actions",
    },
  ];

  return (
    <DataTable<UserDto>
      columns={columns}
      emptyState={<p className="text-sm text-muted-foreground py-8 text-center">{t("adminUsers.table.empty")}</p>}
      isLoading={isLoading}
      rowKey={(user) => user.id}
      rows={items}
    />
  );
}
