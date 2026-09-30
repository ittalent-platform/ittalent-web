import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  TriangleAlert,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import {
  hasUnsafeSearchText,
  INVALID_SEARCH_MESSAGE,
} from "@/lib/search-validation";
import {
  companyInitials,
  logoPalette,
} from "@/features/public-site/career/career-format";
import { StateCard } from "@/features/public-site/career/state-card";

import {
  getApiV1Enterprises,
  getApiV1JobPostings,
  type EnterpriseListResponse,
} from "@/api/generated";

type Enterprise = {
  id: string;
  name: string;
  logoUrl?: string;
  industry?: string;
  location?: string;
  shortDescription?: string;
  description?: string;
  website?: string;
};

type EnterpriseDirectoryQuery = {
  keyword?: string;
  industry?: string;
  location?: string;
  hiringOnly?: boolean;
  sort?: EnterpriseSort;
  page?: number;
  limit?: number;
};

type EnterpriseSort = "most_jobs" | "name";

const toEnterprise = (item: EnterpriseListResponse["items"][number]): Enterprise => ({
  id: item.id,
  name: item.name,
  logoUrl: item.logoUrl ?? undefined,
  industry: item.industry ?? undefined,
  location: item.location ?? undefined,
  shortDescription: item.shortDescription ?? undefined,
});

async function loadAllEnterprises(): Promise<Enterprise[]> {
  const first = await getApiV1Enterprises({ query: { page: 1, limit: 100, status: "active" } });
  if (first.error || !first.data) throw Object.assign(first.error ?? {}, { status: first.response?.status });
  const pages = await Promise.all(
    Array.from({ length: Math.max(first.data.totalPages - 1, 0) }, (_, index) =>
      getApiV1Enterprises({ query: { page: index + 2, limit: 100, status: "active" } }),
    ),
  );
  return [first.data, ...pages.map((result) => {
    if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
    return result.data;
  })].flatMap((page) => page.items).map(toEnterprise);
}

async function loadOpenJobCounts(): Promise<Record<string, number>> {
  const first = await getApiV1JobPostings({ query: { page: 1, limit: 100, status: "published" } });
  if (first.error || !first.data) throw Object.assign(first.error ?? {}, { status: first.response?.status });
  const pages = await Promise.all(
    Array.from({ length: Math.max(first.data.totalPages - 1, 0) }, (_, index) =>
      getApiV1JobPostings({ query: { page: index + 2, limit: 100, status: "published" } }),
    ),
  );
  const jobs = [first.data, ...pages.map((result) => {
    if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
    return result.data;
  })].flatMap((page) => page.items);
  const counts: Record<string, number> = {};
  const now = Date.now();
  for (const job of jobs) {
    if (job.expiresAt && new Date(job.expiresAt).getTime() < now) continue;
    counts[job.enterpriseId] = (counts[job.enterpriseId] ?? 0) + 1;
  }
  return counts;
}
import { EnterpriseLogo } from "./enterprise-logo";

const PAGE_SIZE = 12;
const KEYWORD_MAX = 100;

const SORT_OPTIONS: { value: EnterpriseSort; label: string }[] = [
  { value: "most_jobs", label: "Most open jobs" },
  { value: "name", label: "Name A–Z" },
];

/** Hero tile slots; real company initials are dropped in when available. */
const HERO_TILES = [
  { pos: "left-0 top-6", l: "NP", bg: "#e4ecfb", fg: "#2a55a8" },
  { pos: "left-[100px] top-0", l: "LL", bg: "#fde8e0", fg: "#b33305" },
  { pos: "left-[200px] top-6", l: "TQ", bg: "#efe9fb", fg: "#6941c6" },
  { pos: "left-[300px] top-0", l: "MC", bg: "#e8f5ee", fg: "#12764a" },
  { pos: "left-[50px] top-[116px]", l: "VA", bg: "#fcf3e3", fg: "#b45309" },
  { pos: "left-[250px] top-[116px]", l: "SH", bg: "#ffffff", fg: "#19191c" },
  { pos: "left-[336px] top-[100px]", l: "KH", bg: "#e4ecfb", fg: "#2a55a8" },
];

const selectClass =
  "w-full border-0 bg-transparent font-[inherit] text-sm text-mkt-ink outline-none";

type ActiveChip = { key: string; label: string; remove: () => void };

