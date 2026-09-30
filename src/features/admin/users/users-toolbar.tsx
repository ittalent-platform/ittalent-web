import { useTranslation } from "react-i18next";

import { ListToolbar } from "@/components/common/list-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";

import { ALL_FILTER, type UserRoleFilter, type UserStatusFilter, USER_ROLE_FILTERS, USER_STATUS_FILTERS } from "./users.constants";

type UsersToolbarProps = {
  onRoleChange: (role: UserRoleFilter) => void;
  onSearchChange: (value: string) => void;
  onStatusChange: (status: UserStatusFilter) => void;
  role: UserRoleFilter;
  search: string;
  status: UserStatusFilter;
};

/** "Role: All" style trigger: muted prefix, emphasised value (Users design). */
function prefixedTrigger(prefix: string) {
  return (selected: string) => (
    <>
      <span className="text-muted-foreground">{prefix}</span> <span className="text-foreground">{selected}</span>
    </>
  );
}

export function UsersToolbar({ onRoleChange, onSearchChange, onStatusChange, role, search, status }: UsersToolbarProps) {
  const { t } = useTranslation();
  const all = t("adminUsers.toolbar.all");
  return (
    <ListToolbar onSearchChange={onSearchChange} search={search} searchPlaceholder={t("adminUsers.toolbar.search")}>
      <FilterSelect
        onChange={onRoleChange}
        options={[
          { label: all, value: ALL_FILTER },
          ...USER_ROLE_FILTERS.map((value) => ({ label: t(`adminUsers.role.${value}`), value })),
        ]}
        renderTrigger={prefixedTrigger(`${t("adminUsers.toolbar.role")}:`)}
        value={role}
      />
      <FilterSelect
        onChange={onStatusChange}
        options={[
          { label: all, value: ALL_FILTER },
          ...USER_STATUS_FILTERS.map((value) => ({ label: t(`adminUsers.status.${value}`), value })),
        ]}
        renderTrigger={prefixedTrigger(`${t("adminUsers.toolbar.status")}:`)}
        value={status}
      />
    </ListToolbar>
  );
}
