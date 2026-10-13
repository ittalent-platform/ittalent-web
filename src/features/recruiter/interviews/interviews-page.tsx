import { CalendarDays, Lock, Search } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router";

import { TableSurface } from "@/components/common/data-table";
import { EmptyState } from "@/components/common/empty-state";
import { InlineBanner } from "@/components/common/inline-banner";
import { Pagination } from "@/components/ui/pagination";
import { requestStatus } from "@/api/request-error";
import { useUrlSearchInput } from "@/hooks/use-url-search-input";
import { hasUnsafeSearchText } from "@/lib/search-validation";

import { InterviewsCalendarView } from "./interviews-calendar-view";
import { InterviewsHeader } from "./interviews-header";
import { InterviewsTable } from "./interviews-table";
import { InterviewsToolbar } from "./interviews-toolbar";
import { ALL_OPTION, FORBIDDEN_STATUS, INTERVIEW_PAGE_SIZE_OPTIONS, INTERVIEW_PARAMS, type InterviewView } from "./interviews.constants";
import { useInterviewList } from "./interviews.queries";
import { useInterviewsParams } from "./use-interviews-params";

function InterviewsListView({ onViewChange }: { onViewChange: (view: InterviewView) => void }) {
  const { t } = useTranslation();
  const params = useInterviewsParams();
  const { date, hasFilters, limit, page, query: listParams, search, set, setMany, sortOrder, status } = params;
  const commitSearch = useCallback((value: string) => set("search", value), [set]);
  const [searchText, setSearchText] = useUrlSearchInput(search, commitSearch);

  // Nothing is searched while the keyword holds characters the API refuses; the field says so instead.
  const searchInvalid = hasUnsafeSearchText(search);
  const interviews = useInterviewList(listParams, { enabled: !searchInvalid });
  const items = interviews.data?.items ?? [];
  const total = interviews.data?.total ?? 0;

  const clearFilters = () => setMany({ search: null, [INTERVIEW_PARAMS.status]: null, [INTERVIEW_PARAMS.date]: null });
  const keyword = search.trim();

  const emptyState = hasFilters ? (
    <EmptyState
      action={{ label: t("interviews.empty.clearFilters"), onClick: clearFilters, variant: "outline" }}
      description={t("interviews.empty.noMatchDescription")}
      icon={Search}
      title={keyword ? t("interviews.empty.noResultsFor", { keyword }) : t("interviews.empty.noMatchTitle")}
    />
  ) : (
    <EmptyState description={t("interviews.empty.description")} icon={CalendarDays} title={t("interviews.empty.title")} />
  );

  return (
    <div className="flex flex-col gap-5">
      <InterviewsHeader description={interviews.data ? t("interviews.page.count", { count: total }) : undefined} onViewChange={onViewChange} view="table" />

      <InterviewsToolbar
        date={date}
        onDateChange={(next) => set(INTERVIEW_PARAMS.date, next === ALL_OPTION ? null : next)}
        onSearchChange={setSearchText}
        onStatusChange={(next) => set(INTERVIEW_PARAMS.status, next === ALL_OPTION ? null : next)}
        search={searchText}
        searchError={searchInvalid ? t("interviews.toolbar.searchInvalid") : undefined}
        status={status}
      />

      {interviews.isError && requestStatus(interviews.error) === FORBIDDEN_STATUS ? (
        <TableSurface className="rounded-2xl">
          <EmptyState description={t("interviews.noAccess.description")} icon={Lock} title={t("interviews.noAccess.title")} />
        </TableSurface>
      ) : interviews.isError ? (
        <InlineBanner action={{ label: t("errorState.retry"), onClick: () => void interviews.refetch() }}>
          {t("interviews.loadFailed")}
        </InlineBanner>
      ) : (
        <TableSurface className="rounded-2xl">
          <InterviewsTable
            emptyState={emptyState}
            isLoading={interviews.isPending && !searchInvalid}
            items={items}
            onSort={() => set(INTERVIEW_PARAMS.sortOrder, sortOrder === "asc" ? "desc" : "asc")}
            sortOrder={sortOrder}
          />
        </TableSurface>
      )}

      <Pagination
        limit={limit}
        onLimitChange={(next) => setMany({ limit: String(next), page: "1" })}
        onPageChange={(next) => set("page", String(next))}
        page={page}
        pageSizeOptions={INTERVIEW_PAGE_SIZE_OPTIONS}
        total={total}
        totalPages={interviews.data?.totalPages ?? 1}
      />
    </div>
  );
}

/** The company's interviews, as a table (default) or as a month calendar, chosen in the address with `view`. */
export function InterviewsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const view: InterviewView = searchParams.get(INTERVIEW_PARAMS.view) === "calendar" ? "calendar" : "table";

  // The keyword and status carry over; paging and the date preset belong to the table.
  const changeView = useCallback(
    (next: InterviewView) =>
      setSearchParams((prev) => {
        const params = new URLSearchParams(prev);
        params.delete("page");
        if (next === "calendar") params.set(INTERVIEW_PARAMS.view, next);
        else params.delete(INTERVIEW_PARAMS.view);
        return params;
      }),
    [setSearchParams],
  );

  return view === "calendar" ? <InterviewsCalendarView onViewChange={changeView} /> : <InterviewsListView onViewChange={changeView} />;
}
