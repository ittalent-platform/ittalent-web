import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getApiV1Interviews,
  getApiV1InterviewsApplications,
  getApiV1InterviewsById,
  getApiV1InterviewsCalendar,
  getApiV1InterviewsInterviewers,
  patchApiV1InterviewsByIdStatus,
  postApiV1Interviews,
} from "@/api/generated";
import type { CreateInterviewRequest, GetApiV1InterviewsCalendarData, GetApiV1InterviewsData, UpdateInterviewStatusRequest } from "@/api/generated/types.gen";
import { requestError } from "@/api/request-error";

import { LOOKUP_LIMIT } from "./interviews.constants";

const LOOKUP_STALE_MS = 60_000;

export type InterviewListParams = NonNullable<GetApiV1InterviewsData["query"]>;
export type InterviewCalendarParams = NonNullable<GetApiV1InterviewsCalendarData["query"]>;

export const interviewKeys = {
  all: ["recruiter-interviews"] as const,
  list: (params: InterviewListParams) => [...interviewKeys.all, "list", params] as const,
  calendar: (params: InterviewCalendarParams) => [...interviewKeys.all, "calendar", params] as const,
  applications: (search: string) => [...interviewKeys.all, "applications", search] as const,
  interviewers: (search: string) => [...interviewKeys.all, "interviewers", search] as const,
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

/** Moves a scheduled interview to its final status; every list, the calendar and the detail refresh afterwards. */
export function useUpdateInterviewStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: UpdateInterviewStatusRequest & { id: string }) =>
      unwrap(await patchApiV1InterviewsByIdStatus({ body, path: { id } }), "Could not update this interview."),
    onSettled: () => queryClient.invalidateQueries({ queryKey: interviewKeys.all }),
  });
}

/** Applications an interview can still be scheduled for, filtered by what was typed. */
export function useSchedulableApplications(search: string, options: { enabled: boolean }) {
  const keyword = search.trim();
  return useQuery({
    enabled: options.enabled,
    placeholderData: keepPreviousData,
    queryFn: async () =>
      unwrap(await getApiV1InterviewsApplications({ query: { limit: LOOKUP_LIMIT, ...(keyword ? { search: keyword } : {}) } }), "Could not load applications."),
    queryKey: interviewKeys.applications(keyword),
  });
}

/** Active recruiters of the company who can interview, filtered by what was typed. */
export function useInterviewerSearch(search: string, options: { enabled: boolean }) {
  const keyword = search.trim();
  return useQuery({
    enabled: options.enabled,
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getApiV1InterviewsInterviewers({ query: { limit: LOOKUP_LIMIT, ...(keyword ? { search: keyword } : {}) } }), "Could not load interviewers."),
    queryKey: interviewKeys.interviewers(keyword),
  });
}

/** The company's interviewer with exactly this email, or `undefined` when nobody active has it. */
export function useFindInterviewerByEmail() {
  const queryClient = useQueryClient();
  return async (email: string) => {
    const keyword = email.trim().toLowerCase();
    const found = await queryClient.fetchQuery({
      queryFn: async () => unwrap(await getApiV1InterviewsInterviewers({ query: { limit: LOOKUP_LIMIT, search: keyword } }), "Could not load interviewers."),
      queryKey: interviewKeys.interviewers(keyword),
      staleTime: LOOKUP_STALE_MS,
    });
    return found.items.find((person) => person.email.toLowerCase() === keyword);
  };
}

/** Schedules an interview; the lists and the calendar refresh afterwards. */
export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateInterviewRequest) => unwrap(await postApiV1Interviews({ body }), "Could not create this interview."),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: interviewKeys.all }),
  });
}
