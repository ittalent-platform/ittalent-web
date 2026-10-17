import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Columns3, Inbox, SearchX, Table2 } from "lucide-react";

import { AdminPageHeader } from "@/components/common/admin-page-header";
import { Callout } from "@/components/common/callout";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { Table, TableBody, TableSkeletonRows } from "@/components/ui/table";
import { ViewToggle } from "@/components/ui/view-toggle";
import { ApplicationsTable } from "./applications-table";
import { ApplicationsToolbar } from "./applications-toolbar";
import {
  PAGE_SIZE_OPTIONS,
  PARAM,
  RECRUITER_APPLICATIONS_PATH,
  VIEW_MODES,
  type ApplicationItem,
  type ApplicationStatus,
  type SortField,
} from "./applications.constants";
import { useRecruiterApplications, useUpdateApplicationStatus } from "./applications.queries";
import { useApplicationsParams } from "./use-applications-params";

const VIEW_ICONS = { table: Table2, board: Columns3 } as const;
const SKELETON_COLUMNS = 7;
const CARD = "overflow-hidden surface-card";

const UPDATABLE_STATUSES = [
  "under_review",
  "interviewing",
  "offered",
  "hired",
  "rejected",
] as const;
type UpdatableStatus = (typeof UPDATABLE_STATUSES)[number];

function isUpdatableStatus(status: ApplicationStatus): status is UpdatableStatus {
  return (UPDATABLE_STATUSES as readonly string[]).includes(status);
}

export function ApplicationsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const state = useApplicationsParams();
  const invalidCriteria = Object.keys(state.errors).length > 0;
  const query = useRecruiterApplications(state.query, { enabled: !invalidCriteria });
  const data = query.data;
  const updateStatusMutation = useUpdateApplicationStatus();

  const subtitle = data
    ? t("recruiterApplications.subtitle", { count: data.total })
    : undefined;

  function sortBy(field: SortField) {
    const flip = state.sortBy === field && state.sortOrder === "desc";
    state.setMany({ sortBy: field, sortOrder: flip ? "asc" : "desc" });
  }

  function handleStatusChange(item: ApplicationItem, status: ApplicationStatus) {
    if (isUpdatableStatus(status)) {
      updateStatusMutation.mutate({ id: item.id, body: { status } });
    }
  }

  function handleScheduleInterview(item: ApplicationItem) {
    navigate(`/recruiter/interviews?applicationId=${item.id}`);
  }

  function handleOpenCv(item: ApplicationItem) {
    navigate(`${RECRUITER_APPLICATIONS_PATH}/${item.id}#cv`);
  }

  function renderBody() {
    if (invalidCriteria) {
      return (
        <Callout role="alert" title={t("applications.errors.invalidTitle")} tone="error">
          {t("applications.errors.invalidHint")}
        </Callout>
      );
    }

    if (query.isPending) {
      return (
        <div className={CARD}>
          <Table>
            <TableBody>
              <TableSkeletonRows columns={SKELETON_COLUMNS} rows={state.limit} />
            </TableBody>
          </Table>
        </div>
      );
    }

    if (query.isError || !data) {
      return (
        <div className={`${CARD} flex flex-col items-end gap-3 p-6`}>
          <Callout
            className="w-full"
            role="alert"
            title={t("recruiterApplications.error.title")}
            tone="error"
          >
            {t("recruiterApplications.error.description")}
          </Callout>
          <Button
            className="px-6 font-semibold"
            onClick={() => void query.refetch()}
            shape="pill"
            size="xl"
          >
            {t("recruiterApplications.error.retry")}
          </Button>
        </div>
      );
    }

    if (!data.items.length) {
      return (
        <div className={CARD}>
          {state.hasFilters ? (
            <EmptyState
              action={{
                label: t("recruiterApplications.filter.clearFilters"),
                onClick: state.clearFilters,
                variant: "outline",
              }}
              description={t("recruiterApplications.empty.noMatchesDescription")}
              icon={SearchX}
              title={t("recruiterApplications.empty.noMatchesTitle")}
            />
          ) : (
            <EmptyState
              description={t("recruiterApplications.empty.description")}
              icon={Inbox}
              title={t("recruiterApplications.empty.title")}
            />
          )}
        </div>
      );
    }

    if (state.view === "board") {
      return (
        <div className={`${CARD} flex flex-col items-center justify-center p-12 text-center`}>
          <p className="text-base font-semibold text-foreground">Kanban Board View</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Recruiter drag-and-drop stage pipeline board will be enabled in the upcoming milestone.
            Switch back to Table view to browse applications.
          </p>
          <Button
            className="mt-4"
            onClick={() => state.setMany({ [PARAM.view]: "table" })}
            variant="outline"
          >
            Switch to Table view
          </Button>
        </div>
      );
    }

    return (
      <div className={CARD}>
        <ApplicationsTable
          items={data.items}
          locale={i18n.language}
          onDownloadCv={handleOpenCv}
          onOpenCv={handleOpenCv}
          onScheduleInterview={handleScheduleInterview}
          onSort={sortBy}
          onStatusChange={handleStatusChange}
          sortBy={state.sortBy}
          sortOrder={state.sortOrder}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <AdminPageHeader
        actions={
          <ViewToggle
            onChange={(view) => state.setMany({ [PARAM.view]: view })}
            options={VIEW_MODES.map((value) => ({
              value,
              icon: VIEW_ICONS[value],
              label: t(`recruiterApplications.view.${value}`),
            }))}
            showLabels
            value={state.view}
          />
        }
        description={subtitle}
        title={t("recruiterApplications.title")}
      />
      <ApplicationsToolbar
        showCounts={state.statuses.length === 0}
        state={state}
        statusCounts={data?.statusCounts}
      />
      {renderBody()}
      {data && data.items.length && !invalidCriteria ? (
        <Pagination
          limit={state.limit}
          onLimitChange={(limit) => state.set("limit", String(limit))}
          onPageChange={(page) => state.set("page", String(page))}
          page={state.page}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          total={data.total}
          totalPages={data.totalPages}
        />
      ) : null}
    </div>
  );
}
