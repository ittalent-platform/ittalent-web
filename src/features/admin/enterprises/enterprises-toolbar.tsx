import { Search, X } from "lucide-react";
import { FilterSelect } from "@/components/ui/filter-select";
import { Button } from "@/components/ui/button";

export type EnterpriseStatusFilter = "all" | "active" | "pending" | "suspended" | "inactive";
export type EnterpriseSizeFilter = "all" | "1-10" | "11-50" | "51-200" | "201-500" | "501-1000" | "1000+";

type EnterprisesToolbarProps = {
  search: string;
  onSearchChange: (value: string) => void;
  status: EnterpriseStatusFilter;
  onStatusChange: (status: EnterpriseStatusFilter) => void;
  industry: string;
  onIndustryChange: (industry: string) => void;
  companySize: EnterpriseSizeFilter;
  onCompanySizeChange: (size: EnterpriseSizeFilter) => void;
  city: string;
  onCityChange: (city: string) => void;
  onResetFilters: () => void;
};

export function EnterprisesToolbar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  industry,
  onIndustryChange,
  companySize,
  onCompanySizeChange,
  city,
  onCityChange,
  onResetFilters,
}: EnterprisesToolbarProps) {
  const hasActiveFilters =
    search.trim() !== "" ||
    status !== "all" ||
    industry !== "all" ||
    companySize !== "all" ||
    city !== "all";

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[280px]">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64646b] pointer-events-none" />
        <input
          type="search"
          aria-label="Search by ID, name, or email..."
          placeholder="Search by ID, name, or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-11 pl-10 pr-4 rounded-xl border border-[#dedcd6] bg-white text-sm text-[#19191c] placeholder:text-[#64646b] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
        />
      </div>

      {/* Filter Selects */}
      <div className="flex flex-wrap items-center gap-2.5">
        <FilterSelect
          onChange={(val) => onStatusChange(val as EnterpriseStatusFilter)}
          options={[
            { label: "Status: All", value: "all" },
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
            { label: "Suspended", value: "suspended" },
            { label: "Inactive", value: "inactive" },
          ]}
          placeholder="Status: All"
          value={status}
        />

        <FilterSelect
          onChange={onIndustryChange}
          options={[
            { label: "Industry: All", value: "all" },
            { label: "Fintech", value: "Fintech" },
            { label: "Information Technology", value: "Information Technology" },
            { label: "Cloud & DevOps", value: "Cloud & DevOps" },
            { label: "Data & AI", value: "Data & AI" },
            { label: "Software", value: "Software" },
            { label: "IT Services", value: "IT Services" },
            { label: "Consulting", value: "Consulting" },
            { label: "E-Commerce", value: "E-Commerce" },
          ]}
          placeholder="Industry: All"
          value={industry}
        />

        <FilterSelect
          onChange={(val) => onCompanySizeChange(val as EnterpriseSizeFilter)}
          options={[
            { label: "Size: All", value: "all" },
            { label: "1–10", value: "1-10" },
            { label: "11–50", value: "11-50" },
            { label: "51–200", value: "51-200" },
            { label: "201–500", value: "201-500" },
            { label: "501–1000", value: "501-1000" },
            { label: "1000+", value: "1000+" },
          ]}
          placeholder="Size: All"
          value={companySize}
        />

        <FilterSelect
          onChange={onCityChange}
          options={[
            { label: "City: All", value: "all" },
            { label: "Hà Nội", value: "Hanoi" },
            { label: "Hồ Chí Minh", value: "Ho Chi Minh" },
            { label: "Đà Nẵng", value: "Da Nang" },
            { label: "Cần Thơ", value: "Can Tho" },
            { label: "Hải Phòng", value: "Hai Phong" },
          ]}
          placeholder="City: All"
          value={city}
        />

        {hasActiveFilters ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onResetFilters}
            className="h-11 px-3 text-xs font-semibold text-[#64646b] hover:text-[#19191c] hover:bg-black/5 rounded-xl gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
