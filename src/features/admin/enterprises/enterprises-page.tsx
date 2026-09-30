import { useState, useMemo } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useToast } from "@/components/toast/toast-provider";
import { EnterprisesTable } from "./enterprises-table";
import { EnterprisesToolbar, type EnterpriseStatusFilter } from "./enterprises-toolbar";
import {
  useEnterprisesListQuery,
  useUpdateEnterpriseStatusMutation,
  useDeleteEnterpriseMutation,
  type EnterpriseSummaryDto,
} from "./enterprises.queries";
import {
  SuspendEnterpriseDialog,
  ActivateEnterpriseDialog,
  DeleteEnterpriseDialog,
} from "./enterprise-dialogs";
import type { EnterpriseSortField, EnterpriseSortOrder } from "./enterprises.constants";

const DEFAULT_PAGE_SIZE = 10;

export function EnterprisesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { page, limit, search, set } = useListParams({
    defaultLimit: DEFAULT_PAGE_SIZE,
  });

  const [status, setStatus] = useState<EnterpriseStatusFilter>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [city, setCity] = useState<string>("all");
  const [sortBy, setSortBy] = useState<EnterpriseSortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<EnterpriseSortOrder>("desc");

  // Dialog states
  const [targetItem, setTargetItem] = useState<EnterpriseSummaryDto | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | null>(null);

  const listQuery = useEnterprisesListQuery({
    limit,
    page,
    ...(search ? { keyword: search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(industry !== "all" ? { industry } : {}),
  });

  const updateStatusMutation = useUpdateEnterpriseStatusMutation(targetItem?.id ?? "");
  const deleteMutation = useDeleteEnterpriseMutation(targetItem?.id ?? "");

  const rawItems = listQuery.data?.items;
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  function handleSearchChange(val: string) {
    set("search", val || null);
    set("page", "1");
  }

  function handleResetFilters() {
    set("search", null);
    setStatus("all");
    setIndustry("all");
    setSize("all");
    setCity("all");
    set("page", "1");
  }

  function handleSort(field: EnterpriseSortField) {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  }

  const filteredItems = useMemo(() => {
    let items = rawItems ?? [];
    if (size !== "all") {
      items = items.filter((item) => item.companySize === size);
    }
    if (city !== "all") {
      items = items.filter((item) => item.location?.toLowerCase().includes(city.toLowerCase()));
    }
    return items;
  }, [rawItems, size, city]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      let aVal = (a as Record<string, unknown>)[sortBy] ?? "";
      let bVal = (b as Record<string, unknown>)[sortBy] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredItems, sortBy, sortOrder]);

  async function handleConfirmSuspend(reason: string) {
    if (!targetItem) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "suspended",
        reason,
      });
      toast.showToast({
        tone: "warning",
        title: "Enterprise suspended",
        message: `${targetItem.name} has been suspended and hidden from public view.`,
      });
      setActionType(null);
      setTargetItem(null);
    } catch {
      toast.showToast({
        tone: "error",
        title: "Suspension failed",
        message: "Could not suspend enterprise. Please try again.",
      });
    }
  }

  async function handleConfirmActivate(reason?: string) {
    if (!targetItem) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "active",
        reason,
      });
      toast.showToast({
        tone: "success",
        title: "Enterprise activated",
        message: `${targetItem.name} is now active and published.`,
      });
      setActionType(null);
      setTargetItem(null);
    } catch {
      toast.showToast({
        tone: "error",
        title: "Activation failed",
        message: "Could not activate enterprise. Please try again.",
      });
    }
  }

  async function handleConfirmDelete() {
    if (!targetItem) return;
    try {
      await deleteMutation.mutateAsync();
      toast.showToast({
        tone: "success",
        title: "Enterprise deleted",
        message: `${targetItem.name} was successfully removed.`,
      });
      setActionType(null);
      setTargetItem(null);
    } catch {
      toast.showToast({
        tone: "error",
        title: "Deletion failed",
        message: "Could not delete enterprise. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-5">
      {/* Header matching design */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {t("adminEnterprises.page.title", "Enterprise Profiles")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("adminEnterprises.page.subtitleCount", {
              count: total,
              defaultValue: `${total} enterprises · deleted profiles are not listed`,
            })}
          </p>
        </div>
        <Button asChild className="h-11 px-5 rounded-full bg-brand hover:bg-brand/90 text-white font-semibold text-sm transition shadow-none cursor-pointer">
          <Link to="/admin/enterprises/new">
            <Plus className="size-4 mr-2" />
            <span>{t("adminEnterprises.create", "Create enterprise")}</span>
          </Link>
        </Button>
      </div>

      {/* Search and Filters Toolbar */}
      <EnterprisesToolbar
        search={search}
        onSearchChange={handleSearchChange}
        status={status}
        onStatusChange={(s) => {
          setStatus(s);
          set("page", "1");
        }}
        industry={industry}
        onIndustryChange={(i) => {
          setIndustry(i);
          set("page", "1");
        }}
        size={size}
        onSizeChange={(sz) => {
          setSize(sz);
          set("page", "1");
        }}
        city={city}
        onCityChange={(c) => {
          setCity(c);
          set("page", "1");
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Enterprises Table Card */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        <EnterprisesTable
          items={sortedItems}
          isLoading={listQuery.isLoading}
          hasFilters={search !== "" || status !== "all" || industry !== "all" || size !== "all" || city !== "all"}
          onClearFilters={handleResetFilters}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSort={handleSort}
          onSuspend={(item) => {
            setTargetItem(item);
            setActionType("suspend");
          }}
          onActivate={(item) => {
            setTargetItem(item);
            setActionType("activate");
          }}
          onDelete={(item) => {
            setTargetItem(item);
            setActionType("delete");
          }}
        />
      </div>

      {/* Pagination footer (outside table card, matching design) */}
      {total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(newLimit) => {
            set("limit", String(newLimit));
            set("page", "1");
          }}
          onPageChange={(newPage: number) => set("page", String(newPage))}
          page={page}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      {/* Action Dialogs */}
      {actionType === "suspend" && targetItem && (
        <SuspendEnterpriseDialog
          isOpen={true}
          enterpriseName={targetItem.name}
          onClose={() => {
            setActionType(null);
            setTargetItem(null);
          }}
          onConfirm={handleConfirmSuspend}
        />
      )}

      {actionType === "activate" && targetItem && (
        <ActivateEnterpriseDialog
          isOpen={true}
          enterpriseName={targetItem.name}
          onClose={() => {
            setActionType(null);
            setTargetItem(null);
          }}
          onConfirm={handleConfirmActivate}
        />
      )}

      {actionType === "delete" && targetItem && (
        <DeleteEnterpriseDialog
          isOpen={true}
          enterpriseName={targetItem.name}
          onClose={() => {
            setActionType(null);
            setTargetItem(null);
          }}
          onConfirm={handleConfirmDelete}
        />
      )}
    </div>
  );
}
