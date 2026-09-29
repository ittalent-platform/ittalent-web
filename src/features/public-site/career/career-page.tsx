import { useEffect, useState } from "react";
import {
  ArrowRight,
  Banknote,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  TriangleAlert,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { cn } from "@/lib/utils";
import { Placeholder } from "@/components/common/placeholder";
import { ErrorState } from "@/components/common/error-state";

import { perks, team } from "@/features/public-site/content";

import {
  fetchJobs,
  type JobListQuery,
  type JobListResponse,
  type JobSort,
} from "./career.api";
import { Stat } from "./career-detail-blocks";
import { EMPLOYMENT_LABELS, formatSalary, timeAgo } from "./career-format";

const SORT_OPTIONS: { value: JobSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "salary_high", label: "Salary: High to low" },
  { value: "salary_low", label: "Salary: Low to high" },
];

export function CareerPage() {
  const navigate = useNavigate();

  const [query, setQuery] = useState<JobListQuery>({
    page: 1,
    limit: 5,
    sort: "newest",
  });
  const [search, setSearch] = useState("");
  const [sortOpen, setSortOpen] = useState(false);

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["jobs", query],
    queryFn: () => fetchJobs(query),
  });

  const jobs: JobListResponse | undefined = data;
  const employmentTypeOptions = jobs?.filters.employmentTypes ?? [];
  const locationOptions = jobs?.filters.locations ?? [];
  const totalPages = jobs?.totalPages ?? 1;
  const currentPage = query.page ?? 1;
  const hasActiveFilters = Boolean(
    query.employment_type || query.location || query.level || query.search,
  );

  function handleSort(value: JobSort) {
    setQuery((q) => ({ ...q, sort: value, page: 1 }));
    setSortOpen(false);
  }

  function toggleWorkType(
    apiValue: NonNullable<JobListQuery["employment_type"]>,
  ) {
    setQuery((q) => ({
      ...q,
      employment_type: q.employment_type === apiValue ? undefined : apiValue,
      page: 1,
    }));
  }

  function handleClearFilters() {
    setSearch("");
    setQuery({ page: 1, limit: query.limit });
  }

  function goToPage(page: number) {
    setQuery((q) => ({ ...q, page }));
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

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery((q) => ({ ...q, search: search.trim() || undefined, page: 1 }));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <main>
      <section
        id="page-hero"
        className="relative overflow-hidden bg-[var(--hero-bg)] px-8 pb-[88px] pt-[72px] text-[var(--hero-fg)]"
      >
        <div className="pointer-events-none absolute inset-y-0 left-0 w-[44%] bg-[radial-gradient(circle_at_0%_10%,rgba(242,71,12,.16),transparent_56%)]" />
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[rgba(242,71,12,.45)] bg-[rgba(242,71,12,.12)] px-[15px] py-[6px]">
            <span className="h-2 w-2 animate-[itt-pulse_2s_infinite] rounded-full bg-primary" />
            <span className="itt-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--primary-300)]">
              We're hiring
            </span>
          </div>
          <h1 className="max-w-[760px] text-[58px] font-bold uppercase leading-[1.02] tracking-[-0.03em] md:text-[62px]">
            Build software that{" "}
            <span className="italic text-[var(--primary)]">ships</span>
            <br />
            <span className="italic text-[var(--primary)]">on time</span>
          </h1>
          <p className="mt-5 max-w-[540px] text-[18px] leading-[1.6] text-[#B4B5BB]">
            Join specialized engineering squads in Web, Mobile, Cloud, and QA.
            Transparent pay bands, real ownership, and a remote-first culture
            across APAC.
          </p>
          <div className="mt-10 flex flex-wrap gap-10 md:gap-12">
            <Stat
              value={isLoading ? "—" : String(jobs?.total ?? 0)}
              label="Open roles"
              highlight
            />
            <Stat value="120+" label="Engineers" />
            <Stat value="14d" label="Avg. onboarding" />
            <Stat value="4.8" label="Glassdoor" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 py-[50px]">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-8">
          <div>
            <div className="itt-mono mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
              <span className="inline-block h-[2px] w-[18px] bg-[var(--primary)]" />{" "}
              Benefits &amp; perks
            </div>
            <h2 className="max-w-[340px] text-[44px] font-bold leading-[1.02] tracking-[-0.03em]">
              Why you&rsquo;ll love it here
            </h2>
          </div>
          <p className="max-w-[300px] pt-8 text-[15px] leading-[1.65] text-[var(--fg-muted)]">
            Real ownership, transparent pay, and a culture that actually ships.
            Here&rsquo;s what you get from day one.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 xl:grid-rows-[236px_236px_236px]">
          {perks.map((item) => {
            const Icon = item.icon;
            const filled = item.variant !== "plain";

            return (
              <div
                key={item.n}
                className={cn(
                  "flex flex-col rounded-[18px] border px-7 py-7 transition-transform duration-200 hover:-translate-y-1",
                  item.variant === "orange"
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[0_10px_30px_rgba(242,71,12,.18)] md:col-span-2 md:min-h-[360px] xl:col-span-2 xl:row-span-2 xl:min-h-0"
                    : item.variant === "dark"
                      ? "border-[#161619] bg-[#161619] text-white md:min-h-[220px] xl:min-h-0"
                      : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] md:min-h-[220px] xl:min-h-0",
                  item.n === "02" && "xl:col-start-3 xl:row-start-1",
                  item.n === "03" && "xl:col-start-3 xl:row-start-2",
                  item.n === "04" && "xl:col-start-1 xl:row-start-3",
                  item.n === "05" && "xl:col-start-2 xl:row-start-3",
                  item.n === "06" && "xl:col-start-3 xl:row-start-3",
                )}
              >
                <div className="flex items-start justify-between">
                  <div
                    className={cn(
                      "flex h-[52px] w-[52px] items-center justify-center rounded-[14px]",
                      filled ? "bg-white/15" : "bg-[var(--primary-50)]",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-5",
                        filled ? "text-white" : "text-[var(--primary)]",
                      )}
                    />
                  </div>

                  <span
                    className={cn(
                      "itt-mono text-[48px] font-bold leading-none",
                      filled ? "text-white/30" : "text-[var(--border-strong)]",
                    )}
                  >
                    {item.n}
                  </span>
                </div>

                <div
                  className={cn(
                    item.variant === "orange" ? "mt-auto" : "mt-11",
                  )}
                >
                  <h3 className="mb-3 max-w-[260px] text-[22px] font-semibold leading-[1.25]">
                    {item.title}
                  </h3>

                  <p
                    className={cn(
                      "max-w-[360px] text-[15px] leading-[1.55]",
                      filled ? "text-white/85" : "text-[var(--fg-muted)]",
                    )}
                  >
                    {item.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 pb-0 pt-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-5">
          <h2 className="text-[30px] font-bold leading-none tracking-[-0.02em]">
            Open positions
          </h2>

          <span className="itt-mono text-[12.5px] text-[var(--fg-muted)]">
            {isLoading ? "—" : `${jobs?.total ?? 0} open positions`}
          </span>
        </div>

        <div className="mb-7 flex flex-wrap gap-3">
          <div className="flex h-[50px] min-w-[280px] flex-1 items-center gap-2.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-[18px] text-[14.5px] text-[var(--fg-subtle)] focus-within:border-[var(--primary)]">
            <Search className="size-5 shrink-0" />
            <input
              className="h-full w-full flex-1 border-none bg-transparent text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)]"
              placeholder="Search by title, description, requirement, or location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="relative shrink-0">
            <button
              className="inline-flex h-[50px] items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface)] px-6 text-[14px] font-semibold text-[var(--fg)]"
              type="button"
              onClick={() => setSortOpen((o) => !o)}
            >
              <SlidersHorizontal className="size-[18px]" />
              Sort:{" "}
              {
                SORT_OPTIONS.find((s) => s.value === (query.sort ?? "newest"))
                  ?.label
              }
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  sortOpen && "rotate-180",
                )}
              />
            </button>

            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] shadow-lg">
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleSort(opt.value)}
                      className={cn(
                        "block w-full px-4 py-2.5 text-left text-[13.5px] hover:bg-[var(--surface-2)]",
                        (query.sort ?? "newest") === opt.value
                          ? "font-semibold text-[var(--primary)]"
                          : "text-[var(--fg)]",
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        <div className="grid min-w-0 max-w-full gap-8 xl:grid-cols-[248px_minmax(0,1fr)] xl:items-start">
          <aside className="rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-[22px] xl:sticky xl:top-[94px]">
            <div className="mb-5 flex items-center justify-between">
              <span className="text-[15px] font-semibold">Filters</span>
              <button
                className="bg-transparent text-[12px] font-semibold text-[var(--primary)]"
                type="button"
                onClick={handleClearFilters}
              >
                Clear
              </button>
            </div>

            <div className="mb-[22px]">
              <div className="itt-mono mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                Work type
              </div>

              <div className="flex flex-col gap-[10px]">
                {employmentTypeOptions.map((option) => {
                  const label = EMPLOYMENT_LABELS[option.value] ?? option.value;
                  const checked = query.employment_type === option.value;
                  return (
                    <label
                      key={label}
                      className="flex cursor-pointer items-center gap-2.5 text-[13.5px]"
                      onClick={() =>
                        toggleWorkType(
                          option.value as NonNullable<
                            JobListQuery["employment_type"]
                          >,
                        )
                      }
                    >
                      <span
                        className={cn(
                          "flex h-[17px] w-[17px] items-center justify-center rounded-[5px] border-[1.5px]",
                          checked
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[var(--border-strong)]",
                        )}
                      >
                        {checked && <Check className="size-[11px]" />}
                      </span>
                      {label}
                      <span className="ml-auto text-[12px] text-[var(--fg-subtle)]">
                        {option.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="itt-mono mb-3 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                Location
              </div>

              <div className="flex flex-col gap-[10px]">
                {locationOptions.map((option) => {
                  const checked = query.location === option.value;
                  return (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2.5 text-[13.5px]"
                      onClick={() =>
                        setQuery((q) => ({
                          ...q,
                          location: checked ? undefined : option.value,
                          page: 1,
                        }))
                      }
                    >
                      <span
                        className={cn(
                          "flex h-[17px] w-[17px] items-center justify-center rounded-[5px] border-[1.5px]",
                          checked
                            ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                            : "border-[var(--border-strong)]",
                        )}
                      >
                        {checked && <Check className="size-[11px]" />}
                      </span>
                      {option.value}
                      <span className="ml-auto text-[12px] text-[var(--fg-subtle)]">
                        {option.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          </aside>

          <div className="min-w-0 max-w-full overflow-hidden">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div
                  className="h-[112px] animate-pulse rounded-[14px] bg-[var(--surface-2)]"
                  key={i}
                  /* static list */
                />
              ))
            ) : isError ? (
              <ErrorState
                description="Could not load open roles. Please try again."
                icon={TriangleAlert}
                onRetry={() => refetch()}
                title="Could not load jobs"
              />
            ) : jobs?.data.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-[14px] border border-dashed border-[var(--border)] py-16 text-center">
                <p className="font-medium text-[var(--fg-muted)]">
                  No matching roles found.
                </p>
                <p className="text-[13.5px] text-[var(--fg-muted)]">
                  Try adjusting your filters or search keywords.
                </p>
                {hasActiveFilters && (
                  <button
                    className="mt-2 rounded-full border border-[var(--border)] px-4 py-2 text-[13px] font-semibold"
                    type="button"
                    onClick={handleClearFilters}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : (
              <div
                className={cn(
                  "flex min-w-0 flex-col gap-[14px] transition-opacity",
                  isFetching && "opacity-60",
                )}
              >
                {jobs?.data.map((item) => (
                  <article
                    key={item._id}
                    className="flex min-h-[112px] w-full min-w-0 max-w-full cursor-pointer flex-col gap-4 overflow-hidden rounded-[14px] border border-[var(--border)] bg-[var(--surface)] px-[26px] py-5 transition-transform duration-200 hover:-translate-y-1 lg:flex-row lg:items-center lg:gap-6"
                    onClick={() => navigate(`/career/${item.slug}`)}
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="mb-[9px] flex min-w-0 items-center gap-[10px]">
                        <h3
                          className="w-fit max-w-[min(70%,620px)] min-w-0 flex-none overflow-hidden text-ellipsis whitespace-nowrap text-[19px] font-semibold tracking-[-0.01em]"
                          title={item.title}
                        >
                          {item.title}
                        </h3>

                        {item.employment_type && (
                          <span className="itt-mono shrink-0 rounded-[6px] bg-[var(--primary-50)] px-[9px] py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--primary)]">
                            {item.employment_type.replace("-", " ")}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-[18px] text-[13px] text-[var(--fg-muted)]">
                        {item.location && (
                          <span className="flex items-center gap-[5px]">
                            <MapPin className="size-[15px]" />
                            {item.location}
                          </span>
                        )}

                        {item.employment_type && (
                          <span className="flex items-center gap-[5px]">
                            <Clock3 className="size-[15px]" />
                            {item.employment_type}
                          </span>
                        )}

                        {item.level && (
                          <span className="flex items-center gap-[5px]">
                            <ShieldCheck className="size-[15px]" />
                            {item.level}
                          </span>
                        )}

                        <span className="itt-mono flex items-center gap-[5px] text-[var(--fg)]">
                          <Banknote className="size-[15px] text-[var(--fg-muted)]" />
                          {formatSalary(
                            item.salary_min,
                            item.salary_max,
                            item.currency,
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 text-left lg:items-end lg:text-right">
                      {timeAgo(item.createdAt) && (
                        <span className="itt-mono text-[11.5px] text-[var(--fg-subtle)]">
                          {timeAgo(item.createdAt)}
                        </span>
                      )}

                      <span className="inline-flex h-[38px] items-center gap-[6px] rounded-full bg-[var(--primary-50)] px-[18px] text-[13px] font-semibold text-[var(--primary)]">
                        View role
                        <ArrowRight className="size-4" />
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {jobs && totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-between gap-4 pb-1 pt-[26px]">
                <span className="itt-mono text-[12.5px] text-[var(--fg-muted)]">
                  Page {currentPage} of {totalPages} &middot; {jobs.total} roles
                </span>

                <div className="flex items-center gap-2">
                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] disabled:opacity-40"
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => goToPage(currentPage - 1)}
                  >
                    <ChevronLeft className="size-[18px]" />
                  </button>

                  {getPageNumbers().map((p, idx) =>
                    p === "ellipsis" ? (
                      <span
                        key={`e-${idx}`}
                        className="px-1 text-[var(--fg-subtle)]"
                      >
                        …
                      </span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => goToPage(p)}
                        className={cn(
                          "h-10 w-10 rounded-[10px] text-[13.5px] font-semibold",
                          p === currentPage
                            ? "bg-[var(--primary)] text-white"
                            : "border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]",
                        )}
                      >
                        {p}
                      </button>
                    ),
                  )}

                  <button
                    className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] disabled:opacity-40"
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => goToPage(currentPage + 1)}
                  >
                    <ChevronRight className="size-[18px]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 pb-2 pt-[72px]">
        <div className="mb-9 flex flex-wrap items-end justify-between gap-7">
          <h2 className="max-w-[420px] text-[36px] font-bold leading-[1.08] tracking-[-0.025em]">
            A team that ships together
          </h2>
          <p className="max-w-[440px] text-[15px] leading-[1.65] text-[var(--fg-muted)]">
            No ticket farms, no black-box management. Engineers own features
            end-to-end, pair across guilds, and meet clients directly — a
            culture built on transparency, mentorship, and a firm commitment to
            deadlines.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
          {team.map((member) => (
            <div
              key={member.name}
              className="relative aspect-[3/4] overflow-hidden rounded-[18px] border border-[var(--border)] bg-[var(--surface)] transition-transform duration-200 hover:-translate-y-1"
            >
              <Placeholder
                className="absolute inset-0 items-start justify-start p-[14px]"
                label="portrait · 3:4"
              />
              <div className="absolute right-[13px] top-[13px] flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/15 text-[12px] font-bold text-white backdrop-blur-sm">
                in
              </div>
              <div className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_top,rgba(14,14,16,.88),rgba(14,14,16,.5)_52%,transparent)] px-[18px] pb-4 pt-5 text-white">
                <div className="text-[16px] font-semibold tracking-[-0.01em]">
                  {member.name}
                </div>
                <div className="itt-mono mt-[3px] text-[11px] text-white/78">
                  {member.role}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
