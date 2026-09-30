import { getApiV1JobPostings, type JobPostingResponse } from "@/api/generated";

const BACKEND_MAX_LIMIT = 100;

export type Job = {
  _id: string;
  enterpriseId?: string;
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

export type PostedWithin = "24h" | "7d" | "30d";

export type JobListQuery = {
  employment_type?: string[];
  level?: string[];
  limit?: number;
  location?: string;
  enterpriseId?: string;
  /** Million VND / month. */
  salaryMin?: number;
  salaryMax?: number;
  /** Only matters while a salary bound is set. Defaults to true. */
  includeNegotiable?: boolean;
  postedWithin?: PostedWithin;
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
    enterprises: JobFilterOption[];
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

function toJob(dto: JobPostingResponse): Job {
  return {
    _id: dto.id,
    enterpriseId: dto.enterpriseId,
    slug: dto.id,
    title: dto.title,
    location: dto.location,
    employment_type: dto.employmentType
      ? (EMPLOYMENT_TYPE_MAP[dto.employmentType] ?? dto.employmentType)
      : undefined,
    salary_min: dto.salaryMin,
    salary_max: dto.salaryMax,
    currency: dto.currency,
    level: dto.level,
    description: dto.description,
    requirements: dto.requirements,
    benefits: dto.benefits,
    openings: dto.openings,
    expires_at: dto.expiresAt,
    published_at: dto.createdAt,
    createdAt: dto.createdAt,
  };
}

async function getPage(page: number) {
  const result = await getApiV1JobPostings({
    query: { limit: BACKEND_MAX_LIMIT, page },
  });

  if (result.error || !result.data) {
    throw Object.assign(
      result.error && typeof result.error === "object" ? result.error : {},
      { status: result.response?.status },
    );
  }

  return result.data;
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

const MILLION = 1_000_000;

const POSTED_WITHIN_MS: Record<PostedWithin, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

function matchesSalary(job: Job, query: JobListQuery): boolean {
  const { salaryMin, salaryMax } = query;
  if (salaryMin === undefined && salaryMax === undefined) return true;

  const low = job.salary_min && job.salary_min > 0 ? job.salary_min : undefined;
  const high = job.salary_max && job.salary_max > 0 ? job.salary_max : undefined;

  // "Negotiable" jobs publish no figure.
  if (!low && !high) return query.includeNegotiable ?? true;
  // The bounds are in million VND, so other currencies cannot be compared.
  if (job.currency && job.currency !== "VND") return true;

  const top = high ?? low!;
  const bottom = low ?? high!;
  if (salaryMin !== undefined && top < salaryMin * MILLION) return false;
  if (salaryMax !== undefined && bottom > salaryMax * MILLION) return false;
  return true;
}

export async function fetchJobs(query: JobListQuery): Promise<JobListResponse> {
  const all = await getAllJobs();
  const page = query.page ?? 1;
  const limit = query.limit ?? 5;
  const term = query.search?.trim().toLowerCase();
  const types = query.employment_type?.length ? query.employment_type : undefined;
  const levels = query.level?.length
    ? query.level.map((level) => level.toLowerCase())
    : undefined;
  const postedSince = query.postedWithin
    ? Date.now() - POSTED_WITHIN_MS[query.postedWithin]
    : undefined;

  const filtered = all.filter((job) => {
    if (types && !(job.employment_type && types.includes(job.employment_type)))
      return false;
    if (levels && !(job.level && levels.includes(job.level.toLowerCase())))
      return false;
    if (query.location && job.location !== query.location) return false;
    if (query.enterpriseId && job.enterpriseId !== query.enterpriseId)
      return false;
    if (postedSince !== undefined) {
      const postedAt = new Date(job.createdAt ?? 0).getTime();
      if (!(postedAt >= postedSince)) return false;
    }
    if (!matchesSalary(job, query)) return false;
    if (term) {
      // Search covers the summary fields only, not the description text.
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
      enterprises: countBy(all, (job) => job.enterpriseId),
    },
    limit,
    page,
    total: sorted.length,
    totalPages,
  };
}

export async function fetchJob(id: string): Promise<Job> {
  // GET /job-postings/{id} is a recruiter/admin endpoint, so visitors read the
  // job from the public list, which already carries the full description.
  const job = (await getAllJobs()).find((item) => item._id === id);

  if (!job) throw Object.assign(new Error("Job not found"), { status: 404 });

  return job;
}

export async function fetchJobsByEnterprise(enterpriseId: string): Promise<Job[]> {
  const all = await getAllJobs();
  return sortJobs(
    all.filter((job) => job.enterpriseId === enterpriseId),
    "newest",
  );
}

/** Number of public open roles per enterprise id. */
export async function fetchOpenRoleCounts(): Promise<Record<string, number>> {
  const all = await getAllJobs();
  const counts: Record<string, number> = {};
  for (const job of all) {
    if (job.enterpriseId) counts[job.enterpriseId] = (counts[job.enterpriseId] ?? 0) + 1;
  }
  return counts;
}