import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { getApiV1DashboardCompany } from "@/api/generated";
import type { GetApiV1DashboardCompanyData } from "@/api/generated/types.gen";
import { requestStatus, unwrap } from "@/api/request-error";

export type CompanyDashboardQuery = NonNullable<GetApiV1DashboardCompanyData["query"]>;

const SERVER_ERROR_FROM = 500;

export const dashboardKeys = {
  all: ["company-dashboard"] as const,
  company: (query: CompanyDashboardQuery) => [...dashboardKeys.all, query] as const,
};

/**
 * The statistics of the caller's own company for one period, built by the API in a single request so the numbers on
 * the page always come from the same moment. The previous period's numbers stay on screen (marked as such) while a
 * new one loads. A refusal (not a member, company not active) is final, so only server errors are retried.
 */
export function useCompanyDashboard(query: CompanyDashboardQuery) {
  return useQuery({
    placeholderData: keepPreviousData,
    queryFn: async () => unwrap(await getApiV1DashboardCompany({ query }), "Could not load the statistics."),
    queryKey: dashboardKeys.company(query),
    retry: (failures, error) => failures < 1 && (requestStatus(error) ?? SERVER_ERROR_FROM) >= SERVER_ERROR_FROM,
  });
}
