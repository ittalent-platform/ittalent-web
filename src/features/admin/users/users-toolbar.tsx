import { FilterSelect } from "@/components/ui/filter-select";
import { ListToolbar } from "@/components/common/list-toolbar";
import { useTranslation } from "react-i18next";

type RoleFilter = "user" | "admin" | "all";
type StatusFilter = "active" | "inactive" | "suspended" | "all";

type UsersToolbarProps = {
  onRoleChange: (role: RoleFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: StatusFilter) => void;
  role: RoleFilter;
  search: string;
  status: StatusFilter;
};

export function UsersToolbar({
  onRoleChange,
  onSearchChange,
  onStatusChange,
  role,
  search,
  status,
}: UsersToolbarProps) {
  const { t } = useTranslation();
  return (
    <ListToolbar
      onSearchChange={onSearchChange}
      search={search}
      searchPlaceholder={t("adminUsers.toolbar.search")}
    >
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          onChange={(val) => onRoleChange(val as RoleFilter)}
          options={[
            { label: t("adminUsers.toolbar.allRoles"), value: "all" },
            { label: t("adminUsers.role.admin"), value: "admin" },
            { label: t("adminUsers.role.user"), value: "user" },
          ]}
          placeholder={t("adminUsers.toolbar.role")}
          value={role}
        />

        <FilterSelect
          onChange={(val) => onStatusChange(val as StatusFilter)}
          options={[
            { label: t("adminUsers.toolbar.allStatuses"), value: "all" },
            { label: t("adminUsers.status.active"), value: "active" },
            { label: t("adminUsers.status.inactive"), value: "inactive" },
            { label: t("adminUsers.status.suspended"), value: "suspended" },
          ]}
          placeholder={t("adminUsers.toolbar.status")}
          value={status}
        />
      </div>
    </ListToolbar>
  );
}
