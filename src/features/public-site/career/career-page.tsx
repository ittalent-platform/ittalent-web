import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  MapPin,
  RefreshCw,
  Search,
  SearchX,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import {
  hasUnsafeSearchText,
  INVALID_SEARCH_MESSAGE,
} from "@/lib/search-validation";
import {
  countValues,
  loadAllEnterprises,
  loadAllPublicJobs,
  publicKeys,
  type PublicJob as Job,
} from "@/features/public-site/shared/public-site.data";

type JobSort = "newest" | "oldest" | "salary_high" | "salary_low";
type PostedWithin = "24h" | "7d" | "30d";
type JobListQuery = {
  employment_type?: string[];
  level?: string[];
  limit?: number;
  location?: string;
  enterpriseId?: string;
  salaryMin?: number;
  salaryMax?: number;
  includeNegotiable?: boolean;
  postedWithin?: PostedWithin;
  page?: number;
  search?: string;
  sort?: JobSort;
};

import { MarketSelect } from "@/components/common/market-select";
import { StateCard } from "./state-card";
import {
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  isNewPosting,
  LEVEL_LABELS,
  postedAgo,
} from "./career-format";
import { LogoTile } from "@/components/common/logo-tile";
import { MarketPager } from "@/features/public-site/shared/market-pager";
import {
  PILL_PRIMARY,
  PILL_SECONDARY,
} from "@/features/public-site/shared/market-styles";
import { DirectoryHero, FloatingSearchCard } from "@/features/public-site/shared/directory-hero";

const PAGE_SIZE = 12;
const KEYWORD_MAX = 100;

const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "salary_high", label: "Salary: High to low" },
  { value: "salary_low", label: "Salary: Low to high" },
];

const POSTED_OPTIONS: { value: PostedWithin | ""; label: string }[] = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

const POSTED_WITHIN_MS: Record<PostedWithin, number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
};

const TYPE_OPTIONS = ["full-time", "part-time", "contractor", "intern"];
const LEVEL_OPTIONS = ["intern", "junior", "mid", "senior", "lead"];

const HERO_CHIPS = [
  {
    className: "left-[10px] top-[20px]",
    label: "React",
    tone: "bg-mkt-blue-bg text-mkt-blue-fg",
  },
  {
    className: "left-[140px] top-0",
    label: "Java",
    tone: "bg-mkt-accent-soft text-mkt-accent-hover",
  },
  {
    className: "left-[250px] top-[34px]",
    label: "DevOps",
    tone: "bg-mkt-violet-bg text-mkt-violet-fg",
  },
  {
    className: "left-[60px] top-[88px]",
    label: "QA Automation",
    tone: "bg-mkt-amber-bg text-mkt-amber-fg",
  },
  {
    className: "left-[250px] top-[110px]",
    label: "Data Engineer",
    tone: "bg-mkt-green-bg text-mkt-green-fg",
  },
  {
    className: "left-[20px] top-[156px]",
    label: "Flutter",
    tone: "bg-white text-mkt-ink",
  },
  {
    className: "left-[150px] top-[168px]",
    label: "Go",
    tone: "bg-mkt-blue-bg text-mkt-blue-fg",
  },
];

const legendClass =
  "pb-2.5 text-[11.5px] font-bold tracking-[0.05em] text-mkt-label";

type ActiveChip = { key: string; label: string; remove: () => void };

function toggle(list: string[] | undefined, value: string) {
  const current = list ?? [];
  const next = current.includes(value)
    ? current.filter((v) => v !== value)
    : [...current, value];
  return next.length ? next : undefined;
}