function CompanyCard({
  item,
  jobs,
  onOpen,
}: {
  item: Enterprise;
  jobs: number;
  onOpen: () => void;
}) {
  const hiring = jobs > 0;

  return (
    <article
      className="flex min-w-0 cursor-pointer flex-col gap-3.5 rounded-2xl border border-mkt-line bg-white p-[22px] text-mkt-ink transition-colors hover:border-mkt-line-strong"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3.5">
        <EnterpriseLogo
          className="size-[52px] rounded-xl text-[17px]"
          logoUrl={item.logoUrl}
          name={item.name}
          seed={item.id}
        />
        <span className="flex min-w-0 flex-col gap-[3px]">
          <Link
            className="truncate font-['Space_Grotesk',sans-serif] text-[17px] font-semibold text-mkt-ink hover:text-mkt-accent-hover"
            onClick={(e) => e.stopPropagation()}
            title={item.name}
            to={`/enterprises/${item.id}`}
          >
            {item.name}
          </Link>
          {item.industry ? (
            <span className="truncate text-[12.5px] text-mkt-muted">
              {item.industry}
            </span>
          ) : null}
        </span>
      </div>

      <p className="line-clamp-2 min-h-[42px] text-[13.5px] leading-[1.55] text-mkt-ink-2">
        {item.shortDescription ?? "No description provided yet."}
      </p>

      {item.location ? (
        <div className="flex flex-wrap gap-3 text-[12.5px] text-mkt-ink-2">
          <span className="flex items-center gap-[5px]">
            <MapPin aria-hidden="true" className="size-3.5 text-mkt-subtle" />
            {item.location}
          </span>
        </div>
      ) : null}

      <div className="mt-auto flex items-center gap-2 border-t border-mkt-line-soft pt-3.5">
        <span
          className={cn(
            "flex h-6 items-center rounded-full px-2.5 text-xs font-semibold",
            hiring
              ? "bg-mkt-green-bg text-mkt-green-fg"
              : "bg-mkt-chip text-mkt-ink-2",
          )}
        >
          {hiring
            ? `${jobs} open ${jobs === 1 ? "job" : "jobs"}`
            : "No open jobs"}
        </span>
        <div className="flex-1" />
        <span className="text-[13px] font-semibold text-mkt-accent-hover">
          View company →
        </span>
      </div>
    </article>
  );
}

