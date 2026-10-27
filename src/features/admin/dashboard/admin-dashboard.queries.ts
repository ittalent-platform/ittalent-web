import { useQuery } from "@tanstack/react-query";

import { getApiV1DashboardPlatform } from "@/api/generated";
import { requestStatus, unwrap } from "@/api/request-error";

const SERVER_ERROR_FROM = 500;

export const platformOverviewKeys = {
  all: ["platform-overview"] as const,
};

/**
 * How big the platform is and what waits for a decision, built by the API in one request. It never carries a
 * company's hiring data. A refusal is final, so only server errors are retried.
 */
export function usePlatformOverview() {
  return useQuery({
    queryFn: async () => unwrap(await getApiV1DashboardPlatform(), "Could not load the overview."),
    queryKey: platformOverviewKeys.all,
    retry: (failures, error) => failures < 1 && (requestStatus(error) ?? SERVER_ERROR_FROM) >= SERVER_ERROR_FROM,
  });
}
