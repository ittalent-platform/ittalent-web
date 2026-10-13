import { Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { FilterSelect } from "@/components/ui/filter-select";
import type { QueueSortOption, QueueTimeFilter, RegistrationQueueTab } from "@/features/admin/registrations/registrations.constants";

interface RegistrationsToolbarProps {
  activeTab: RegistrationQueueTab;
  onTabChange: (tab: RegistrationQueueTab) => void;
  pendingCount?: number;
  approvedCount?: number;
  rejectedCount?: number;
  searchTerm: string;
  onSearchChange: (search: string) => void;
  timeFilter: QueueTimeFilter;
  onTimeFilterChange: (time: QueueTimeFilter) => void;
  sortOption: QueueSortOption;
  onSortOptionChange: (sort: QueueSortOption) => void;
}

export function RegistrationsToolbar({
  activeTab,
  onTabChange,
  pendingCount,
  approvedCount,
  rejectedCount,
  searchTerm,
  onSearchChange,
  timeFilter,
  onTimeFilterChange,
  sortOption,
  onSortOptionChange,
}: RegistrationsToolbarProps) {
  const { t } = useTranslation();

  const tabs: Array<{ key: RegistrationQueueTab; label: string; count?: number }> = [
    { key: "pending", label: t("admin.registrations.tabs.pendingReview", "Pending review"), count: pendingCount },
    { key: "approved", label: t("admin.registrations.tabs.approved", "Approved"), count: approvedCount },
    { key: "rejected", label: t("admin.registrations.tabs.rejected", "Rejected"), count: rejectedCount },
  ];

  const timeOptions = [
    { label: t("admin.registrations.filters.anyTime", "Submitted: Any time"), value: "any" },
    { label: t("admin.registrations.filters.last7Days", "Submitted: Last 7 days"), value: "7d" },
    { label: t("admin.registrations.filters.last30Days", "Submitted: Last 30 days"), value: "30d" },
  ];

  const sortOptions = [
    { label: t("admin.registrations.sort.oldestFirst", "Sort: Oldest first"), value: "oldest" },
    { label: t("admin.registrations.sort.newestFirst", "Sort: Newest first"), value: "newest" },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Tabs Row */}
      <div className="flex items-center gap-6 border-b border-border">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={cn(
                "group -mb-px flex items-center gap-2 pb-3 pt-1 text-[14px] transition-colors cursor-pointer",
                isActive
                  ? "border-b-2 border-primary font-semibold text-foreground"
                  : "border-b-2 border-transparent font-medium text-muted-foreground hover:text-foreground",
              )}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null ? (
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[11.5px] font-semibold leading-none",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground group-hover:text-foreground",
                  )}
                >
                  {tab.count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Controls Row */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("admin.registrations.searchPlaceholder", "Search by case ID, company, tax code or requester")}
            className="pl-9.5 pr-4 h-10 rounded-xl"
          />
        </div>

        {/* Filters & Sort */}
        <div className="flex items-center gap-3 shrink-0">
          <FilterSelect
            value={timeFilter}
            onChange={(v) => onTimeFilterChange(v as QueueTimeFilter)}
            options={timeOptions}
            size="md"
            className="h-10 rounded-xl min-w-[170px]"
          />

          <FilterSelect
            value={sortOption}
            onChange={(v) => onSortOptionChange(v as QueueSortOption)}
            options={sortOptions}
            size="md"
            className="h-10 rounded-xl min-w-[150px]"
          />
        </div>
      </div>
    </div>
  );
}