export function EnterprisePage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState<EnterpriseDirectoryQuery>({
    page: 1,
    limit: PAGE_SIZE,
    sort: "most_jobs",
  });
  const [keyword, setKeyword] = useState("");

  const keywordTooLong = keyword.length > KEYWORD_MAX;
  const keywordError = keywordTooLong
    ? "Keep your search under 100 characters."
    : hasUnsafeSearchText(keyword)
      ? INVALID_SEARCH_MESSAGE
      : null;

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["enterprise-directory-page", query],
    queryFn: async () => {
      const [all, roleCounts] = await Promise.all([loadAllEnterprises(), loadOpenJobCounts()]);
      const term = query.keyword?.trim().toLowerCase();
      const limit = query.limit ?? PAGE_SIZE;
      const filtered = all.filter((item) => {
        if (query.industry && item.industry !== query.industry) return false;
        if (query.location && item.location !== query.location) return false;
        if (query.hiringOnly && !(roleCounts[item.id] ?? 0)) return false;
        if (term && !item.name.toLowerCase().includes(term)) return false;
        return true;
      });
      const sorted = [...filtered].sort((a, b) => query.sort === "name"
        ? a.name.localeCompare(b.name)
        : (roleCounts[b.id] ?? 0) - (roleCounts[a.id] ?? 0) || a.name.localeCompare(b.name));
      const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);
      const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);
      const count = (pick: (item: Enterprise) => string | undefined) => {
        const counts = new Map<string, number>();
        for (const item of all) { const value = pick(item); if (value) counts.set(value, (counts.get(value) ?? 0) + 1); }
        return [...counts.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || a.value.localeCompare(b.value));
      };
      return {
        data: sorted.slice((page - 1) * limit, page * limit),
        roleCounts,
        filters: { industries: count((item) => item.industry), locations: count((item) => item.location) },
        limit, page, total: sorted.length, totalPages,
      };
    },
    placeholderData: (previous) => previous,
  });
  const { data: directory } = useQuery({
    queryKey: ["enterprise-directory"],
    queryFn: loadAllEnterprises,
    staleTime: 60_000,
  });

  const heroTiles = useMemo(
    () =>
      HERO_TILES.map((slot, i) => {
        const company = directory?.[i];
        if (!company) return slot;
        const palette = logoPalette(company.id);
        return {
          ...slot,
          l: companyInitials(company.name),
          bg: palette.bg,
          fg: palette.fg,
        };
      }),
    [directory],
  );

  const industries = data?.filters.industries ?? [];
  const cities = data?.filters.locations ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = query.page ?? 1;
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  function patch(next: Partial<EnterpriseDirectoryQuery>) {
    setQuery((q) => ({ ...q, ...next, page: 1 }));
  }

  function applyKeyword() {
    if (keywordError) return;
    patch({ keyword: keyword.trim() || undefined });
  }

  function clearAll() {
    setKeyword("");
    setQuery({ page: 1, limit: PAGE_SIZE, sort: query.sort });
  }

  function goToPage(page: number) {
    setQuery((q) => ({ ...q, page }));
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function getPageNumbers(): (number | "ellipsis")[] {
    if (totalPages <= 6) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = new Set<number>([1, 2, 3, totalPages]);
    if (currentPage > 1 && currentPage < totalPages) pages.add(currentPage);
    const sorted = [...pages].sort((a, b) => a - b);
    const out: (number | "ellipsis")[] = [];
    sorted.forEach((p, idx) => {
      if (idx > 0 && p - sorted[idx - 1] > 1) out.push("ellipsis");
      out.push(p);
    });
    return out;
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  // Typing searches as you go (250 ms debounce); the Search button applies it at once.
  useEffect(() => {
    if (keywordError) return;
    const timer = window.setTimeout(() => {
      setQuery((q) => {
        const next = keyword.trim() || undefined;
        return q.keyword === next ? q : { ...q, keyword: next, page: 1 };
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [keyword, keywordError]);

  const chips: ActiveChip[] = [];
  if (query.keyword)
    chips.push({
      key: "keyword",
      label: `“${query.keyword}”`,
      remove: () => {
        setKeyword("");
        patch({ keyword: undefined });
      },
    });
  if (query.industry)
    chips.push({
      key: "industry",
      label: `Industry: ${query.industry}`,
      remove: () => patch({ industry: undefined }),
    });
  if (query.location)
    chips.push({
      key: "city",
      label: `City: ${query.location}`,
      remove: () => patch({ location: undefined }),
    });

  const hasFilters = chips.length > 0 || Boolean(query.hiringOnly);

  const removeIcon = (
    <svg
      aria-hidden="true"
      fill="none"
      height="14"
      stroke="currentColor"
      strokeLinecap="round"
      strokeWidth="2.2"
      viewBox="0 0 24 24"
      width="14"
    >
      <path d="M18 6L6 18 M6 6l12 12" />
    </svg>
  );

  return (
    <main className="flex flex-col">
      {/* Hero */}
      <section
        className="relative overflow-hidden bg-mkt-ink bg-[radial-gradient(rgba(255,255,255,0.10)_1.2px,transparent_1.2px)] [background-size:26px_26px] px-4 pb-24 pt-[52px] text-white md:px-12"
        id="page-hero"
      >
        <div className="absolute -right-40 -top-[300px] size-[640px] rounded-full bg-mkt-brand" />
        <div className="absolute -right-[60px] -top-[220px] size-[460px] rounded-full border-2 border-white/35" />
        <div className="relative mx-auto flex max-w-[1344px] items-center gap-12">
          <div className="flex flex-1 flex-col gap-3.5">
            <span className="flex h-7 items-center gap-2 self-start rounded-full border border-white/[0.14] bg-white/[0.08] px-3.5 text-[12.5px] font-semibold text-mkt-on-dark-soft">
              <span className="size-[7px] rounded-full bg-mkt-brand" />
              Approved companies only
            </span>
            <h1 className="font-['Space_Grotesk',sans-serif] text-[36px] font-semibold leading-[1.08] md:text-[48px]">
              Find the team
              <br />
              <span className="text-mkt-brand">you want to join.</span>
            </h1>
            <p className="max-w-[520px] text-base leading-[1.6] text-mkt-on-dark">
              Every company hiring on ITTalent. Open a company to see its
              profile and open jobs.
            </p>
          </div>

          <div
            aria-hidden="true"
            className="relative hidden h-[210px] w-[420px] shrink-0 lg:block"
          >
            {heroTiles.map((t) => (
              <span
                className={cn(
                  "absolute flex size-[84px] items-center justify-center rounded-[22px] font-['Space_Grotesk',sans-serif] text-2xl font-bold shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
                  t.pos,
                )}
                key={t.pos}
                style={{ background: t.bg, color: t.fg }}
              >
                {t.l}
              </span>
            ))}
            <span className="absolute left-[150px] top-[116px] box-border flex size-[84px] items-center justify-center rounded-[22px] border-[3px] border-mkt-ink bg-mkt-brand">
              <svg aria-hidden="true" height="40" viewBox="0 0 32 32" width="40">
                <circle cx="16" cy="10" fill="#ffffff" r="3.4" />
                <path
                  d="M7 25c1.6-6.2 4.8-9.4 9-9.4s7.4 3.2 9 9.4"
                  fill="none"
                  stroke="#ffffff"
                  strokeLinecap="round"
                  strokeWidth="2.8"
                />
              </svg>
            </span>
          </div>
        </div>
      </section>

      {/* Search + active filters */}
      <section
        aria-label="Search companies"
        className="relative z-[2] mx-4 -mt-[50px] flex max-w-[1344px] flex-col gap-4 rounded-[20px] border border-mkt-line bg-white p-5 shadow-[0_10px_24px_rgba(25,25,28,0.1)] md:mx-12 min-[1440px]:mx-auto min-[1440px]:w-[calc(100%-96px)]"
      >
        <form
          aria-label="Search companies"
          className="flex flex-col gap-2.5 md:flex-row"
          onSubmit={(e: FormEvent) => {
            e.preventDefault();
            applyKeyword();
          }}
          role="search"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <label
              className={cn(
                "relative flex h-12 items-center gap-2.5 rounded-xl border bg-white px-4 text-mkt-muted",
                keywordError
                  ? "border-mkt-field-error"
                  : "border-mkt-line focus-within:border-2 focus-within:border-mkt-accent focus-within:shadow-[0_0_0_3px_rgba(215,60,3,0.18)]",
              )}
            >
              <Search aria-hidden="true" className="size-[18px] shrink-0" />
              <span className="sr-only">Company name</span>
              <input
                aria-invalid={keywordError ? true : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-mkt-ink outline-none placeholder:text-mkt-muted"
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Search by company name"
                type="text"
                value={keyword}
              />
              {keywordTooLong ? (
                <span className="font-mono text-xs font-semibold text-mkt-danger">
                  {keyword.length} / {KEYWORD_MAX}
                </span>
              ) : null}
            </label>
            {keywordError ? (
              <p className="text-xs text-mkt-danger" role="alert">
                {keywordError}
              </p>
            ) : null}
          </div>

          <label className="flex h-12 items-center rounded-xl border border-mkt-line bg-white px-3 md:w-[190px]">
            <span className="sr-only">Industry</span>
            <select
              className={selectClass}
              onChange={(e) => patch({ industry: e.target.value || undefined })}
              value={query.industry ?? ""}
            >
              <option value="">All industries</option>
              {industries.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </select>
          </label>

          <label className="flex h-12 items-center rounded-xl border border-mkt-line bg-white px-3 md:w-[190px]">
            <span className="sr-only">City</span>
            <select
              className={selectClass}
              onChange={(e) => patch({ location: e.target.value || undefined })}
              value={query.location ?? ""}
            >
              <option value="">All cities</option>
              {cities.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.value}
                </option>
              ))}
            </select>
          </label>

          <button
            className="h-12 rounded-full bg-mkt-accent px-7 text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover"
            type="submit"
          >
            Search
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-3.5">
          <label className="relative flex cursor-pointer items-center gap-2.5 text-[13.5px] font-semibold">
            <input
              checked={query.hiringOnly ?? false}
              className="peer sr-only"
              onChange={(e) =>
                patch({ hiringOnly: e.target.checked || undefined })
              }
              role="switch"
              type="checkbox"
            />
            <span
              aria-hidden="true"
              className={cn(
                "box-border flex h-[22px] w-[38px] items-center rounded-full p-0.5 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-mkt-accent/40",
                query.hiringOnly
                  ? "justify-end bg-mkt-accent"
                  : "justify-start bg-mkt-line-strong",
              )}
            >
              <span className="size-[18px] rounded-full bg-white" />
            </span>
            Hiring now only
          </label>

          {chips.length > 0 ? (
            <>
              <span className="h-[18px] w-px bg-mkt-line" />
              {chips.map((chip) => (
                <button
                  aria-label={`Remove filter ${chip.label}`}
                  className="flex h-[30px] items-center gap-1.5 rounded-full border border-mkt-accent-border bg-mkt-accent-tint pl-3 pr-2 text-[12.5px] font-semibold text-mkt-accent-hover hover:bg-mkt-accent-soft"
                  key={chip.key}
                  onClick={chip.remove}
                  type="button"
                >
                  {chip.label}
                  {removeIcon}
                </button>
              ))}
            </>
          ) : null}

          {hasFilters ? (
            <button
              className="h-[30px] px-2.5 text-[12.5px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
              onClick={clearAll}
              type="button"
            >
              Clear all
            </button>
          ) : null}
        </div>
      </section>

      {/* Results */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-4 px-4 pb-16 pt-8 md:px-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-mkt-ink-2">
            <strong className="text-mkt-ink">
              {isLoading
                ? "—"
                : `${total} ${total === 1 ? "company" : "companies"}`}
            </strong>
            {!isLoading && total > 0 ? ` · showing ${from}–${to}` : ""}
          </span>
          <div className="flex-1" />
          <label className="flex items-center gap-2 text-[13px] text-mkt-muted">
            Sort by
            <select
              className="h-9 rounded-full border border-mkt-line-strong bg-white px-2.5 text-[13px] font-semibold text-mkt-ink outline-none focus:border-mkt-accent"
              onChange={(e) => patch({ sort: e.target.value as EnterpriseSort })}
              value={query.sort ?? "most_jobs"}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                className="h-[236px] animate-pulse rounded-2xl border border-mkt-line bg-mkt-chip"
                key={i}
              />
            ))}
          </div>
        ) : isError ? (
          <StateCard
            description="Something went wrong on our side. Your filters are kept. Please try again."
            icon={
              <TriangleAlert
                aria-hidden="true"
                className="size-[26px] text-mkt-danger"
              />
            }
            iconBg="#fbe9e7"
            title="We couldn't load companies"
          >
            <button
              className="flex h-10 items-center gap-2 rounded-full bg-mkt-accent px-[18px] text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Try again
            </button>
          </StateCard>
        ) : data && data.data.length === 0 ? (
          <StateCard
            description={
              hasFilters
                ? "Try removing a filter or searching for a different name."
                : "No companies are listed yet. Please check back soon."
            }
            icon={
              hasFilters ? (
                <SearchX
                  aria-hidden="true"
                  className="size-[26px] text-mkt-accent-hover"
                />
              ) : (
                <Building2
                  aria-hidden="true"
                  className="size-[26px] text-mkt-accent-hover"
                />
              )
            }
            iconBg="#fde8e0"
            title={
              hasFilters ? "No companies match your filters" : "No companies yet"
            }
          >
            {hasFilters ? (
              <button
                className="h-10 rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
                onClick={clearAll}
                type="button"
              >
                Clear all filters
              </button>
            ) : null}
          </StateCard>
        ) : (
          <div
            className={cn(
              "grid gap-4 transition-opacity md:grid-cols-2 xl:grid-cols-3",
              isFetching && "opacity-60",
            )}
          >
            {data?.data.map((item) => (
              <CompanyCard
                item={item}
                jobs={data.roleCounts[item.id] ?? 0}
                key={item.id}
                onOpen={() => navigate(`/enterprises/${item.id}`)}
              />
            ))}
          </div>
        )}

        {data && totalPages > 1 ? (
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-center gap-1.5 pt-5"
          >
            <button
              aria-label="Previous page"
              className={cn(
                "flex size-9 items-center justify-center rounded-full border border-mkt-line-strong bg-white",
                currentPage === 1
                  ? "cursor-default text-mkt-check"
                  : "text-mkt-ink hover:bg-mkt-chip",
              )}
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>

            {getPageNumbers().map((p, idx) =>
              p === "ellipsis" ? (
                <span
                  className="w-6 text-center text-mkt-subtle"
                  key={`e-${idx}`}
                >
                  …
                </span>
              ) : (
                <button
                  aria-current={p === currentPage ? "page" : undefined}
                  className={cn(
                    "flex size-9 items-center justify-center rounded-full text-[13px] font-semibold",
                    p === currentPage
                      ? "bg-mkt-accent text-white"
                      : "border border-mkt-line-strong bg-white text-mkt-ink hover:bg-mkt-chip",
                  )}
                  key={p}
                  onClick={() => goToPage(p)}
                  type="button"
                >
                  {p}
                </button>
              ),
            )}

            <button
              aria-label="Next page"
              className={cn(
                "flex size-9 items-center justify-center rounded-full border border-mkt-line-strong bg-white",
                currentPage === totalPages
                  ? "cursor-default text-mkt-check"
                  : "text-mkt-ink hover:bg-mkt-chip",
              )}
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </nav>
        ) : null}
      </div>
    </main>
  );
}