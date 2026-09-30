import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Inbox, SearchX } from "lucide-react";

import { Callout } from "@/components/common/callout";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/admin-page-header";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableSkeletonRows } from "@/components/ui/table";
import { ApplicationsBoard } from "./applications-board";
import { ApplicationsTable } from "./applications-table";
import { ApplicationsToolbar } from "./applications-toolbar";
import { PAGE_SIZE_OPTIONS, type ApplicationItem, type SortField } from "./applications.constants";
import { useApplications } from "./applications.queries";
import { useApplicationsParams } from "./use-applications-params";
import { WithdrawApplicationsDialog, type WithdrawTarget } from "./withdraw-applications-dialog";

const SKELETON_COLUMNS = 7;
const CARD = "overflow-hidden rounded-2xl border border-border bg-card";

function toTarget(item: ApplicationItem): WithdrawTarget {
  return { id: item.id, jobTitle: item.job.title, companyName: item.job.companyName, isReapplication: Boolean(item.reappliedFrom) };
}

/** UC-MYAPP-01 / 05: the candidate's applications as a table or a board, searched and filtered through the URL. */
export function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const state = useApplicationsParams();
  const [withdrawTargets, setWithdrawTargets] = useState<WithdrawTarget[]>([]);
  const invalidCriteria = Object.keys(state.errors).length > 0;
  const query = useApplications(state.query, { enabled: !invalidCriteria });
  const data = query.data;

  const companyCount = data ? new Set(data.items.map((item) => item.job.companyName)).size : 0;
  const subtitle = !data ? "" : data.items.length === data.total && data.total > 0 ? `${t("applications.subtitle", { count: data.total })} ${t("applications.acrossCompanies", { count: companyCount })}` : t("applications.subtitle", { count: data.total });

  function sortBy(field: SortField) {
    const flip = state.sortBy === field && state.sortOrder === "desc";
    state.setMany({ sortBy: field, sortOrder: flip ? "asc" : "desc" });
  }

  function renderBody() {
    if (invalidCriteria) {
      return <Callout role="alert" title={t("applications.errors.invalidTitle")} tone="error">{t("applications.errors.invalidHint")}</Callout>;
    }
    if (query.isPending) return <div className={CARD}><Table><TableBody><TableSkeletonRows columns={SKELETON_COLUMNS} /></TableBody></Table></div>;
    if (query.isError || !data) {
      return (
        <div className={`${CARD} flex flex-col items-end gap-3 p-6`}>
          <Callout className="w-full" role="alert" title={t("applications.loadErrorTitle")} tone="error">{t("applications.loadErrorHint")}</Callout>
          <Button className="h-11 px-6 text-sm font-semibold" onClick={() => void query.refetch()} shape="pill">{t("actions.retry")}</Button>
        </div>
      );
    }
    if (!data.items.length) {
      return (
        <div className={CARD}>
          {state.hasFilters
            ? <EmptyState action={{ label: t("applications.clearFilters"), onClick: state.clearFilters, variant: "outline" }} description={t("applications.noMatchesDescription")} icon={SearchX} title={t("applications.noMatches")} />
            : <EmptyState action={{ label: t("applications.browse"), onClick: () => navigate("/") }} description={t("applications.noApplicationsDescription")} icon={Inbox} title={t("applications.noApplications")} />}
        </div>
      );
    }
    return state.view === "board"
      ? <ApplicationsBoard counts={data.statusCounts} items={data.items} locale={i18n.language} onWithdraw={(items) => setWithdrawTargets(items.map(toTarget))} />
      : <div className={CARD}><ApplicationsTable items={data.items} locale={i18n.language} onSort={sortBy} onWithdraw={(item) => setWithdrawTargets([toTarget(item)])} sortBy={state.sortBy} sortOrder={state.sortOrder} /></div>;
  }

  return (
    <main className="mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pb-12 pt-8 sm:px-6">
      <PageHeader
        actions={<Button asChild className="h-11 px-[22px] text-sm font-semibold" shape="pill"><Link to="/">{t("applications.browse")}</Link></Button>}
        description={subtitle}
        title={t("applications.title")}
      />
      <ApplicationsToolbar showCounts={state.statuses.length === 0} state={state} statusCounts={data?.statusCounts} />
      {renderBody()}
      {data && data.items.length && !invalidCriteria ? (
        <Pagination limit={state.limit} onLimitChange={(limit) => state.set("limit", String(limit))} onPageChange={(page) => state.set("page", String(page))} page={state.page} pageSizeOptions={PAGE_SIZE_OPTIONS} total={data.total} totalPages={data.totalPages} />
      ) : null}
      <WithdrawApplicationsDialog onOpenChange={() => setWithdrawTargets([])} targets={withdrawTargets} />
    </main>
  );
}
