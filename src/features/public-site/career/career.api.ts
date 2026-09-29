import { client } from "@/api/client";

type JobPostingSummaryDto = {
  id: string;
  enterpriseId: string;
  title: string;
  location: string | null;
  employmentType: string | null;
  level: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string | null;
  postedAt: string;
};

type JobPostingDetailDto = JobPostingSummaryDto & {
  description: string | null;
  requirements: string | null;
  benefits: string | null;
  openings: number;
  deadline: string | null;
};

type PaginatedDto<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const BACKEND_MAX_LIMIT = 100;

export type Job = {
  _id: string;
  title: string;
  slug: string;
  location?: string;
  employment_type?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  level?: string;
  aboutTheRole?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  openings?: number;
  published_at?: string;
  expires_at?: string;
  createdAt?: string;
};

export type JobSort = "newest" | "oldest" | "salary_high" | "salary_low";

export type JobListQuery = {
  employment_type?: string;
  level?: string;
  limit?: number;
  location?: string;
  page?: number;
  search?: string;
  sort?: JobSort;
};

export type JobFilterOption = { count: number; value: string };

export type JobListResponse = {
  data: Job[];
  filters: {
    employmentTypes: JobFilterOption[];
    locations: JobFilterOption[];
  };
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

const EMPLOYMENT_TYPE_MAP: Record<string, string> = {
  contract: "contractor",
  full_time: "full-time",
  internship: "intern",
  part_time: "part-time",
  remote: "remote",
};

function toJob(dto: JobPostingSummaryDto | JobPostingDetailDto): Job {
  const detail = dto as Partial<JobPostingDetailDto>;

  return {
    _id: dto.id,
    slug: dto.id,
    title: dto.title,
    location: dto.location ?? undefined,
    employment_type: dto.employmentType
      ? (EMPLOYMENT_TYPE_MAP[dto.employmentType] ?? dto.employmentType)
      : undefined,
    salary_min: dto.salaryMin ?? undefined,
    salary_max: dto.salaryMax ?? undefined,
    currency: dto.currency ?? undefined,
    level: dto.level ?? undefined,
    description: detail.description ?? undefined,
    requirements: detail.requirements ?? undefined,
    benefits: detail.benefits ?? undefined,
    openings: detail.openings,
    expires_at: detail.deadline ?? undefined,
    published_at: dto.postedAt,
    createdAt: dto.postedAt,
  };
}

async function getPage(
  page: number,
): Promise<PaginatedDto<JobPostingSummaryDto>> {
  const result = await client.get<
    { 200: PaginatedDto<JobPostingSummaryDto> },
    { "*": unknown }
  >({
    query: { limit: BACKEND_MAX_LIMIT, page },
    url: "/api/v1/job-postings",
  });

  if (result.error || !result.data) {
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      {
        status: result.response?.status,
      },
    );
  }

  return result.data as PaginatedDto<JobPostingSummaryDto>;
}

const LIST_CACHE_MS = 30_000;
let listCache: { at: number; promise: Promise<Job[]> } | null = null;

async function loadAllJobs(): Promise<Job[]> {
  const first = await getPage(1);
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.totalPages - 1, 0) }, (_, i) =>
      getPage(i + 2),
    ),
  );

  return [first, ...rest].flatMap((page) => page.items).map(toJob);
}

function getAllJobs(): Promise<Job[]> {
  if (listCache && Date.now() - listCache.at < LIST_CACHE_MS)
    return listCache.promise;

  const promise = loadAllJobs();
  listCache = { at: Date.now(), promise };
  promise.catch(() => {
    if (listCache?.promise === promise) listCache = null;
  });

  return promise;
}

function topSalary(job: Job): number {
  return Math.max(job.salary_max ?? 0, job.salary_min ?? 0);
}

function sortJobs(jobs: Job[], sort: JobSort): Job[] {
  const time = (job: Job) => new Date(job.createdAt ?? 0).getTime();
  const sorted = [...jobs];

  switch (sort) {
    case "oldest":
      return sorted.sort((a, b) => time(a) - time(b));
    case "salary_high":
      return sorted.sort(
        (a, b) => topSalary(b) - topSalary(a) || time(b) - time(a),
      );
    case "salary_low":
      // Jobs without a salary stay last instead of floating to the top.
      return sorted.sort((a, b) => {
        const sa = topSalary(a) || Number.POSITIVE_INFINITY;
        const sb = topSalary(b) || Number.POSITIVE_INFINITY;
        return sa - sb || time(b) - time(a);
      });
    default:
      return sorted.sort((a, b) => time(b) - time(a));
  }
}

function countBy(
  jobs: Job[],
  pick: (job: Job) => string | undefined,
): JobFilterOption[] {
  const counts = new Map<string, number>();

  for (const job of jobs) {
    const value = pick(job);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([value, count]) => ({ count, value }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

export async function fetchJobs(query: JobListQuery): Promise<JobListResponse> {
  const all = await getAllJobs();
  const page = query.page ?? 1;
  const limit = query.limit ?? 5;
  const term = query.search?.trim().toLowerCase();

  const filtered = all.filter((job) => {
    if (query.employment_type && job.employment_type !== query.employment_type)
      return false;
    if (query.location && job.location !== query.location) return false;
    if (query.level && job.level !== query.level) return false;
    if (term) {
      // The list endpoint does not return descriptions, so search covers the summary fields.
      const haystack = [job.title, job.location, job.level, job.employment_type]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    return true;
  });

  const sorted = sortJobs(filtered, query.sort ?? "newest");
  const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);

  return {
    data: sorted.slice((page - 1) * limit, page * limit),
    filters: {
      employmentTypes: countBy(all, (job) => job.employment_type),
      locations: countBy(all, (job) => job.location),
    },
    limit,
    page,
    total: sorted.length,
    totalPages,
  };
}

export async function fetchJob(id: string): Promise<Job> {
  const result = await client.get<
    { 200: JobPostingDetailDto },
    { "*": unknown }
  >({
    url: "/api/v1/job-postings/{id}",
    path: { id },
  });

  if (result.error || !result.data) {
    const status = result.response?.status;
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      {
        // A malformed id is answered with 400; to the visitor that is simply "job not found".
        status: status === 400 ? 404 : status,
      },
    );
  }

  return toJob(result.data as JobPostingDetailDto);
}
