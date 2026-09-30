import { Columns3, Table2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { ChecklistPopover } from "@/components/common/checklist-popover";
import { ListToolbar } from "@/components/common/list-toolbar";
import { FilterSelect } from "@/components/ui/filter-select";
import { DatePicker } from "@/components/ui/date-picker";
import { ViewToggle } from "@/components/ui/view-toggle";
import {
  APPLICATION_STATUSES, CLOSED_STATUSES, IN_PROGRESS_STATUSES, MAX_SEARCH_LENGTH, PARAM, REVIEW_STAGES, STATUS_TONES, SUBMITTED_RANGES, VIEW_MODES,
  type ApplicationStatus, type ReviewStage, type SubmittedRange,
} from "./applications.constants";
import type { ApplicationsListState } from "./use-applications-params";

const VIEW_ICONS = { table: Table2, board: Columns3 } as const;
const ANY_STAGE = "any";
type StageFilter = ReviewStage | typeof ANY_STAGE;

/** "Stage: Any" style trigger: the label stays muted, the current value is emphasised. */
function FilterLabel({ label, value }: { label: string; value: string }) {
  return <>{label} <span className="font-semibold text-foreground">{value}</span></>;
}

export function ApplicationsToolbar({ state, statusCounts, showCounts }: { state: ApplicationsListState; statusCounts: Record<ApplicationStatus, number> | undefined; showCounts: boolean }) {
  const { t } = useTranslation();
  const statusOptions = APPLICATION_STATUSES.map((value) => ({ value, label: t(`applications.status.${value}`), dotClass: STATUS_TONES[value].dot, count: statusCounts?.[value] }));
  const statusValue = state.statuses.length === 0 ? t("applications.filter.all") : state.statuses.length === 1 ? t(`applications.status.${state.statuses[0]!}`) : t("applications.filter.selected", { count: state.statuses.length });
  const stageOptions = [{ value: ANY_STAGE as StageFilter, label: t("applications.filter.any") }, ...REVIEW_STAGES.map((value) => ({ value: value as StageFilter, label: t(`applications.stage.${value}`) }))];
  const rangeOptions = SUBMITTED_RANGES.map((value) => ({ value, label: t(`applications.range.${value}`) }));
  const errorId = "applications-filter-error";
  const rangeError = state.errors.range;

  return (
    <div className="flex flex-col gap-3">
      <ListToolbar
        className="flex flex-wrap items-start gap-3"
        onSearchChange={(value) => state.set("search", value)}
        search={state.search}
        searchError={state.errors.keyword ? t(`applications.errors.${state.errors.keyword}`, { max: MAX_SEARCH_LENGTH }) : undefined}
        searchMaxLength={MAX_SEARCH_LENGTH}
        searchPlaceholder={t("applications.search")}
      >
        <ChecklistPopover<ApplicationStatus>
          caption={t("applications.filter.statusCaption")}
          footerHint={t("applications.filter.appliesRightAway")}
          label={t("applications.filter.status")}
          onChange={(values) => state.set("status", values.length ? values.join(",") : null)}
          options={statusOptions}
          presets={[
            { label: t("applications.filter.all"), values: APPLICATION_STATUSES },
            { label: t("applications.filter.inProgress"), values: IN_PROGRESS_STATUSES },
            { label: t("applications.filter.closed"), values: CLOSED_STATUSES },
          ]}
          selectAllLabel={t("applications.filter.selectAll")}
          showCounts={showCounts}
          triggerValue={statusValue}
          values={state.statuses}
        />
        <FilterSelect
          onChange={(value: StageFilter) => state.set("stage", value === ANY_STAGE ? null : value)}
          options={stageOptions}
          renderTrigger={(selected) => <FilterLabel label={t("applications.filter.stage")} value={selected} />}
          value={(state.stage ?? ANY_STAGE) as StageFilter}
        />
        <FilterSelect
          onChange={(range: SubmittedRange) => state.setMany({ [PARAM.range]: range === "any" ? null : range, [PARAM.from]: null, [PARAM.to]: null })}
          options={rangeOptions}
          renderTrigger={(selected) => <FilterLabel label={t("applications.filter.submitted")} value={selected} />}
          value={state.range}
        />
        <ViewToggle
          onChange={(view) => state.setMany({ [PARAM.view]: view })}
          options={VIEW_MODES.map((value) => ({ value, icon: VIEW_ICONS[value], label: t(`applications.view.${value}`) }))}
          value={state.view}
        />
      </ListToolbar>

      {state.range === "custom" ? (
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">
          <label className="flex items-center gap-2">{t("applications.filter.from")}<DatePicker aria-invalid={Boolean(rangeError)} className="h-11 w-44" clearable max={state.to || undefined} onChange={(value) => state.set("from", value || null)} value={state.from} /></label>
          <label className="flex items-center gap-2">{t("applications.filter.to")}<DatePicker aria-invalid={Boolean(rangeError)} className="h-11 w-44" clearable min={state.from || undefined} onChange={(value) => state.set("to", value || null)} value={state.to} /></label>
          {rangeError ? <span className="text-destructive" id={errorId} role="alert">{t(`applications.errors.${rangeError}`)}</span> : null}
        </div>
      ) : null}

      {state.jobId ? (
        <div className="flex">
          <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-muted pl-3 pr-1 text-[13px] text-foreground">
            {t("applications.filter.job")} <span className="itt-mono text-xs">{state.jobId.slice(-6).toUpperCase()}</span>
            <button aria-label={t("applications.filter.clearJob")} className="grid size-6 cursor-pointer place-items-center rounded-md text-muted-foreground hover:bg-card hover:text-foreground" onClick={() => state.set("jobId", null)} type="button"><X aria-hidden className="size-3.5" /></button>
          </span>
        </div>
      ) : null}
    </div>
  );
}
