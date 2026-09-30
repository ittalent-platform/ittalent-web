import { client } from "@/api/client";
import {
  fetchJobsByEnterprise,
  fetchOpenRoleCounts,
} from "@/features/public-site/career/career.api";

type EnterpriseSummaryDto = {
  id: string;
  name: string;
  logoUrl: string | null;
  industry: string | null;
  location: string | null;
  shortDescription: string | null;
};

type EnterpriseDetailDto = EnterpriseSummaryDto & {
  description: string | null;
  website: string | null;
};

type PaginatedDto<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type Enterprise = {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
  shortDescription?: string;
  description?: string;
  website?: string;
};

export type EnterpriseListQuery = {
  industry?: string;
  keyword?: string;
  limit?: number;
  location?: string;
  page?: number;
};

export type EnterpriseFilterOption = { count: number; value: string };

export type EnterpriseListResponse = {
  data: Enterprise[];
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

const BACKEND_MAX_LIMIT = 100;

function toEnterprise(
  dto: EnterpriseSummaryDto | EnterpriseDetailDto,
): Enterprise {
  const detail = dto as Partial<EnterpriseDetailDto>;
  return {
    id: dto.id,
    name: dto.name,
    logoUrl: dto.logoUrl ?? undefined,
    industry: dto.industry ?? undefined,
    location: dto.location ?? undefined,
    shortDescription: dto.shortDescription ?? undefined,
    description: detail.description ?? undefined,
    website: detail.website ?? undefined,
  };
}

function fail(
  result: { error?: unknown; response?: Response },
  map400 = false,
): never {
  const status = result.response?.status;
  throw Object.assign(
    result.error && typeof result.error === "object" ? result.error : {},
    { status: map400 && status === 400 ? 404 : status },
  );
}

async function getPage(
  query: EnterpriseListQuery,
): Promise<PaginatedDto<EnterpriseSummaryDto>> {
  const result = await client.get<
    { 200: PaginatedDto<EnterpriseSummaryDto> },
    { "*": unknown }
  >({
    query: { ...query, limit: query.limit ?? BACKEND_MAX_LIMIT },
    url: "/api/v1/enterprises",
  });
  if (result.error || !result.data) fail(result);
  return result.data as PaginatedDto<EnterpriseSummaryDto>;
}

/** Search, filters and pagination are all handled by the backend. */
export async function fetchEnterprises(
  query: EnterpriseListQuery,
): Promise<EnterpriseListResponse> {
  const page = await getPage({ ...query, limit: query.limit ?? 9 });
  return {
    data: page.items.map(toEnterprise),
    limit: page.limit,
    page: page.page,
    total: page.total,
    totalPages: Math.max(page.totalPages, 1),
  };
}

// The backend has no facet endpoint, so filter options (with counts) are built once
// from the full public list and cached briefly.
let facetCache: { at: number; promise: Promise<Enterprise[]> } | null = null;

async function loadAll(): Promise<Enterprise[]> {
  const first = await getPage({ page: 1 });
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.totalPages - 1, 0) }, (_, i) =>
      getPage({ page: i + 2 }),
    ),
  );
  return [first, ...rest].flatMap((p) => p.items).map(toEnterprise);
}

function count(
  list: Enterprise[],
  pick: (e: Enterprise) => string | undefined,
): EnterpriseFilterOption[] {
  const counts = new Map<string, number>();
  for (const item of list) {
    const value = pick(item);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, n]) => ({ count: n, value }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}

async function getAllEnterprises(): Promise<Enterprise[]> {
  if (!facetCache || Date.now() - facetCache.at > 30_000) {
    const promise = loadAll();
    facetCache = { at: Date.now(), promise };
    promise.catch(() => {
      if (facetCache?.promise === promise) facetCache = null;
    });
  }
  return facetCache.promise;
}

export async function fetchEnterpriseFilters() {
  const all = await getAllEnterprises();
  return {
    industries: count(all, (e) => e.industry),
    locations: count(all, (e) => e.location),
    total: all.length,
  };
}

/** Every public enterprise, e.g. to show company names on job cards. */
export function fetchEnterpriseDirectory() {
  return getAllEnterprises();
}

export async function fetchEnterprise(id: string): Promise<Enterprise> {
  const result = await client.get<
    { 200: EnterpriseDetailDto },
    { "*": unknown }
  >({
    path: { enterpriseId: id },
    url: "/api/v1/enterprises/{enterpriseId}",
  });
  if (result.error || !result.data) fail(result, true);
  return toEnterprise(result.data as EnterpriseDetailDto);
}

/** Open positions of one enterprise, taken from the public job-postings list. */
export function fetchEnterpriseJobs(id: string) {
  return fetchJobsByEnterprise(id);
}

export type EnterpriseSort = "most_jobs" | "name";

export type EnterpriseDirectoryQuery = {
  /** Company name contains this text (case-insensitive). */
  keyword?: string;
  industry?: string;
  location?: string;
  /** Only companies with at least one open job. */
  hiringOnly?: boolean;
  sort?: EnterpriseSort;
  page?: number;
  limit?: number;
};

export type EnterpriseDirectoryResponse = {
  data: Enterprise[];
  /** Open jobs per enterprise id (whole directory). */
  roleCounts: Record<string, number>;
  filters: {
    industries: EnterpriseFilterOption[];
    locations: EnterpriseFilterOption[];
  };
  limit: number;
  page: number;
  total: number;
  totalPages: number;
};

/**
 * Companies · list + search (UC-BENT-01/03).
 * Search, filters, sort and paging run over the cached public directory so
 * "hiring now" and "most open jobs" can use the job counts.
 */
export async function fetchEnterpriseDirectoryPage(
  query: EnterpriseDirectoryQuery,
): Promise<EnterpriseDirectoryResponse> {
  const [all, roleCounts] = await Promise.all([
    getAllEnterprises(),
    fetchOpenRoleCounts(),
  ]);
  const limit = query.limit ?? 12;
  const term = query.keyword?.trim().toLowerCase();
  const jobs = (e: Enterprise) => roleCounts[e.id] ?? 0;

  const filtered = all.filter((e) => {
    if (query.industry && e.industry !== query.industry) return false;
    if (query.location && e.location !== query.location) return false;
    if (query.hiringOnly && jobs(e) === 0) return false;
    if (term && !e.name.toLowerCase().includes(term)) return false;
    return true;
  });

  const byName = (a: Enterprise, b: Enterprise) => a.name.localeCompare(b.name);
  const sorted = [...filtered].sort(
    query.sort === "name" ? byName : (a, b) => jobs(b) - jobs(a) || byName(a, b),
  );

  const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);
  const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);

  return {
    data: sorted.slice((page - 1) * limit, page * limit),
    roleCounts,
    filters: {
      industries: count(all, (e) => e.industry),
      locations: count(all, (e) => e.location),
    },
    limit,
    page,
    total: sorted.length,
    totalPages,
  };
}