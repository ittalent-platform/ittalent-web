import { useQuery } from "@tanstack/react-query";

import { getApiV1Interviews, getApiV1InterviewsById, getApiV1InterviewsCalendar } from "@/api/generated";
import type { GetApiV1InterviewsCalendarData, GetApiV1InterviewsData } from "@/api/generated/types.gen";
import { requestError } from "@/api/request-error";

export type InterviewListParams = NonNullable<GetApiV1InterviewsData["query"]>;
export type InterviewCalendarParams = NonNullable<GetApiV1InterviewsCalendarData["query"]>;

export const interviewKeys = {
  all: ["recruiter-interviews"] as const,
  list: (params: InterviewListParams) => [...interviewKeys.all, "list", params] as const,
  calendar: (params: InterviewCalendarParams) => [...interviewKeys.all, "calendar", params] as const,
  detail: (id: string) => [...interviewKeys.all, "detail", id] as const,
};

function unwrap<T>(result: { data?: T; error?: unknown; response?: Response }, fallback: string): T {
  if (!result.error && result.data !== undefined) return result.data;
  throw requestError(result, fallback);
}

/** The company's interviews, one page at a time (List view). */
export function useInterviewList(params: InterviewListParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: async () => unwrap(await getApiV1Interviews({ query: params }), "Could not load interviews."),
    queryKey: interviewKeys.list(params),
  });
}

/** One interview with its interviewers and status history (Detail page). */
export function useInterviewDetail(id: string | undefined) {
  return useQuery({
    enabled: Boolean(id),
    queryFn: async () => unwrap(await getApiV1InterviewsById({ path: { id: id ?? "" } }), "Could not load this interview."),
    queryKey: interviewKeys.detail(id ?? ""),
  });
}

/** Every interview of a date window, for the month grid (Calendar view). */
export function useInterviewCalendar(params: InterviewCalendarParams, options: { enabled?: boolean } = {}) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryFn: async () => unwrap(await getApiV1InterviewsCalendar({ query: params }), "Could not load interviews."),
    queryKey: interviewKeys.calendar(params),
  });
}
