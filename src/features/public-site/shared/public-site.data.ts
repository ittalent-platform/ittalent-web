import {
  getApiV1Enterprises,
  getApiV1EnterprisesByEnterpriseId,
  getApiV1JobPostings,
  getApiV1JobPostingsByIdPublic,
  type EnterpriseDetailDto,
  type EnterpriseListResponse,
  type JobPosting,
} from "@/api/generated";
import { unwrap } from "@/api/request-error";

/** A public job as the marketplace pages show it. */
export type PublicJob = {
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
  expires_at?: string;
  createdAt?: string;
};

/** A public company; list items fill the directory fields, the detail adds description, website and offices. */
export type PublicEnterprise = {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
  shortDescription?: string;
  description?: string;
  website?: string;
  companySize?: string;
  offices?: string[];
};

export const toPublicJob = (dto: JobPosting): PublicJob => ({
  _id: dto.id,
  enterpriseId: dto.enterpriseId,
  title: dto.title,
  slug: dto.id,
  location: dto.location,
  employment_type: dto.employmentType,
  salary_min: dto.salaryMin,
  salary_max: dto.salaryMax,
  currency: dto.currency,
  level: dto.level,
  description: dto.description,
  requirements: dto.requirements,
  benefits: dto.benefits,
  openings: dto.openings,
  expires_at: dto.expiresAt,
  createdAt: dto.createdAt,
});

const enterpriseFromListItem = (
  item: EnterpriseListResponse["items"][number],
): PublicEnterprise => ({
  id: item.id,
  name: item.name,
  logoUrl: item.logoUrl ?? undefined,
  industry: item.industry ?? undefined,
  location: item.location ?? undefined,
  shortDescription: item.shortDescription ?? undefined,
  companySize: item.companySize ?? undefined,
});

const enterpriseFromDetail = (dto: EnterpriseDetailDto): PublicEnterprise => ({
  id: dto.id,
  name: dto.name,
  logoUrl: dto.logoUrl ?? undefined,
  industry: dto.industry ?? undefined,
  location:
    [dto.address.city, dto.address.country].filter(Boolean).join(", ") ||
    undefined,
  shortDescription: dto.shortDescription ?? undefined,
  description: dto.description ?? undefined,
  website: dto.website ?? undefined,
  companySize: dto.companySize ?? undefined,
  // Offices other than the headquarters.
  offices: (dto.branches ?? []).map((branch) => branch.city).filter(Boolean),
});

const PAGE_LIMIT = 100;

/** Every page of a paged endpoint, fetched in parallel after the first. */
async function fetchAllPages<T>(
  fetchPage: (
    page: number,
  ) => Promise<{
    data?: { items: T[]; totalPages: number };
    error?: unknown;
    response?: Response;
  }>,
): Promise<T[]> {
  const first = unwrap(await fetchPage(1));
  const rest = await Promise.all(
    Array.from({ length: Math.max(first.totalPages - 1, 0) }, (_, index) =>
      fetchPage(index + 2),
    ),
  );
  return [first, ...rest.map((result) => unwrap(result))].flatMap(
    (page) => page.items,
  );
}

const isOpen = (expiresAt: string | undefined, now: number) =>
  !expiresAt || new Date(expiresAt).getTime() >= now;

export async function loadAllPublicJobs(): Promise<PublicJob[]> {
  return (
    await fetchAllPages((page) =>
      getApiV1JobPostings({ query: { page, limit: PAGE_LIMIT } }),
    )
  ).map(toPublicJob);
}

export async function loadAllEnterprises(): Promise<PublicEnterprise[]> {
  return (
    await fetchAllPages((page) =>
      getApiV1Enterprises({
        query: { page, limit: PAGE_LIMIT, status: "active" },
      }),
    )
  ).map(enterpriseFromListItem);
}

/** Open (not past deadline) jobs per company id. */
export async function loadOpenJobCounts(): Promise<Record<string, number>> {
  const now = Date.now();
  const counts: Record<string, number> = {};
  for (const job of await loadAllPublicJobs()) {
    if (!isOpen(job.expires_at, now) || !job.enterpriseId) continue;
    counts[job.enterpriseId] = (counts[job.enterpriseId] ?? 0) + 1;
  }
  return counts;
}

export async function loadPublicJob(id: string): Promise<PublicJob> {
  return toPublicJob(
    unwrap(await getApiV1JobPostingsByIdPublic({ path: { id } })),
  );
}

export async function loadEnterprise(
  enterpriseId: string,
): Promise<PublicEnterprise> {
  return enterpriseFromDetail(
    unwrap(await getApiV1EnterprisesByEnterpriseId({ path: { enterpriseId } })),
  );
}

/** A company's open jobs (first 100). */
export async function loadEnterpriseOpenJobs(
  enterpriseId: string,
): Promise<PublicJob[]> {
  const page = unwrap(
    await getApiV1JobPostings({
      query: { enterprise_id: enterpriseId, limit: PAGE_LIMIT, page: 1 },
    }),
  );
  const now = Date.now();
  return page.items
    .filter(
      (item) =>
        item.enterpriseId === enterpriseId && isOpen(item.expiresAt, now),
    )
    .map(toPublicJob);
}

/** Query keys: one key per data shape, so pages that share a key share the same data. */
export const publicKeys = {
  enterpriseDirectory: ["public", "enterprise-directory"] as const,
  enterprise: (id?: string) => ["public", "enterprise", id] as const,
  enterpriseJobs: (id?: string) => ["public", "enterprise-jobs", id] as const,
  job: (id?: string) => ["public", "job", id] as const,
};

/** Facet counts ("Hà Nội · 12") over a list, most common first. */
export function countValues<T>(
  items: T[],
  pick: (item: T) => string | undefined,
) {
  const counts = new Map<string, number>();
  for (const item of items) {
    const value = pick(item);
    if (value) counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
}
