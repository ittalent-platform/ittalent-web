import { useState, useMemo } from "react";
import { useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { NumberedPagination } from "@/components/common/numbered-pagination";
import { useEnterpriseRegistrationsListQuery } from "@/features/enterprise-registration/enterprise-registration.queries";
import {
  type QueueSortOption,
  type QueueTimeFilter,
  type RegistrationQueueTab,
  QUEUE_TAB_STATUS_MAP,
} from "./registrations.constants";
import { RegistrationsToolbar } from "./components/registrations-toolbar";
import { RegistrationsTable } from "./components/registrations-table";

const PAGE_SIZE = 20;

export function RegistrationsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = (searchParams.get("tab") as RegistrationQueueTab) || "pending";
  const activeTab: RegistrationQueueTab = ["pending", "approved", "rejected"].includes(tabParam)
    ? tabParam
    : "pending";

  const searchParam = searchParams.get("search") || "";
  const pageParam = parseInt(searchParams.get("page") || "1", 10);
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;

  const [timeFilter, setTimeFilter] = useState<QueueTimeFilter>("any");
  const [sortOption, setSortOption] = useState<QueueSortOption>("oldest");

  const status = QUEUE_TAB_STATUS_MAP[activeTab];

  // Primary list query
  const listQuery = useEnterpriseRegistrationsListQuery({
    page,
    limit: PAGE_SIZE,
    status,
    search: searchParam || undefined,
  });

  // Count queries for tab badges
  const pendingCountQuery = useEnterpriseRegistrationsListQuery({
    page: 1,
    limit: 1,
    status: "pending_review",
  });
  const approvedCountQuery = useEnterpriseRegistrationsListQuery({
    page: 1,
    limit: 1,
    status: "approved",
  });
  const rejectedCountQuery = useEnterpriseRegistrationsListQuery({
    page: 1,
    limit: 1,
    status: "rejected",
  });

  const handleTabChange = (newTab: RegistrationQueueTab) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", newTab);
    next.set("page", "1");
    setSearchParams(next);
  };

  const handleSearchChange = (val: string) => {
    const next = new URLSearchParams(searchParams);
    if (val.trim()) {
      next.set("search", val);
    } else {
      next.delete("search");
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const handlePageChange = (newPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(newPage));
    setSearchParams(next);
  };

  const handleClearFilters = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("search");
    next.set("page", "1");
    setSearchParams(next);
    setTimeFilter("any");
    setSortOption("oldest");
  };

  const hasFilters = Boolean(searchParam) || timeFilter !== "any";

  const [now] = useState(() => Date.now());

  const items = listQuery.data?.items;
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / PAGE_SIZE));

  const filteredAndSortedItems = useMemo(() => {
    let result = [...(items ?? [])];
    if (timeFilter !== "any") {
      const cutoffDays = timeFilter === "7d" ? 7 : 30;
      const cutoffMs = cutoffDays * 24 * 60 * 60 * 1000;
      result = result.filter((item) => {
        const itemDate = new Date(item.submitted_at || item.created_at || "").getTime();
        return !isNaN(itemDate) && now - itemDate <= cutoffMs;
      });
    }

    result.sort((a, b) => {
      const dateA = new Date(a.submitted_at || a.created_at || "").getTime() || 0;
      const dateB = new Date(b.submitted_at || b.created_at || "").getTime() || 0;
      return sortOption === "oldest" ? dateA - dateB : dateB - dateA;
    });

    return result;
  }, [items, timeFilter, now, sortOption]);

  const displayTotal = timeFilter !== "any" ? filteredAndSortedItems.length : total;
  const fromEntry = displayTotal === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toEntry = displayTotal === 0 ? 0 : Math.min(page * PAGE_SIZE, displayTotal);

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-full overflow-hidden">
      <AdminPageHeader
        title={t("admin.registrations.title", "Enterprise registrations")}
        description={t(
          "admin.registrations.description",
          "Review, verify, and approve or reject employer onboarding submissions."
        )}
      />

      <RegistrationsToolbar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        pendingCount={pendingCountQuery.data?.total}
        approvedCount={approvedCountQuery.data?.total}
        rejectedCount={rejectedCountQuery.data?.total}
        searchTerm={searchParam}
        onSearchChange={handleSearchChange}
        timeFilter={timeFilter}
        onTimeFilterChange={setTimeFilter}
        sortOption={sortOption}
        onSortOptionChange={setSortOption}
      />

      <RegistrationsTable
        items={filteredAndSortedItems}
        isLoading={listQuery.isLoading}
        hasFilters={hasFilters}
        onClearFilters={handleClearFilters}
      />

      {displayTotal > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-[13px] text-muted-foreground">
            {t("admin.registrations.pagination.showing", {
              defaultValue: "Showing {{from}}-{{to}} of {{total}} entries",
              from: fromEntry,
              to: toEntry,
              total: displayTotal,
            })}
          </p>

          {totalPages > 1 ? (
            <NumberedPagination
              page={page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
