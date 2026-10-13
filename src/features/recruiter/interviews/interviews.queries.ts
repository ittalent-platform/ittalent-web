import { useQuery } from "@tanstack/react-query";

import { getApiV1Interviews } from "@/api/generated";
import type { GetApiV1InterviewsData } from "@/api/generated/types.gen";
import { requestError } from "@/api/request-error";

export type InterviewListParams = NonNullable<GetApiV1InterviewsData["query"]>;

export const interviewKeys = {
  all: ["recruiter-interviews"] as const,
  list: (params: InterviewListParams) => [...interviewKeys.all, "list", params] as const,
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
