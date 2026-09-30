import { useQuery } from "@tanstack/react-query";

import {
  getApiV1Enterprises,
  getApiV1JobPostings,
  type JobPostingResponse,
} from "@/api/generated";

import {
  FIELD_COUNT_STALE_TIME_MS,
  HOME_ENTERPRISES_LIMIT,
  HOME_JOBS_LIMIT,
  HOME_STALE_TIME_MS,
  LATEST_JOBS_COUNT,
  NEW_JOB_WINDOW_MS,
  TOP_COMPANIES_COUNT,
} from "./home.constants";

export type HomeJob = JobPostingResponse & { companyName: string };

export type HomeCompany = {
  id: string;
  name: string;
  industry: string | null;
  location: string | null;
  shortDescription: string | null;
  companySize: string | null;
  openJobs: number;
};

export type HomeData = {
  totalJobs: number;
  newThisWeek: number;
  hiringCompanies: number;
  cities: string[];
  latestJobs: HomeJob[];
  topCompanies: HomeCompany[];
};

function unwrap<T>(result: {
  data?: T;
  error?: unknown;
  response?: Response;
}): T {
  if (result.error || !result.data) {
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      { status: result.response?.status },
    );
  }
  return result.data;
}

/** One pair of requests feeds the hero cards, stats, city list, latest jobs and top companies. */
export async function fetchHomeData(now = Date.now()): Promise<HomeData> {
  const [jobsResult, enterprisesResult] = await Promise.all([
    getApiV1JobPostings({
      query: {
        page: 1,
        limit: HOME_JOBS_LIMIT,
        sort_by: "created_at",
        sort_order: "desc",
      },
    }),
    getApiV1Enterprises({
      query: { page: 1, limit: HOME_ENTERPRISES_LIMIT, status: "active" },
    }),
  ]);
  const jobsPage = unwrap(jobsResult);
  const enterprises = new Map(
    unwrap(enterprisesResult).items.map((item) => [item.id, item]),
  );

  // Every job is shown with its company, so jobs of companies that aren't public are left out.
  const jobs = jobsPage.items.filter((job) =>
    enterprises.has(job.enterpriseId),
  );
  const openJobsByCompany = new Map<string, number>();
  for (const job of jobs)
    openJobsByCompany.set(
      job.enterpriseId,
      (openJobsByCompany.get(job.enterpriseId) ?? 0) + 1,
    );

  const topCompanies = [...openJobsByCompany.entries()]
    .map(([id, openJobs]) => {
      const company = enterprises.get(id)!;
      return {
        id,
        name: company.name,
        industry: company.industry,
        location: company.location,
        shortDescription: company.shortDescription,
        companySize: company.companySize,
        openJobs,
      };
    })
    .sort((a, b) => b.openJobs - a.openJobs || a.name.localeCompare(b.name))
    .slice(0, TOP_COMPANIES_COUNT);

  return {
    totalJobs: jobs.length,
    newThisWeek: jobs.filter(
      (job) => now - new Date(job.createdAt).getTime() <= NEW_JOB_WINDOW_MS,
    ).length,
    hiringCompanies: openJobsByCompany.size,
    cities: [
      ...new Set(
        jobs
          .map((job) => job.location)
          .filter((location): location is string => Boolean(location)),
      ),
    ],
    latestJobs: jobs.slice(0, LATEST_JOBS_COUNT).map((job) => ({
      ...job,
      companyName: enterprises.get(job.enterpriseId)!.name,
    })),
    topCompanies,
  };
}

export const homeKeys = {
  data: ["home", "data"] as const,
  fieldCount: (keyword: string) => ["home", "field-count", keyword] as const,
};

export function useHomeData() {
  return useQuery({
    queryKey: homeKeys.data,
    queryFn: () => fetchHomeData(),
    staleTime: HOME_STALE_TIME_MS,
  });
}

/** Open jobs matching a keyword, counted by the same search the Jobs page runs when the tile is opened. */
export function useFieldCount(keyword: string) {
  return useQuery({
    queryKey: homeKeys.fieldCount(keyword),
    queryFn: async () =>
      unwrap(
        await getApiV1JobPostings({
          query: { page: 1, limit: 1, search: keyword },
        }),
      ).total,
    staleTime: FIELD_COUNT_STALE_TIME_MS,
  });
}
