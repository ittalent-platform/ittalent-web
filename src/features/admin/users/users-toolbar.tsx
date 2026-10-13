import { useTranslation } from "react-i18next";

import { ListToolbar } from "@/components/common/list-toolbar";
import { FilterMultiSelect } from "@/components/ui/filter-select";

import { USER_EMAIL_FILTERS, USER_ROLE_FILTERS, USER_SEARCH_RANGE, USER_STATUS_FILTERS, type UserEmailFilter, type UserRole, type UserStatus } from "./users.constants";

type UsersToolbarProps = {
  companies: string[];
  onCompanySearchChange: (query: string) => void;
  companyOptions: Array<{ label: string; value: string }>;
  emails: UserEmailFilter[];
  onCompaniesChange: (values: string[]) => void;
  onEmailsChange: (values: UserEmailFilter[]) => void;
  onRolesChange: (values: UserRole[]) => void;
  onSearchChange: (value: string) => void;
  onStatusesChange: (values: UserStatus[]) => void;
  roles: UserRole[];
  search: string;
  searchInvalid: boolean;
  statuses: UserStatus[];
};

export function UsersToolbar({ companies, companyOptions, emails, onCompaniesChange, onCompanySearchChange, onEmailsChange, onRolesChange, onSearchChange, onStatusesChange, roles, search, searchInvalid, statuses }: UsersToolbarProps) {
  const { t } = useTranslation();
  return (
    <ListToolbar
      onSearchChange={onSearchChange}
      search={search}
      searchError={searchInvalid ? t("adminUsers.toolbar.searchHint", USER_SEARCH_RANGE) : undefined}
      searchMaxLength={USER_SEARCH_RANGE.max}
      searchPlaceholder={t("adminUsers.toolbar.search")}
    >
      <FilterMultiSelect
        onChange={onRolesChange}
        options={USER_ROLE_FILTERS.map((value) => ({ label: t(`adminUsers.role.${value}`), value }))}
        prefix={t("adminUsers.toolbar.role")}
        values={roles}
      />
      <FilterMultiSelect onChange={onCompaniesChange} onSearchChange={onCompanySearchChange} options={companyOptions} prefix={t("adminUsers.toolbar.company")} searchPlaceholder={t("adminUsers.toolbar.companySearch")} values={companies} />
      <FilterMultiSelect
        onChange={onEmailsChange}
        options={USER_EMAIL_FILTERS.map((value) => ({ label: t(`adminUsers.emailStatus.${value}`), value }))}
        prefix={t("adminUsers.toolbar.email")}
        values={emails}
      />
      <FilterMultiSelect
        onChange={onStatusesChange}
        options={USER_STATUS_FILTERS.map((value) => ({ label: t(`adminUsers.status.${value}`), value }))}
        prefix={t("adminUsers.toolbar.status")}
        values={statuses}
      />
    </ListToolbar>
  );
}
