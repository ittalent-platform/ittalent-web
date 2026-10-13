import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { useListParams } from "@/hooks/use-list-params";

import {
  ALL_OPTION,
  DEFAULT_SORT_ORDER,
  INTERVIEW_DATE_FILTERS,
  INTERVIEW_DEFAULT_LIMIT,
  INTERVIEW_PARAMS,
  INTERVIEW_STATUSES,
  type InterviewDateFilter,
  type InterviewSortOrder,
  type InterviewStatus,
} from "./interviews.constants";
import { dateWindow } from "./interviews.format";
import type { InterviewListParams } from "./interviews.queries";

/** The List view's state, read from the URL: paging, search, status, date window and sort direction. */
export function useInterviewsParams() {
  const [searchParams] = useSearchParams();
  const list = useListParams({ defaultLimit: INTERVIEW_DEFAULT_LIMIT });

  const rawStatus = searchParams.get(INTERVIEW_PARAMS.status);
  const status = INTERVIEW_STATUSES.find((value) => value === rawStatus) ?? ALL_OPTION;
  const rawDate = searchParams.get(INTERVIEW_PARAMS.date);
  const date = INTERVIEW_DATE_FILTERS.find((value) => value === rawDate) ?? ALL_OPTION;
  const sortOrder: InterviewSortOrder = searchParams.get(INTERVIEW_PARAMS.sortOrder) === "desc" ? "desc" : DEFAULT_SORT_ORDER;

  const trimmedSearch = list.debouncedSearch.trim();
  const hasFilters = trimmedSearch !== "" || status !== ALL_OPTION || date !== ALL_OPTION;

  // "Now" is read when a date preset is picked, not on every render, so the request key stays stable.
  const window = useMemo(() => (date === ALL_OPTION ? {} : dateWindow(date as InterviewDateFilter, new Date())), [date]);

  const query: InterviewListParams = {
    limit: list.limit,
    page: list.page,
    sortBy: "scheduledAt",
    sortOrder,
    ...(trimmedSearch ? { search: trimmedSearch } : {}),
    ...(status !== ALL_OPTION ? { status } : {}),
    ...window,
  };

  return {
    ...list,
    date: date as InterviewDateFilter | typeof ALL_OPTION,
    hasFilters,
    query,
    sortOrder,
    status: status as InterviewStatus | typeof ALL_OPTION,
  };
}
