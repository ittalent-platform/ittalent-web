import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { AdminPageHeader } from "@/components/common/admin-page-header";
import { NumberedPagination } from "@/components/common/numbered-pagination";
import { useListParams } from "@/hooks/use-list-params";
import { useToast } from "@/components/toast/toast-provider";
import {
  DEFAULT_PAGE_SIZE,
  useDeleteEnterpriseMutation,
  useEnterprisesListQuery,
  useUpdateEnterpriseStatusMutation,
  type EnterpriseSummaryDto,
} from "./enterprises.queries";
import { EnterprisesTable } from "./enterprises-table";
import {
  EnterprisesToolbar,
  type EnterpriseStatusFilter,
} from "./enterprises-toolbar";
import {
  ActivateEnterpriseDialog,
  DeleteEnterpriseDialog,
  SuspendEnterpriseDialog,
} from "./enterprise-dialogs";
import type { EnterpriseSortField, EnterpriseSortOrder } from "./enterprises.constants";

export function EnterprisesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const { page, limit, search, set } = useListParams({
    defaultLimit: DEFAULT_PAGE_SIZE,
  });

  const [status, setStatus] = useState<EnterpriseStatusFilter>("all");
  const [industry, setIndustry] = useState<string>("all");
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

  const sortedItems = useMemo(() => {
    return [...(rawItems ?? [])].sort((a, b) => {
      let aVal = (a as Record<string, unknown>)[sortBy] ?? "";
      let bVal = (b as Record<string, unknown>)[sortBy] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [rawItems, sortBy, sortOrder]);

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
    <div className="space-y-6">
      {/* Header */}
      <AdminPageHeader
        title={t("adminEnterprises.page.title", "Enterprise Profiles")}
        description={t("adminEnterprises.page.subtitle", "Manage registered companies, compliance vetting, and account statuses")}
        actions={
          <Button asChild className="h-10 rounded-full font-semibold">
            <Link to="/admin/enterprises/new">
              <Plus className="size-4 mr-1.5" />
              <span>{t("adminEnterprises.create", "Create enterprise")}</span>
            </Link>
          </Button>
        }
      />

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
        onResetFilters={handleResetFilters}
      />

      {/* Enterprises Table */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-2xs">
        <EnterprisesTable
          items={sortedItems}
          isLoading={listQuery.isLoading}
          hasFilters={search !== "" || status !== "all" || industry !== "all"}
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

        {/* Pagination footer */}
        {total > 0 ? (
          <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border px-5 py-3.5 bg-muted/20">
            <span className="text-xs text-muted-foreground">
              {t("pagination.showing", {
                start: (page - 1) * limit + 1,
                end: Math.min(page * limit, total),
                total,
              })}
            </span>
            <NumberedPagination
              page={page}
              totalPages={totalPages}
              onPageChange={(newPage) => set("page", String(newPage))}
            />
          </div>
        ) : null}
      </div>

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
