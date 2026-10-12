import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Building2,
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Link, useNavigate } from "react-router";
import { MarketSelect } from "@/components/common/market-select";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import {
  hasUnsafeSearchText,
  INVALID_SEARCH_MESSAGE,
} from "@/lib/search-validation";
import { StateCard } from "@/features/public-site/career/state-card";

import {
  companyInitials,
  companyTint,
  LogoTile,
} from "@/components/common/logo-tile";
import {
  countValues,
  loadAllEnterprises,
  loadOpenJobCounts,
  publicKeys,
  type PublicEnterprise as Enterprise,
} from "@/features/public-site/shared/public-site.data";
import { MarketPager } from "@/features/public-site/shared/market-pager";
import {
  PILL_PRIMARY,
  PILL_SECONDARY,
} from "@/features/public-site/shared/market-styles";
import { DirectoryHero, FloatingSearchCard } from "@/features/public-site/shared/directory-hero";

type EnterpriseDirectoryQuery = {
  keyword?: string;
  industry?: string;
  location?: string;
  size?: string;
  hiringOnly?: boolean;
  sort?: EnterpriseSort;
  page?: number;
  limit?: number;
};

type EnterpriseSort = "most_jobs" | "name";

const PAGE_SIZE = 12;
const KEYWORD_MAX = 100;

const SORT_OPTIONS: { value: EnterpriseSort; label: string }[] = [
  { value: "most_jobs", label: "Most open jobs" },
  { value: "name", label: "Name A–Z" },
];

/** Hero tile slots; real company initials are dropped in when available. */
const HERO_TILES = [
  { pos: "left-0 top-6", l: "NP", tone: "bg-mkt-blue-bg text-mkt-blue-fg" },
  {
    pos: "left-[100px] top-0",
    l: "LL",
    tone: "bg-mkt-accent-soft text-mkt-accent-hover",
  },
  {
    pos: "left-[200px] top-6",
    l: "TQ",
    tone: "bg-mkt-violet-bg text-mkt-violet-fg",
  },
  {
    pos: "left-[300px] top-0",
    l: "MC",
    tone: "bg-mkt-green-bg text-mkt-green-fg",
  },
  {
    pos: "left-[50px] top-[116px]",
    l: "VA",
    tone: "bg-mkt-amber-bg text-mkt-amber-fg",
  },
  { pos: "left-[250px] top-[116px]", l: "SH", tone: "bg-white text-mkt-ink" },
  {
    pos: "left-[336px] top-[100px]",
    l: "KH",
    tone: "bg-mkt-blue-bg text-mkt-blue-fg",
  },
];

