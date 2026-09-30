import { useState } from "react";
import { Link } from "react-router";
import { Plus, CheckCircle2 } from "lucide-react";
import { Pagination } from "@/components/ui/pagination";
import { useListParams } from "@/hooks/use-list-params";
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
  type EnterpriseSizeFilter,
  type EnterpriseStatusFilter,
} from "./enterprises-toolbar";
import {
  ActivateEnterpriseDialog,
  DeleteEnterpriseDialog,
  SuspendEnterpriseDialog,
} from "./enterprise-dialogs";
import { useToast } from "@/components/toast/toast-provider";

function useSafeToast() {
  try {
    return useToast();
  } catch {
    return null;
  }
}

export function EnterprisesPage() {
  const { page, limit, search, set } = useListParams({
    defaultLimit: DEFAULT_PAGE_SIZE,
  });

  const [status, setStatus] = useState<EnterpriseStatusFilter>("all");
  const [industry, setIndustry] = useState<string>("all");
  const [companySize, setCompanySize] = useState<EnterpriseSizeFilter>("all");
  const [city, setCity] = useState<string>("all");

  // Dialog states
  const [targetItem, setTargetItem] = useState<EnterpriseSummaryDto | null>(null);
  const [actionType, setActionType] = useState<"suspend" | "activate" | "delete" | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const listQuery = useEnterprisesListQuery({
    limit,
    page,
    ...(search ? { keyword: search } : {}),
    ...(status !== "all" ? { status } : {}),
    ...(industry !== "all" ? { industry } : {}),
    ...(companySize !== "all" ? { company_size: companySize } : {}),
    ...(city !== "all" ? { location: city } : {}),
  });

  const updateStatusMutation = useUpdateEnterpriseStatusMutation(targetItem?.id ?? "");
  const deleteMutation = useDeleteEnterpriseMutation(targetItem?.id ?? "");

  const items = listQuery.data?.items ?? [];
  const total = listQuery.data?.total ?? 0;
  const totalPages = listQuery.data?.totalPages ?? Math.max(1, Math.ceil(total / limit));

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 4500);
  }

  function handleSearchChange(val: string) {
    set("search", val || null);
    set("page", "1");
  }

  function handleResetFilters() {
    set("search", null);
    setStatus("all");
    setIndustry("all");
    setCompanySize("all");
    setCity("all");
    set("page", "1");
  }

  const toast = useSafeToast();

  async function handleConfirmSuspend(reason: string) {
    if (!targetItem) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "suspended",
        reason,
      });
      showToast(`${targetItem.name} has been suspended`);
      toast?.showToast({
        tone: "warning",
        title: "Enterprise suspended",
        message: `${targetItem.name} has been suspended and hidden from public view.`,
      });
      setTargetItem(null);
      setActionType(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to suspend enterprise";
      toast?.showToast({
        tone: "error",
        title: "Suspension failed",
        message: msg,
      });
      throw err;
    }
  }

  async function handleConfirmActivate(reason?: string) {
    if (!targetItem) return;
    try {
      await updateStatusMutation.mutateAsync({
        status: "active",
        reason: reason || "Enterprise activated by administrator",
      });
      showToast(`${targetItem.name} activated · Now public`);
      toast?.showToast({
        tone: "success",
        title: "Enterprise activated",
        message: `${targetItem.name} is now active and published.`,
      });
      setTargetItem(null);
      setActionType(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to activate enterprise";
      toast?.showToast({
        tone: "error",
        title: "Activation failed",
        message: msg,
      });
      throw err;
    }
  }

  async function handleConfirmDelete() {
    if (!targetItem) return;
    try {
      await deleteMutation.mutateAsync();
      showToast(`${targetItem.name} deleted`);
      toast?.showToast({
        tone: "error",
        title: "Enterprise deleted",
        message: `${targetItem.name} has been soft-deleted.`,
      });
      setTargetItem(null);
      setActionType(null);
    } catch (err: unknown) {
      const errorObj = err as { data?: { message?: string }; message?: string };
      const msg = errorObj?.data?.message || errorObj?.message || "Failed to delete enterprise";
      toast?.showToast({
        tone: "error",
        title: "Deletion failed",
        message: msg,
      });
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#19191c] text-white text-sm shadow-2xl animate-in fade-in slide-in-from-bottom-3"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-['Space_Grotesk'] text-2xl font-bold tracking-tight text-[#19191c]">
            Enterprise Profiles
          </h1>
          <p className="text-sm text-[#64646b]">
            {total} {total === 1 ? "enterprise" : "enterprises"} · deleted profiles are not listed
          </p>
        </div>

        <Link
          to="/admin/enterprises/new"
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full bg-[#f2470c] hover:bg-[#d93d07] text-white text-sm font-semibold shadow-sm transition cursor-pointer select-none"
        >
          <Plus className="w-4 h-4" />
          <span>Create enterprise</span>
        </Link>
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
        companySize={companySize}
        onCompanySizeChange={(cs) => {
          setCompanySize(cs);
          set("page", "1");
        }}
        city={city}
        onCityChange={(c) => {
          setCity(c);
          set("page", "1");
        }}
        onResetFilters={handleResetFilters}
      />

      {/* Directory Table */}
      <EnterprisesTable
        items={items}
        isLoading={listQuery.isLoading}
        hasFilters={
          search.trim() !== "" ||
          status !== "all" ||
          industry !== "all" ||
          companySize !== "all" ||
          city !== "all"
        }
        onClearFilters={handleResetFilters}
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

      {/* Pagination */}
      {total > 0 ? (
        <Pagination
          limit={limit}
          onLimitChange={(newLimit) => {
            set("limit", String(newLimit));
            set("page", "1");
          }}
          onPageChange={(newPage) => set("page", String(newPage))}
          page={page}
          total={total}
          totalPages={totalPages}
        />
      ) : null}

      {/* Action Dialogs */}
      {targetItem && actionType === "suspend" && (
        <SuspendEnterpriseDialog
          isOpen={true}
          onClose={() => {
            setTargetItem(null);
            setActionType(null);
          }}
          onConfirm={handleConfirmSuspend}
          enterpriseName={targetItem.name}
        />
      )}

      {targetItem && actionType === "activate" && (
        <ActivateEnterpriseDialog
          isOpen={true}
          onClose={() => {
            setTargetItem(null);
            setActionType(null);
          }}
          onConfirm={handleConfirmActivate}
          enterpriseName={targetItem.name}
        />
      )}

      {targetItem && actionType === "delete" && (
        <DeleteEnterpriseDialog
          isOpen={true}
          onClose={() => {
            setTargetItem(null);
            setActionType(null);
          }}
          onConfirm={handleConfirmDelete}
          enterpriseName={targetItem.name}
        />
      )}
    </div>
  );
}
