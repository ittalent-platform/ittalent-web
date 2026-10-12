import { Plus, SearchX, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router";

import type { UserDto } from "@/api/generated/types.gen";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { adminUserPath } from "@/config/routes";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";

import { SuspendUserDialog } from "./suspend-user-dialog";
import { UserFormDialog } from "./user-form-dialog";
import { UsersFilterChips, type UsersFilterChip } from "./users-filter-chips";
import { UsersTable } from "./users-table";
import { UsersToolbar } from "./users-toolbar";
import {CHIP_MAX_COMPANY_NAMES, COMPANY_SEARCH_DEBOUNCE_MS, CREATED_HIGHLIGHT_MS, FORBIDDEN_HOME_PATH, USER_FILTER_PARAM, type UserSortField, type UserSortOrder } from "./users.constants";
import { PAGE_SIZE_OPTIONS, useActiveEnterprisesQuery, useUsersListQuery } from "./users.queries";
import { emailVerifiedFilter, useUsersFilters } from "./use-users-filters";
import { HTTP_BAD_REQUEST, HTTP_FORBIDDEN } from "@/api/http-status";

type Dialog = { kind: "create" } | { kind: "edit"; user: UserDto } | { kind: "suspend"; user: UserDto } | null;

export function UsersPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filters = useUsersFilters();
  const { limit, page, search, set, setMany, sortBy, sortOrder } = filters;
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);
  const [dialog, setDialog] = useState<Dialog>(null);
  const createdId = searchParams.get(USER_FILTER_PARAM.created);

  const listQuery = useUsersListQuery({
    limit,
    page,
    ...(filters.roles.length ? { role: filters.roles } : {}),
    ...(filters.statuses.length ? { status: filters.statuses } : {}),
    ...(emailVerifiedFilter(filters.emails) !== undefined ? { emailVerified: emailVerifiedFilter(filters.emails) } : {}),
    ...(filters.companies.length ? { enterpriseId: filters.companies } : {}),
    ...(filters.appliedSearch ? { search: filters.appliedSearch } : {}),
    sortBy,
    sortOrder,
  });

  // The new row stays highlighted for a moment, then the marker leaves the URL.
  useEffect(() => {
    if (!createdId) return;
    const timer = setTimeout(() => set(USER_FILTER_PARAM.created, null), CREATED_HIGHLIGHT_MS);
    return () => clearTimeout(timer);
  }, [createdId, set]);

  // Clicking the active column flips its direction; a new column starts at the default (newest / A-Z order).
  function changeSort(field: UserSortField) {
    const nextOrder: UserSortOrder = field === sortBy ? (sortOrder === "asc" ? "desc" : "asc") : field === "createdAt" ? "desc" : "asc";
    setMany({ sortBy: field, sortOrder: nextOrder });
  }

  // A rejected search keeps the last results on screen next to the hint.
  const error = listQuery.error as { status?: number } | null | undefined;
  const searchRejected = error?.status === HTTP_BAD_REQUEST && Boolean(filters.appliedSearch);
  const [lastData, setLastData] = useState(listQuery.data);
  if (listQuery.data && listQuery.data !== lastData) setLastData(listQuery.data);
  const data = listQuery.data ?? (searchRejected ? lastData : undefined);

  const users = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  // Company options are the first 50 active companies matching the menu's search box (server-side), so any company is reachable.
  const [companySearch, setCompanySearch] = useState("");
  const companiesQuery = useActiveEnterprisesQuery(useDebouncedValue(companySearch, COMPANY_SEARCH_DEBOUNCE_MS), 1);
  const companyNames = useMemo(() => {
    const names = new Map<string, string>();
    for (const row of users) if (row.enterpriseId && row.enterpriseName) names.set(row.enterpriseId, row.enterpriseName);
    for (const item of companiesQuery.data?.items ?? []) names.set(item.id, item.name);
    return names;
  }, [companiesQuery.data, users]);
  // Ids from the URL that are not in the first page still get an option; the name is the id until a row reveals it.
  const companyOptions = useMemo(() => {
    const options = (companiesQuery.data?.items ?? []).map((item) => ({ label: item.name, value: item.id }));
    const extra = filters.companies.filter((id) => !options.some((option) => option.value === id));
    return [...extra.map((id) => ({ label: companyNames.get(id) ?? id, value: id })), ...options];
  }, [companiesQuery.data, companyNames, filters.companies]);

  const chips: UsersFilterChip[] = [
    { key: "roles", label: t("adminUsers.toolbar.role"), names: filters.roles.map((value) => t(`adminUsers.role.${value}`)) },
    { key: "companies", label: t("adminUsers.toolbar.company"), maxNames: CHIP_MAX_COMPANY_NAMES, names: filters.companies.map((id) => companyNames.get(id) ?? id) },
    { key: "emails", label: t("adminUsers.toolbar.email"), names: filters.emails.map((value) => t(`adminUsers.emailStatus.${value}`)) },
    { key: "statuses", label: t("adminUsers.toolbar.status"), names: filters.statuses.map((value) => t(`adminUsers.status.${value}`)) },
  ].filter((chip) => chip.names.length > 0);

  if (error?.status === HTTP_FORBIDDEN) {
    return (
      <EmptyState
        action={{ label: t("adminUsers.list.goToDashboard"), onClick: () => navigate(FORBIDDEN_HOME_PATH) }}
        description={t("adminUsers.list.forbiddenDescription")}
        icon={ShieldAlert}
        title={t("adminUsers.list.forbiddenTitle")}
      />
    );
  }

  const hasFilters = filters.activeCount > 0 || Boolean(filters.appliedSearch);
  const failed = Boolean(error) && !searchRejected;
  const isEmpty = !listQuery.isLoading && !failed && users.length === 0 && hasFilters;

  return (
    <div className="flex flex-col gap-5">
      <AdminPageHeader
        actions={
          <Button size="xl" onClick={() => setDialog({ kind: "create" })} shape="pill" type="button">
            <Plus aria-hidden className="size-4" />
            {t("adminUsers.page.create")}
          </Button>
        }
        description={t("adminUsers.page.subtitle")}
        title={t("adminUsers.page.title")}
      />

      {filters.droppedBanner ? (
        <InlineBanner action={{ label: t("adminUsers.list.dismiss"), onClick: filters.dismissBanner }} tone="warning">
          {t("adminUsers.list.invalidFilters")}
        </InlineBanner>
      ) : null}

      <UsersToolbar
        companies={filters.companies}
        companyOptions={companyOptions}
        emails={filters.emails}
        onCompaniesChange={(values) => filters.setFilter("companies", values)}
        onCompanySearchChange={setCompanySearch}
        onEmailsChange={(values) => filters.setFilter("emails", values)}
        onRolesChange={(values) => filters.setFilter("roles", values)}
        onSearchChange={setSearchText}
        onStatusesChange={(values) => filters.setFilter("statuses", values)}
        roles={filters.roles}
        search={searchText}
        searchInvalid={!filters.searchValid || searchRejected}
        statuses={filters.statuses}
      />

      <UsersFilterChips
        chips={chips}
        onClearAll={filters.clearAll}
        onRemove={(key) => filters.remove(key as Parameters<typeof filters.remove>[0])}
        summary={data ? (hasFilters ? t("adminUsers.page.shownOf", { count: total, shown: users.length }) : t("adminUsers.page.total", { count: total })) : undefined}
      />

      {failed ? (
        <ErrorState description={t("adminUsers.list.errorDescription")} onRetry={() => void listQuery.refetch()} title={t("adminUsers.list.errorTitle")} />
      ) : (
        <TableSurface className="rounded-2xl">
          {isEmpty ? (
            <EmptyState
              action={{ label: t("adminUsers.list.clearFilters"), onClick: filters.clearAll, variant: "outline" }}
              description={t("adminUsers.list.emptyDescription")}
              icon={SearchX}
              title={t("adminUsers.list.emptyTitle")}
            />
          ) : (
            <UsersTable
              highlightId={createdId}
              isLoading={listQuery.isLoading}
              items={users}
              onEdit={(user) => setDialog({ kind: "edit", user })}
              onSort={changeSort}
              onSuspend={(user) => setDialog({ kind: "suspend", user })}
              onView={(user) => navigate(adminUserPath(user.id))}
              sortBy={sortBy}
              sortOrder={sortOrder}
            />
          )}
        </TableSurface>
      )}

      {failed ? null : (
        <Pagination
          limit={limit}
          onLimitChange={(next) => setMany({ limit: String(next) })}
          onPageChange={(next) => set("page", String(next))}
          page={page}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          total={total}
          totalPages={totalPages}
        />
      )}

      <UserFormDialog
        onCreated={(user) => setMany({ [USER_FILTER_PARAM.created]: user.id, page: "1", sortBy: "createdAt", sortOrder: "desc" })}
        onOpenChange={(open) => !open && setDialog(null)}
        open={dialog?.kind === "create"}
      />
      {dialog?.kind === "edit" ? <UserFormDialog onOpenChange={(open) => !open && setDialog(null)} open user={dialog.user} /> : null}
      {dialog?.kind === "suspend" ? <SuspendUserDialog onOpenChange={(open) => !open && setDialog(null)} open user={dialog.user} /> : null}
    </div>
  );
}
