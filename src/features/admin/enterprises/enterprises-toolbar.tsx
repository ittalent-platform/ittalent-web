import { useTranslation } from "react-i18next";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";
import { ListToolbar } from "@/components/common/list-toolbar";
import { INDUSTRY_OPTIONS, COMPANY_SIZE_OPTIONS, CITY_OPTIONS } from "./enterprises.constants";

export type EnterpriseStatusFilter = "all" | "active" | "pending" | "suspended" | "rejected" | "inactive";

type EnterprisesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: EnterpriseStatusFilter;
  onStatusChange: (status: EnterpriseStatusFilter) => void;
  industry: string;
  onIndustryChange: (industry: string) => void;
  size?: string;
  onSizeChange?: (size: string) => void;
  city?: string;
  onCityChange?: (city: string) => void;
  onResetFilters: () => void;
};

export function EnterprisesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  industry,
  onIndustryChange,
  size = "all",
  onSizeChange,
  city = "all",
  onCityChange,
  onResetFilters,
}: EnterprisesToolbarProps) {
  const { t } = useTranslation();

  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    (industry !== "all" && industry !== "") ||
    (size !== "all" && size !== "") ||
    (city !== "all" && city !== "");

  return (
    <ListToolbar
      onSearchChange={onSearchChange}
      search={search}
      searchPlaceholder={t("adminEnterprises.toolbar.search", "Search by ID, name, or email...")}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect
          onChange={(val) => onStatusChange(val as EnterpriseStatusFilter)}
          options={[
            { label: `${t("adminEnterprises.toolbar.status", "Status")}: ${t("adminEnterprises.toolbar.allStatuses", "All statuses")}`, value: "all" },
            { label: t("adminEnterprises.status.active", "Active"), value: "active" },
            { label: t("adminEnterprises.status.pending", "Pending"), value: "pending" },
            { label: t("adminEnterprises.status.suspended", "Suspended"), value: "suspended" },
            { label: t("adminEnterprises.status.rejected", "Rejected"), value: "rejected" },
            { label: t("adminEnterprises.status.inactive", "Inactive"), value: "inactive" },
          ]}
          placeholder={`${t("adminEnterprises.toolbar.status", "Status")}: ${t("adminEnterprises.toolbar.allStatuses", "All")}`}
          value={status}
        />

        <FilterSelect
          onChange={onIndustryChange}
          options={[
            {
              label: `${t("adminEnterprises.toolbar.industry", "Industry")}: ${t("adminEnterprises.toolbar.allIndustries", "All")}`,
              value: "all",
            },
            ...INDUSTRY_OPTIONS.map((opt) => ({
              label: opt,
              value: opt,
            })),
          ]}
          placeholder={`${t("adminEnterprises.toolbar.industry", "Industry")}: ${t("adminEnterprises.toolbar.allIndustries", "All")}`}
          value={industry || "all"}
        />

        {onSizeChange ? (
          <FilterSelect
            onChange={onSizeChange}
            options={[
              {
                label: `${t("adminEnterprises.toolbar.size", "Size")}: ${t("adminEnterprises.toolbar.allSizes", "All")}`,
                value: "all",
              },
              ...COMPANY_SIZE_OPTIONS.map((opt) => ({
                label: opt,
                value: opt,
              })),
            ]}
            placeholder={`${t("adminEnterprises.toolbar.size", "Size")}: ${t("adminEnterprises.toolbar.allSizes", "All")}`}
            value={size || "all"}
          />
        ) : null}

        {onCityChange ? (
          <FilterSelect
            onChange={onCityChange}
            options={[
              {
                label: `${t("adminEnterprises.toolbar.city", "City")}: ${t("adminEnterprises.toolbar.allCities", "All")}`,
                value: "all",
              },
              ...CITY_OPTIONS.map((opt) => ({
                label: opt,
                value: opt,
              })),
            ]}
            placeholder={`${t("adminEnterprises.toolbar.city", "City")}: ${t("adminEnterprises.toolbar.allCities", "All")}`}
            value={city || "all"}
          />
        ) : null}

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onResetFilters}
            className="h-10 px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            {t("actions.clear", "Clear filters")}
          </Button>
        ) : null}
      </div>
    </ListToolbar>
  );
}
