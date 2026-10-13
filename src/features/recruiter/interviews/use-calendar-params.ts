import { useMemo } from "react";
import { useSearchParams } from "react-router";

import { useListParams } from "@/hooks/use-list-params";

import { monthGrid, monthOf, parseMonth } from "./interviews.calendar";
import { ALL_OPTION, INTERVIEW_PARAMS, INTERVIEW_STATUSES, type InterviewStatus } from "./interviews.constants";
import type { InterviewCalendarParams } from "./interviews.queries";

/** The Calendar view's state, read from the URL: the month shown, the keyword and the status. */
export function useCalendarParams() {
  const [searchParams] = useSearchParams();
  const list = useListParams();

  const currentMonth = monthOf(new Date());
  const month = parseMonth(searchParams.get(INTERVIEW_PARAMS.month), currentMonth);
  const rawStatus = searchParams.get(INTERVIEW_PARAMS.status);
  const status = INTERVIEW_STATUSES.find((value) => value === rawStatus) ?? ALL_OPTION;
  const grid = useMemo(() => monthGrid(month), [month]);
  const keyword = list.debouncedSearch.trim();

  const query: InterviewCalendarParams = {
    from: grid.from,
    to: grid.to,
    ...(keyword ? { search: keyword } : {}),
    ...(status !== ALL_OPTION ? { status } : {}),
  };

  return { ...list, currentMonth, grid, month, query, status: status as InterviewStatus | typeof ALL_OPTION };
}