function parseAmount(value: string) {
  if (value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
}

function CheckRow({
  checked,
  label,
  onChange,
}: {
  checked: boolean;
  label: string;
  onChange: () => void;
}) {
  return (
    <label className="relative flex cursor-pointer items-center gap-2.5 text-[13.5px] text-mkt-ink">
      <input
        checked={checked}
        className="peer sr-only"
        onChange={onChange}
        type="checkbox"
      />
      <span
        aria-hidden="true"
        className={cn(
          "box-border flex size-[18px] items-center justify-center rounded-[5px] peer-focus-visible:ring-2 peer-focus-visible:ring-mkt-accent/40",
          checked
            ? "border-0 bg-mkt-accent"
            : "border-[1.5px] border-mkt-check bg-white",
        )}
      >
        {checked ? (
          <svg
            aria-hidden="true"
            fill="none"
            height="12"
            className="stroke-white"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3.4"
            viewBox="0 0 24 24"
            width="12"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        ) : null}
      </span>
      <span className="flex-1">{label}</span>
    </label>
  );
}

function JobCard({
  job,
  companyName,
  onOpen,
}: {
  job: Job;
  companyName?: string;
  onOpen: () => void;
}) {
  const type = job.employment_type
    ? (EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type)
    : null;
  const level = job.level
    ? (LEVEL_LABELS[job.level.toLowerCase()] ?? job.level)
    : null;
  const posted = postedAgo(job.createdAt);
  const deadline = formatDeadline(job.expires_at);

  return (
    <article
      className="flex min-w-0 cursor-pointer flex-col gap-4 market-card px-[22px] py-5 transition-colors hover:border-mkt-line-strong sm:flex-row sm:gap-[18px]"
      onClick={onOpen}
    >
      <LogoTile
        className="size-[52px] rounded-xl text-base"
        name={companyName ?? "?"}
        seed={job.enterpriseId ?? companyName}
        tone="tint"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex min-w-0 items-baseline gap-3">
          <Link
            className="min-w-0 truncate itt-display text-[18px] font-semibold text-mkt-ink hover:text-mkt-accent-hover"
            onClick={(e) => e.stopPropagation()}
            title={job.title}
            to={`/career/${job.slug}`}
          >
            {job.title}
          </Link>
          {isNewPosting(job.createdAt) ? (
            <span className="flex h-5 shrink-0 items-center rounded-full bg-mkt-blue-bg px-2 text-[11px] font-bold text-mkt-blue-fg">
              New
            </span>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-wrap items-center gap-2 text-[13px] text-mkt-ink-2">
          {companyName && job.enterpriseId ? (
            <>
              <Link
                className="font-semibold text-mkt-ink hover:text-mkt-accent-hover"
                onClick={(e) => e.stopPropagation()}
                to={`/enterprises/${job.enterpriseId}`}
              >
                {companyName}
              </Link>
              {job.location ? <span className="text-mkt-subtle">·</span> : null}
            </>
          ) : null}
          {job.location ? <span>{job.location}</span> : null}
        </div>

        {type || level ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {type ? (
              <span className="flex h-6 items-center rounded-full bg-mkt-chip px-2.5 text-xs font-semibold text-mkt-ink-2">
                {type}
              </span>
            ) : null}
            {level ? (
              <span className="flex h-6 items-center rounded-full bg-mkt-chip px-2.5 text-xs font-semibold text-mkt-ink-2">
                {level}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col items-start gap-1.5 text-left sm:w-[200px] sm:items-end sm:text-right">
        <span className="text-[15px] font-semibold text-mkt-ink">
          {formatSalaryCard(job.salary_min, job.salary_max, job.currency)}
        </span>
        {posted ? (
          <span className="text-xs text-mkt-subtle">Posted {posted}</span>
        ) : null}
        {deadline ? (
          <span className="text-xs text-mkt-ink-2">
            Apply by <strong>{deadline}</strong>
          </span>
        ) : null}
        <div className="flex-1" />
        <Link
          className="text-[13px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
          onClick={(e) => e.stopPropagation()}
          to={`/career/${job.slug}`}
        >
          View job →
        </Link>
      </div>
    </article>
  );
}

export function CareerPage() {
  const navigate = useNavigate();
  // The home page search sends people here as /career?search=…&location=…
  const [searchParams] = useSearchParams();
  const [initialSearch] = useState(() => {
    const value = (searchParams.get("search") ?? "")
      .trim()
      .slice(0, KEYWORD_MAX);
    return hasUnsafeSearchText(value) ? "" : value;
  });
  const [initialCity] = useState(() => searchParams.get("location") ?? "");

  const [query, setQuery] = useState<JobListQuery>({
    page: 1,
    limit: PAGE_SIZE,
    sort: "newest",
    search: initialSearch || undefined,
    location: initialCity || undefined,
    // Deep link from a company page: /career?company=<enterpriseId>
    enterpriseId: searchParams.get("company") || undefined,
  });
  const [keyword, setKeyword] = useState(initialSearch);
  const [salaryMinText, setSalaryMinText] = useState("");
  const [salaryMaxText, setSalaryMaxText] = useState("");

  const keywordTooLong = keyword.length > KEYWORD_MAX;
  const keywordUnsafe = hasUnsafeSearchText(keyword);
  const keywordError = keywordTooLong
    ? "Keep your search under 100 characters."
    : keywordUnsafe
      ? INVALID_SEARCH_MESSAGE
      : null;

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["jobs", query],
    queryFn: async () => {
      const now = Date.now();
      const all = (await loadAllPublicJobs()).filter(
        (job) => !job.expires_at || new Date(job.expires_at).getTime() >= now,
      );
      const page = query.page ?? 1;
      const limit = query.limit ?? PAGE_SIZE;
      const term = query.search?.trim().toLowerCase();
      const postedSince = query.postedWithin
        ? Date.now() - POSTED_WITHIN_MS[query.postedWithin]
        : undefined;
      const filtered = all.filter((job) => {
        if (
          query.employment_type?.length &&
          !query.employment_type.includes(job.employment_type ?? "")
        )
          return false;
        if (
          query.level?.length &&
          !query.level.some(
            (level) => level.toLowerCase() === (job.level ?? "").toLowerCase(),
          )
        )
          return false;
        if (query.location && job.location !== query.location) return false;
        if (query.enterpriseId && job.enterpriseId !== query.enterpriseId)
          return false;
        if (
          postedSince !== undefined &&
          new Date(job.createdAt ?? 0).getTime() < postedSince
        )
          return false;
        const low =
          job.salary_min && job.salary_min > 0 ? job.salary_min : undefined;
        const high =
          job.salary_max && job.salary_max > 0 ? job.salary_max : undefined;
        if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
          if (!low && !high) return query.includeNegotiable ?? true;
          if (job.currency && job.currency !== "VND") return true;
          const top = high ?? low!;
          const bottom = low ?? high!;
          if (
            query.salaryMin !== undefined &&
            top < query.salaryMin * 1_000_000
          )
            return false;
          if (
            query.salaryMax !== undefined &&
            bottom > query.salaryMax * 1_000_000
          )
            return false;
        }
        if (term) {
          const haystack = [
            job.title,
            job.location,
            job.level,
            job.employment_type,
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(term)) return false;
        }
        return true;
      });
      const time = (job: Job) => new Date(job.createdAt ?? 0).getTime();
      const topSalary = (job: Job) =>
        Math.max(job.salary_max ?? 0, job.salary_min ?? 0);
      const sorted = [...filtered].sort((a, b) => {
        switch (query.sort ?? "newest") {
          case "oldest":
            return time(a) - time(b);
          case "salary_high":
            return topSalary(b) - topSalary(a) || time(b) - time(a);
          case "salary_low":
            return (
              (topSalary(a) || Number.POSITIVE_INFINITY) -
                (topSalary(b) || Number.POSITIVE_INFINITY) || time(b) - time(a)
            );
          default:
            return time(b) - time(a);
        }
      });
      const totalPages = Math.max(Math.ceil(sorted.length / limit), 1);
      return {
        data: sorted.slice((page - 1) * limit, page * limit),
        filters: {
          employmentTypes: countValues(all, (job) => job.employment_type),
          locations: countValues(all, (job) => job.location),
          enterprises: countValues(all, (job) => job.enterpriseId),
        },
        limit,
        page,
        total: sorted.length,
        totalPages,
      };
    },
    placeholderData: (previous) => previous,
  });
  const { data: enterprises } = useQuery({
    queryKey: publicKeys.enterpriseDirectory,
    queryFn: loadAllEnterprises,
    staleTime: 60_000,
  });

  const companyNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of enterprises ?? []) map.set(e.id, e.name);
    return map;
  }, [enterprises]);

  const cities = data?.filters.locations ?? [];
  const companyOptions = (data?.filters.enterprises ?? [])
    .map((o) => ({ id: o.value, name: companyNames.get(o.value) }))
    .filter((o): o is { id: string; name: string } => Boolean(o.name))
    .sort((a, b) => a.name.localeCompare(b.name));

  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const currentPage = query.page ?? 1;
  const from = total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const to = Math.min(currentPage * PAGE_SIZE, total);

  function applyDraft() {
    if (keywordError) return;
    setQuery((q) => ({
      ...q,
      search: keyword.trim() || undefined,
      salaryMin: parseAmount(salaryMinText),
      salaryMax: parseAmount(salaryMaxText),
      page: 1,
    }));
  }

  function clearAll() {
    setKeyword("");
    setSalaryMinText("");
    setSalaryMaxText("");
    setQuery({ page: 1, limit: PAGE_SIZE, sort: query.sort });
  }

  function patch(next: Partial<JobListQuery>) {
    setQuery((q) => ({ ...q, ...next, page: 1 }));
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
        const search = keyword.trim() || undefined;
        const salaryMin = parseAmount(salaryMinText);
        const salaryMax = parseAmount(salaryMaxText);
        if (
          q.search === search &&
          q.salaryMin === salaryMin &&
          q.salaryMax === salaryMax
        )
          return q;
        return { ...q, search, salaryMin, salaryMax, page: 1 };
      });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [keyword, salaryMinText, salaryMaxText, keywordError]);

  const chips: ActiveChip[] = [];
  if (query.search)
    chips.push({
      key: "search",
      label: `“${query.search}”`,
      remove: () => {
        setKeyword("");
        patch({ search: undefined });
      },
    });
  if (query.location)
    chips.push({
      key: "city",
      label: query.location,
      remove: () => patch({ location: undefined }),
    });
  for (const t of query.employment_type ?? [])
    chips.push({
      key: `type-${t}`,
      label: EMPLOYMENT_LABELS[t] ?? t,
      remove: () =>
        patch({ employment_type: toggle(query.employment_type, t) }),
    });
  for (const l of query.level ?? [])
    chips.push({
      key: `level-${l}`,
      label: LEVEL_LABELS[l] ?? l,
      remove: () => patch({ level: toggle(query.level, l) }),
    });
  if (query.enterpriseId)
    chips.push({
      key: "company",
      label: companyNames.get(query.enterpriseId) ?? "Company",
      remove: () => patch({ enterpriseId: undefined }),
    });
  if (query.postedWithin)
    chips.push({
      key: "posted",
      label:
        POSTED_OPTIONS.find((o) => o.value === query.postedWithin)?.label ??
        "Recently posted",
      remove: () => patch({ postedWithin: undefined }),
    });
  if (query.salaryMin !== undefined || query.salaryMax !== undefined) {
    const label =
      query.salaryMin !== undefined && query.salaryMax !== undefined
        ? `Salary ${query.salaryMin}–${query.salaryMax}M`
        : query.salaryMin !== undefined
          ? `Salary from ${query.salaryMin}M`
          : `Salary up to ${query.salaryMax}M`;
    chips.push({
      key: "salary",
      label,
      remove: () => {
        setSalaryMinText("");
        setSalaryMaxText("");
        patch({ salaryMin: undefined, salaryMax: undefined });
      },
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    applyDraft();
  }

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
        accent="from every company."
        art={
          <>
            {HERO_CHIPS.map((chip) => (
              <span
                className={cn(
                  "absolute flex h-9 items-center rounded-full px-4 text-sm font-semibold shadow-[0_10px_24px_rgba(0,0,0,0.3)]",
                  chip.className,
                  chip.tone,
                )}
                key={chip.label}
              >
                {chip.label}
              </span>
            ))}
          </>
        }
        badge="Jobs past their deadline are never shown"
        description="Search by title, skill or company, then narrow by city, level and salary."
        title="Open IT roles,"
      />

      {/* Search + active filters */}
      <FloatingSearchCard label="Search and filters">
        <form
          aria-label="Search jobs"
          className="flex flex-col gap-2.5 md:flex-row"
          onSubmit={onSubmit}
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
              <span className="sr-only">Keyword</span>
              <input
                aria-invalid={keywordError ? true : undefined}
                className="min-w-0 flex-1 border-0 bg-transparent text-[14.5px] text-mkt-ink outline-none placeholder:text-mkt-muted"
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Job title, skill or company"
                type="text"
                value={keyword}
              />
              <span
                className={cn(
                  "text-xs",
                  keywordTooLong
                    ? "font-mono font-semibold text-mkt-danger"
                    : "text-mkt-subtle",
                )}
              >
                {keyword.length} / {KEYWORD_MAX}
              </span>
            </label>
            {keywordError ? (
              <p className="text-xs text-mkt-danger" role="alert">
                {keywordError}
              </p>
            ) : null}
          </div>

          <MarketSelect
            allLabel="All cities"
            ariaLabel="City"
            className="md:w-60"
            icon={<MapPin aria-hidden="true" className="size-[18px]" />}
            onChange={(value) => patch({ location: value || undefined })}
            options={cities.map((c) => ({ label: c.value, value: c.value }))}
            value={query.location ?? ""}
          />

          <button
            className="h-12 rounded-full bg-mkt-accent px-7 text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover"
            type="submit"
          >
            Search
          </button>
        </form>

        {chips.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[12.5px] text-mkt-muted">
              Active filters
            </span>
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
            <button
              className="h-[30px] px-2.5 text-[12.5px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
              onClick={clearAll}
              type="button"
            >
              Clear all
            </button>
          </div>
        ) : null}
      </FloatingSearchCard>

      {/* Filters + results */}
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-stretch gap-6 px-4 pb-16 pt-8 md:px-12 lg:flex-row lg:items-start">
        <aside
          aria-label="Filters"
          className="box-border flex w-full shrink-0 flex-col gap-[22px] market-card p-[22px] lg:w-[296px]"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal
              aria-hidden="true"
              className="size-4 text-mkt-ink-2"
            />
            <span className="flex-1 text-[15px] font-semibold">Filters</span>
            <button
              className="text-[12.5px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
              onClick={clearAll}
              type="button"
            >
              Reset
            </button>
          </div>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 border-b border-mkt-line-soft p-0 pb-[18px]">
            <legend className={legendClass}>JOB TYPE</legend>
            {TYPE_OPTIONS.map((value) => (
              <CheckRow
                checked={query.employment_type?.includes(value) ?? false}
                key={value}
                label={EMPLOYMENT_LABELS[value] ?? value}
                onChange={() =>
                  patch({
                    employment_type: toggle(query.employment_type, value),
                  })
                }
              />
            ))}
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 border-b border-mkt-line-soft p-0 pb-[18px]">
            <legend className={legendClass}>LEVEL</legend>
            {LEVEL_OPTIONS.map((value) => (
              <CheckRow
                checked={query.level?.includes(value) ?? false}
                key={value}
                label={LEVEL_LABELS[value] ?? value}
                onChange={() => patch({ level: toggle(query.level, value) })}
              />
            ))}
          </fieldset>

          <fieldset className="m-0 flex flex-col gap-2.5 border-0 border-b border-mkt-line-soft p-0 pb-[18px]">
            <legend className={legendClass}>
              SALARY (MILLION VND / MONTH)
            </legend>
            <div className="flex items-center gap-2">
              <label className="flex flex-1 flex-col gap-1 text-xs text-mkt-muted">
                Min
                <input
                  className="box-border h-10 w-full rounded-xl border border-mkt-line px-3 text-[13.5px] text-mkt-ink outline-none focus:border-mkt-accent"
                  min={0}
                  onChange={(e) => setSalaryMinText(e.target.value)}
                  type="number"
                  value={salaryMinText}
                />
              </label>
              <span className="pt-[18px] text-mkt-subtle">–</span>
              <label className="flex flex-1 flex-col gap-1 text-xs text-mkt-muted">
                Max
                <input
                  className="box-border h-10 w-full rounded-xl border border-mkt-line px-3 text-[13.5px] text-mkt-ink outline-none placeholder:text-mkt-muted focus:border-mkt-accent"
                  min={0}
                  onChange={(e) => setSalaryMaxText(e.target.value)}
                  placeholder="Any"
                  type="number"
                  value={salaryMaxText}
                />
              </label>
            </div>
            <CheckRow
              checked={query.includeNegotiable ?? true}
              label="Include “Negotiable”"
              onChange={() =>
                patch({ includeNegotiable: !(query.includeNegotiable ?? true) })
              }
            />
          </fieldset>

          <div className="flex flex-col gap-2">
            <span className={legendClass.replace("pb-2.5", "")}>COMPANY</span>
            <MarketSelect
              allLabel="Any company"
              ariaLabel="Company"
              onChange={(value) => patch({ enterpriseId: value || undefined })}
              options={companyOptions.map((c) => ({
                label: c.name,
                value: c.id,
              }))}
              value={query.enterpriseId ?? ""}
              variant="compact"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className={legendClass.replace("pb-2.5", "")}>
              POSTED WITHIN
            </span>
            <MarketSelect
              ariaLabel="Posted within"
              onChange={(value) =>
                patch({
                  postedWithin: (value || undefined) as
                    PostedWithin | undefined,
                })
              }
              options={POSTED_OPTIONS.map((o) => ({
                label: o.label,
                value: o.value,
              }))}
              value={query.postedWithin ?? ""}
              variant="compact"
            />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-3 pb-1">
            <span className="text-sm text-mkt-ink-2">
              <strong className="text-mkt-ink">
                {isLoading ? "—" : `${total} ${total === 1 ? "job" : "jobs"}`}
              </strong>{" "}
              match{total === 1 ? "es" : ""}
              {!isLoading && total > 0 ? ` · showing ${from}–${to}` : ""}
            </span>
            <div className="flex-1" />
            <div className="flex items-center gap-2 text-[13px] text-mkt-muted">
              Sort by
              <MarketSelect
                ariaLabel="Sort by"
                onChange={(value) => patch({ sort: value as JobSort })}
                options={SORT_OPTIONS.map((o) => ({
                  label: o.label,
                  value: o.value,
                }))}
                value={query.sort ?? "newest"}
                variant="pill"
              />
            </div>
          </div>

          {isLoading ? (
            Array.from({ length: 4 }, (_, i) => (
              <div
                className="h-[124px] animate-pulse rounded-2xl border border-mkt-line bg-mkt-chip"
                key={i}
              />
            ))
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
              title="We couldn't load jobs"
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
                chips.length > 0
                  ? "Try removing a filter."
                  : "There are no open jobs right now. Please check back soon."
              }
              icon={
                <SearchX
                  aria-hidden="true"
                  className="size-[26px] text-mkt-accent-hover"
                />
              }
              iconClassName="bg-mkt-accent-soft"
              title="No jobs match your filters"
            >
              {chips.length > 0 ? (
                <>
                  <div className="flex flex-wrap justify-center gap-1.5">
                    {chips.map((chip) => (
                      <button
                        aria-label={`Remove filter ${chip.label}`}
                        className="flex h-7 items-center rounded-full border border-mkt-accent-border bg-mkt-accent-tint px-3 text-[12.5px] font-semibold text-mkt-accent-hover hover:bg-mkt-accent-soft"
                        key={chip.key}
                        onClick={chip.remove}
                        type="button"
                      >
                        {chip.label} ✕
                      </button>
                    ))}
                  </div>
                  <button
                    className={PILL_SECONDARY}
                    onClick={clearAll}
                    type="button"
                  >
                    Clear all filters
                  </button>
                </>
              ) : null}
            </StateCard>
          ) : (
            <div
              className={cn(
                "flex min-w-0 flex-col gap-3 transition-opacity",
                isFetching && "opacity-60",
              )}
            >
              {data?.data.map((job) => (
                <JobCard
                  companyName={
                    job.enterpriseId
                      ? companyNames.get(job.enterpriseId)
                      : undefined
                  }
                  job={job}
                  key={job._id}
                  onOpen={() => navigate(`/career/${job.slug}`)}
                />
              ))}
            </div>
          )}

          {data && totalPages > 1 ? (
            <MarketPager
              className="pt-4"
              onPageChange={goToPage}
              page={currentPage}
              totalPages={totalPages}
            />
          ) : null}
        </div>
      </div>
    </main>
  );
}
