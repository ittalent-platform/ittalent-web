import { Lock } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { requestStatus } from "@/api/request-error";
import { EmptyState } from "@/components/common/empty-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { ListToolbar } from "@/components/common/list-toolbar";
import { prefixedFilterTrigger } from "@/components/common/prefixed-filter-trigger";
import { FilterSelect } from "@/components/ui/filter-select";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { hasUnsafeSearchText } from "@/lib/search-validation";

import { InterviewsCalendar } from "./interviews-calendar";
import { InterviewsHeader } from "./interviews-header";
import { monthName } from "./interviews.calendar";
import { ALL_OPTION, CALENDAR_FIELDS, FORBIDDEN_STATUS, INTERVIEW_PARAMS, INTERVIEW_SEARCH_MAX_LENGTH, INTERVIEW_STATUSES, type CalendarField, type InterviewView } from "./interviews.constants";
import { vietnamDay } from "./interviews.format";
import { useInterviewCalendar } from "./interviews.queries";
import { useInterviewActions } from "./use-interview-actions";
import { useCalendarParams } from "./use-calendar-params";

/** The month of interviews as a calendar. It only narrows by keyword and status: the month is the window. */
export function InterviewsCalendarView({ onViewChange }: { onViewChange: (view: InterviewView) => void }) {
  const { t, i18n } = useTranslation();
  const { currentMonth, grid, month, query, search, set, status } = useCalendarParams();
  const actions = useInterviewActions();
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);
  const [fields, setFields] = useState<ReadonlySet<CalendarField>>(() => new Set(CALENDAR_FIELDS));

  const searchInvalid = hasUnsafeSearchText(search);
  const calendar = useInterviewCalendar(query, { enabled: !searchInvalid });
  const items = useMemo(() => calendar.data?.items ?? [], [calendar.data]);
  // The grid also shows days of the neighbouring months; only the month's own interviews are counted.
  const inMonth = useMemo(() => items.filter((item) => vietnamDay(item.scheduledAt).startsWith(month)).length, [items, month]);
  const all = t("interviews.toolbar.all");

  const toggleField = (field: CalendarField) =>
    setFields((current) => {
      const next = new Set(current);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next.size === 0 ? current : next;
    });

  return (
    <div className="flex flex-col gap-5">
      <InterviewsHeader
        description={calendar.data ? t("interviews.page.countInMonth", { count: inMonth, month: monthName(month, i18n.language) }) : undefined}
        onViewChange={onViewChange}
        view="calendar"
      />

      <ListToolbar
        onSearchChange={setSearchText}
        search={searchText}
        searchError={searchInvalid ? t("interviews.toolbar.searchInvalid") : undefined}
        searchMaxLength={INTERVIEW_SEARCH_MAX_LENGTH}
        searchPlaceholder={t("interviews.toolbar.search")}
      >
        <FilterSelect
          onChange={(next) => set(INTERVIEW_PARAMS.status, next === ALL_OPTION ? null : next)}
          options={[{ label: all, value: ALL_OPTION }, ...INTERVIEW_STATUSES.map((value) => ({ label: t(`interviews.status.${value}`), value }))]}
          renderTrigger={prefixedFilterTrigger(`${t("interviews.toolbar.status")}:`)}
          value={status}
        />
      </ListToolbar>

      {calendar.isError && requestStatus(calendar.error) === FORBIDDEN_STATUS ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <EmptyState description={t("interviews.noAccess.description")} icon={Lock} title={t("interviews.noAccess.title")} />
        </div>
      ) : (
        <>
          {calendar.isError ? (
            <InlineBanner action={{ label: t("errorState.retry"), onClick: () => void calendar.refetch() }}>{t("interviews.loadFailed")}</InlineBanner>
          ) : null}
          {calendar.data?.truncated ? <InlineBanner tone="warning">{t("interviews.calendar.truncated", { count: items.length })}</InlineBanner> : null}
          <InterviewsCalendar
            currentMonth={currentMonth}
            days={grid.days}
            fields={fields}
            isLoading={calendar.isPending && !searchInvalid}
            items={items}
            month={month}
            onAction={actions.run}
            onFieldToggle={toggleField}
            onMonthChange={(next) => set(INTERVIEW_PARAMS.month, next === currentMonth ? null : next)}
          />
        </>
      )}
      {actions.dialog}
    </div>
  );
}