/** Company size bands the API accepts, smallest first. */
const COMPANY_SIZES = [
  "1-10",
  "11-50",
  "51-200",
  "201-500",
  "501-1000",
  "1000+",
] as const;

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
      className="flex min-w-0 cursor-pointer flex-col gap-3.5 market-card p-[22px] text-mkt-ink transition-colors hover:border-mkt-line-strong"
      onClick={onOpen}
    >
      <div className="flex items-center gap-3.5">
        <LogoTile
          tone="tint"
          className="size-[52px] rounded-xl text-[17px]"
          logoUrl={item.logoUrl}
          name={item.name}
          seed={item.id}
        />
        <span className="flex min-w-0 flex-col gap-[3px]">
          <Link
            className="truncate itt-display text-[17px] font-semibold text-mkt-ink hover:text-mkt-accent-hover"
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

      {item.location || item.companySize ? (
        <div className="flex flex-wrap gap-3 text-[12.5px] text-mkt-ink-2">
          {item.location ? (
            <span className="flex items-center gap-[5px]">
              <MapPin aria-hidden="true" className="size-3.5 text-mkt-subtle" />
              {item.location}
            </span>
          ) : null}
          {item.companySize ? (
            <span className="flex items-center gap-[5px]">
              <Users aria-hidden="true" className="size-3.5 text-mkt-subtle" />
              {item.companySize} people
            </span>
          ) : null}
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
      const [all, roleCounts] = await Promise.all([
        loadAllEnterprises(),
        loadOpenJobCounts(),
      ]);
      const term = query.keyword?.trim().toLowerCase();
      const limit = query.limit ?? PAGE_SIZE;
      const filtered = all.filter((item) => {
        if (query.industry && item.industry !== query.industry) return false;
        if (query.location && item.location !== query.location) return false;
        if (query.size && item.companySize !== query.size) return false;
        if (query.hiringOnly && !(roleCounts[item.id] ?? 0)) return false;
        if (term && !item.name.toLowerCase().includes(term)) return false;
        return true;
      });
      const sorted = [...filtered].sort((a, b) =>
        query.sort === "name"
          ? a.name.localeCompare(b.name)
          : (roleCounts[b.id] ?? 0) - (roleCounts[a.id] ?? 0) ||
            a.name.localeCompare(b.name),
      );
      const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);
      const page = Math.min(Math.max(query.page ?? 1, 1), totalPages);
      return {
        data: sorted.slice((page - 1) * limit, page * limit),
        roleCounts,
        filters: {
          industries: countValues(all, (item) => item.industry),
          locations: countValues(all, (item) => item.location),
        },
        limit,
        page,
        total: sorted.length,
        totalPages,
      };
    },
    placeholderData: (previous) => previous,
  });
  const { data: directory } = useQuery({
    queryKey: publicKeys.enterpriseDirectory,
    queryFn: loadAllEnterprises,
    staleTime: 60_000,
  });

  const heroTiles = useMemo(
    () =>
      HERO_TILES.map((slot, i) => {
        const company = directory?.[i];
        if (!company) return slot;
        return {
          ...slot,
          l: companyInitials(company.name),
          tone: companyTint(company.id),
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

  if (query.size)
    chips.push({
      key: "size",
      label: `Size: ${query.size} people`,
      remove: () => patch({ size: undefined }),
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
      <DirectoryHero
        accent="you want to join."
        art={
          <>
            {heroTiles.map((t) => (
              <span
                className={cn(
                  "itt-display absolute flex size-[84px] items-center justify-center rounded-[22px] text-2xl font-bold shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
                  t.pos,
                  t.tone,
                )}
                key={t.pos}
              >
                {t.l}
              </span>
            ))}
            <span className="absolute left-[150px] top-[116px] box-border flex size-[84px] items-center justify-center rounded-[22px] border-[3px] border-mkt-ink bg-mkt-brand">
              <svg
                aria-hidden="true"
                height="40"
                viewBox="0 0 32 32"
                width="40"
              >
                <circle cx="16" cy="10" className="fill-white" r="3.4" />
                <path
                  d="M7 25c1.6-6.2 4.8-9.4 9-9.4s7.4 3.2 9 9.4"
                  fill="none"
                  className="stroke-white"
                  strokeLinecap="round"
                  strokeWidth="2.8"
                />
              </svg>
            </span>
          </>
        }
        badge="Approved companies only"
        description="Every company hiring on ITTalent. Open a company to see its profile and open jobs."
        title="Find the team"
      />

      {/* Search + active filters */}
      <FloatingSearchCard label="Search companies">
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

          <MarketSelect
            allLabel="All industries"
            ariaLabel="Industry"
            className="md:w-[190px]"
            onChange={(value) => patch({ industry: value || undefined })}
            options={industries.map((o) => ({
              label: o.value,
              value: o.value,
            }))}
            value={query.industry ?? ""}
          />

          <MarketSelect
            allLabel="All cities"
            ariaLabel="City"
            className="md:w-[190px]"
            onChange={(value) => patch({ location: value || undefined })}
            options={cities.map((o) => ({ label: o.value, value: o.value }))}
            value={query.location ?? ""}
          />

          <MarketSelect
            allLabel="Any size"
            ariaLabel="Company size"
            className="md:w-[160px]"
            onChange={(value) => patch({ size: value || undefined })}
            options={COMPANY_SIZES.map((size) => ({
              label: `${size} people`,
              value: size,
            }))}
            value={query.size ?? ""}
          />

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
      </FloatingSearchCard>

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
          <div className="flex items-center gap-2 text-[13px] text-mkt-muted">
            Sort by
            <MarketSelect
              ariaLabel="Sort by"
              onChange={(value) => patch({ sort: value as EnterpriseSort })}
              options={SORT_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
              value={query.sort ?? "most_jobs"}
              variant="pill"
            />
          </div>
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
            iconClassName="bg-mkt-danger-bg"
            title="We couldn't load companies"
          >
            <button
              className={PILL_PRIMARY}
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
            iconClassName="bg-mkt-accent-soft"
            title={
              hasFilters
                ? "No companies match your filters"
                : "No companies yet"
            }
          >
            {hasFilters ? (
              <button
                className={PILL_SECONDARY}
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
          <MarketPager
            className="pt-5"
            onPageChange={goToPage}
            page={currentPage}
            totalPages={totalPages}
          />
        ) : null}
      </div>
    </main>
  );
}
