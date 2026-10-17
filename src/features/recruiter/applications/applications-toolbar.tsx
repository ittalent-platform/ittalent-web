import { Columns3, Table2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ChecklistPopover } from "@/components/common/checklist-popover";
import { ListToolbar } from "@/components/common/list-toolbar";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { FilterSelect } from "@/components/ui/filter-select";
import { ViewToggle } from "@/components/ui/view-toggle";
import { useJobPostingList } from "@/features/job-postings/job-postings.queries";
import {
  APPLICATION_STATUSES,
  CLOSED_STATUSES,
  DOCUMENT_TYPES,
  IN_PROGRESS_STATUSES,
  MAX_SEARCH_LENGTH,
  PARAM,
  STATUS_LIST_SEPARATOR,
  STATUS_TONES,
  SUBMITTED_RANGES,
  VIEW_MODES,
  type ApplicationStatus,
  type RecruiterDocumentType,
  type SubmittedRange,
} from "./applications.constants";
import type { RecruiterApplicationsListState } from "./use-applications-params";

const VIEW_ICONS = { table: Table2, board: Columns3 } as const;
const ALL_JOBS = "all";
const ALL_DOCUMENTS = "all";
type DocumentFilterOption = RecruiterDocumentType | typeof ALL_DOCUMENTS;

function FilterLabel({ label, value }: { label: string; value: string }) {
  return (
    <>
      {label} <span className="font-semibold text-foreground">{value}</span>
    </>
  );
}

export interface ApplicationsToolbarProps {
  state: RecruiterApplicationsListState;
  statusCounts: Record<ApplicationStatus, number> | undefined;
  showCounts: boolean;
}

export function ApplicationsToolbar({ state, statusCounts, showCounts }: ApplicationsToolbarProps) {
  const { t } = useTranslation();
  const jobsQuery = useJobPostingList("recruiter", { page: 1, limit: 100 });

  const statusOptions = APPLICATION_STATUSES.map((value) => ({
    value,
    label: t(`applications.status.${value}`),
    dotClass: STATUS_TONES[value].dot,
    count: statusCounts?.[value],
  }));

  const statusValue =
    state.statuses.length === 0
      ? t("recruiterApplications.filter.all")
      : state.statuses.length === 1
        ? t(`applications.status.${state.statuses[0]!}`)
        : t("recruiterApplications.filter.selected", { count: state.statuses.length });

  const jobOptions = [
    { value: ALL_JOBS, label: t("recruiterApplications.filter.allJobs") },
    ...(jobsQuery.data?.items ?? []).map((job) => ({
      value: job.id,
      label: job.title,
    })),
  ];

  const rangeOptions = SUBMITTED_RANGES.map((value) => ({
    value,
    label: t(`recruiterApplications.range.${value}`),
  }));

  const documentOptions: { value: DocumentFilterOption; label: string }[] = [
    { value: ALL_DOCUMENTS, label: t("recruiterApplications.filter.anyDocument") },
    ...DOCUMENT_TYPES.map((value) => ({
      value,
      label: t(`recruiterApplications.document.${value}`),
    })),
  ];

  const rangeError = state.errors.range;

  return (
    <div className="flex flex-col gap-3">
      <ListToolbar
        className="flex flex-wrap items-start gap-3"
        onSearchChange={(value) => state.set("search", value)}
        search={state.search}
        searchError={
          state.errors.keyword
            ? t(`recruiterApplications.errors.${state.errors.keyword}`, { max: MAX_SEARCH_LENGTH })
            : undefined
        }
        searchMaxLength={MAX_SEARCH_LENGTH}
        searchPlaceholder={t("recruiterApplications.searchPlaceholder")}
      >
        <ChecklistPopover<ApplicationStatus>
          caption={t("recruiterApplications.filter.statusCaption")}
          footerHint={t("recruiterApplications.filter.appliesRightAway")}
          label={t("recruiterApplications.filter.status")}
          onChange={(values) =>
            state.set("status", values.length ? values.join(STATUS_LIST_SEPARATOR) : null)
          }
          options={statusOptions}
          presets={[
            { label: t("recruiterApplications.filter.all"), values: APPLICATION_STATUSES },
            { label: t("recruiterApplications.filter.inProgress"), values: IN_PROGRESS_STATUSES },
            { label: t("recruiterApplications.filter.closed"), values: CLOSED_STATUSES },
          ]}
          selectAllLabel={t("recruiterApplications.filter.selectAll")}
          showCounts={showCounts}
          triggerValue={statusValue}
          values={state.statuses}
        />

        <FilterSelect
          onChange={(val) => state.set("jobId", val === ALL_JOBS ? null : val)}
          options={jobOptions}
          renderTrigger={(selected) => (
            <FilterLabel label={t("recruiterApplications.filter.job")} value={selected} />
          )}
          value={state.jobId ?? ALL_JOBS}
        />

        <FilterSelect
          onChange={(val: SubmittedRange) =>
            state.setMany({
              [PARAM.range]: val === "any" ? null : val,
              [PARAM.from]: null,
              [PARAM.to]: null,
            })
          }
          options={rangeOptions}
          renderTrigger={(selected) => (
            <FilterLabel label={t("recruiterApplications.filter.submitted")} value={selected} />
          )}
          value={state.range}
        />

        <FilterSelect
          onChange={(val: DocumentFilterOption) =>
            state.set("documentType", val === ALL_DOCUMENTS ? null : val)
          }
          options={documentOptions}
          renderTrigger={(selected) => (
            <FilterLabel label={t("recruiterApplications.filter.document")} value={selected} />
          )}
          value={state.documentType ?? ALL_DOCUMENTS}
        />

        {state.hasFilters ? (
          <Button
            className="h-11 px-3 text-[13.5px] font-semibold text-muted-foreground hover:text-foreground"
            onClick={state.clearFilters}
            type="button"
            variant="ghost"
          >
            {t("recruiterApplications.filter.clearFilters")}
          </Button>
        ) : null}

        <ViewToggle
          onChange={(view) => state.setMany({ [PARAM.view]: view })}
          options={VIEW_MODES.map((value) => ({
            value,
            icon: VIEW_ICONS[value],
            label: t(`recruiterApplications.view.${value}`),
          }))}
          value={state.view}
        />
      </ListToolbar>

      {state.range === "custom" ? (
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          <label className="flex items-center gap-2">
            {t("recruiterApplications.filter.from")}
            <DatePicker
              aria-invalid={Boolean(rangeError)}
              className="h-11 w-44"
              clearable
              max={state.to || undefined}
              onChange={(value) => state.set("from", value || null)}
              value={state.from}
            />
          </label>
          <label className="flex items-center gap-2">
            {t("recruiterApplications.filter.to")}
            <DatePicker
              aria-invalid={Boolean(rangeError)}
              className="h-11 w-44"
              clearable
              min={state.from || undefined}
              onChange={(value) => state.set("to", value || null)}
              value={state.to}
            />
          </label>
          {rangeError ? (
            <span className="text-destructive" id="applications-filter-error" role="alert">
              {t(`recruiterApplications.errors.${rangeError}`)}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
