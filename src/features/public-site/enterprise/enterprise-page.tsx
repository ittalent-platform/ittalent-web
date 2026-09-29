import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  TriangleAlert,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/common/error-state";
import { cn } from "@/lib/utils";

import { fetchOpenRoleCounts } from "@/features/public-site/career/career.api";
import {
  fetchEnterpriseFilters,
  fetchEnterprises,
  type Enterprise,
  type EnterpriseListQuery,
} from "./enterprise.api";
import { EnterpriseCover } from "./enterprise-cover";
import { EnterpriseLogo } from "./enterprise-logo";

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, 2, total, current]);
  if (current > 1) pages.add(current - 1);
  if (current < total) pages.add(current + 1);
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "ellipsis")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("ellipsis");
    out.push(p);
  });
  return out;
}

function EnterpriseCard({
  item,
  onOpen,
  roles,
}: {
  item: Enterprise;
  onOpen: () => void;
  roles?: number;
}) {
  return (
    <article
      className="group flex min-w-0 cursor-pointer flex-col overflow-hidden rounded-[20px] border border-[var(--border)] bg-[var(--surface)] transition duration-200 hover:-translate-y-1 hover:shadow-lg"
      onClick={onOpen}
    >
      <EnterpriseCover className="h-[88px]">
        {item.industry && (
          <span className="itt-mono absolute right-4 top-4 max-w-[70%] truncate rounded-full bg-[var(--surface)]/80 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.05em] text-[var(--primary)] backdrop-blur-sm">
            {item.industry}
          </span>
        )}
      </EnterpriseCover>
      <div className="flex flex-1 flex-col px-6 pb-6">
        <EnterpriseLogo
          className="relative z-10 -mt-9 mb-4 size-[68px] rounded-[18px] border-4 border-[var(--surface)] text-[22px] shadow-sm"
          logoUrl={item.logoUrl}
          name={item.name}
        />
        <h3
          className="truncate text-[20px] font-semibold tracking-[-0.01em]"
          title={item.name}
        >
          {item.name}
        </h3>
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]">
          <MapPin className="size-[15px] shrink-0" />
          <span className="truncate">
            {item.location ?? "Location not specified"}
          </span>
        </div>
        <p className="mt-4 line-clamp-2 min-h-[44px] text-[14px] leading-[1.55] text-[var(--fg-muted)]">
          {item.shortDescription ?? "No description provided yet."}
        </p>
        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-2)] px-3.5 py-1.5 text-[12.5px] font-semibold text-[var(--fg)]">
            <Briefcase className="size-[14px] text-[var(--primary)]" />
            {roles === undefined
              ? "—"
              : `${roles} open ${roles === 1 ? "role" : "roles"}`}
          </span>
          <span className="flex size-9 items-center justify-center rounded-full bg-[var(--primary-50)] text-[var(--primary)] transition-colors group-hover:bg-[var(--primary)] group-hover:text-white">
            <ArrowUpRight className="size-[18px]" />
          </span>
        </div>
      </div>
    </article>
  );
}

export function EnterprisePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState<EnterpriseListQuery>({
    page: 1,
    limit: 9,
  });
  const [search, setSearch] = useState("");
  const [locationOpen, setLocationOpen] = useState(false);

  const { data, isError, isFetching, isLoading, refetch } = useQuery({
    queryKey: ["enterprises", query],
    queryFn: () => fetchEnterprises(query),
    placeholderData: (prev) => prev,
  });
  const { data: filters } = useQuery({
    queryKey: ["enterprise-filters"],
    queryFn: fetchEnterpriseFilters,
  });
  const { data: roleCounts } = useQuery({
    queryKey: ["enterprise-role-counts"],
    queryFn: fetchOpenRoleCounts,
  });

  const currentPage = query.page ?? 1;
  const totalPages = data?.totalPages ?? 1;
  const hasActiveFilters = Boolean(
    query.industry || query.location || query.keyword,
  );

  function applySearchNow() {
    const keyword = search.trim() || undefined;
    setQuery((q) => (q.keyword === keyword ? q : { ...q, keyword, page: 1 }));
  }

  function clearFilters() {
    setSearch("");
    setQuery({ page: 1, limit: query.limit });
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    if (!locationOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && setLocationOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [locationOpen]);

  useEffect(() => {
    const timer = window.setTimeout(applySearchNow, 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  return (
    <main>
      <section className="border-b border-[var(--border)] bg-[var(--surface-2)]/60 px-8 pb-10 pt-[118px]">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-8">
            <div className="max-w-[720px]">
              <div className="itt-mono mb-4 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
                <span className="inline-block h-[2px] w-[18px] bg-[var(--primary)]" />{" "}
                Partner enterprises
              </div>
              <h1
                className="text-[46px] font-bold normal-case leading-[1.05] tracking-[-0.03em]"
                style={{ textTransform: "none" }}
              >
                DISCOVER THE{" "}
                <span className="italic text-[var(--primary)]">COMPANIES</span>{" "}
                BEHIND THE ROLES
              </h1>
              <p className="mt-4 max-w-[560px] text-[16px] leading-[1.6] text-[var(--fg-muted)]">
                Browse verified employers hiring through ITTALENT. Search by
                name, pick an industry, and jump straight to their open
                positions.
              </p>
            </div>
            <div className="flex divide-x divide-[var(--border)] rounded-[18px] border border-[var(--border)] bg-[var(--surface)]">
              {[
                {
                  label: "Enterprises",
                  value: filters?.total,
                  highlight: true,
                },
                { label: "Industries", value: filters?.industries.length },
                { label: "Locations", value: filters?.locations.length },
              ].map((stat) => (
                <div className="px-6 py-4" key={stat.label}>
                  <div
                    className={cn(
                      "text-[28px] font-bold leading-none",
                      stat.highlight && "text-[var(--primary)]",
                    )}
                  >
                    {stat.value ?? "—"}
                  </div>
                  <div className="itt-mono mt-2 text-[10.5px] uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1 rounded-[22px] border border-[var(--border)] bg-[var(--surface)] p-2 shadow-sm lg:flex-row lg:items-center">
            <label className="flex h-[54px] flex-1 items-center gap-3 rounded-full px-5 text-[var(--fg-subtle)] focus-within:text-[var(--primary)]">
              <Search className="size-5 shrink-0" />
              <input
                className="h-full w-full border-none bg-transparent text-[14.5px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-subtle)]"
                maxLength={100}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applySearchNow()}
                placeholder="Search by company name, industry, or location..."
                value={search}
              />
              {search && (
                <button
                  aria-label="Clear search"
                  className="text-[var(--fg-subtle)] hover:text-[var(--fg)]"
                  onClick={() => setSearch("")}
                  type="button"
                >
                  <X className="size-4" />
                </button>
              )}
            </label>
            <div className="relative lg:w-[250px] lg:border-l lg:border-[var(--border)]">
              <button
                aria-expanded={locationOpen}
                aria-haspopup="listbox"
                className="flex h-[54px] w-full items-center gap-2 bg-transparent px-5 text-left text-[14px] font-medium text-[var(--fg)]"
                onClick={() => setLocationOpen((o) => !o)}
                type="button"
              >
                <MapPin className="size-[18px] shrink-0 text-[var(--fg-muted)]" />
                <span className="flex-1 truncate">
                  {query.location ?? "All locations"}
                </span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-[var(--fg-muted)] transition-transform",
                    locationOpen && "rotate-180",
                  )}
                />
              </button>

              {locationOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLocationOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full z-20 mt-3 max-h-[300px] w-full min-w-[250px] overflow-y-auto rounded-[14px] border border-[var(--border)] bg-[var(--surface)] py-1.5 shadow-lg"
                    role="listbox"
                  >
                    {[
                      {
                        value: "",
                        label: "All locations",
                        count: filters?.total,
                      },
                      ...(filters?.locations.map((l) => ({
                        value: l.value,
                        label: l.value,
                        count: l.count,
                      })) ?? []),
                    ].map((opt) => {
                      const selected = (query.location ?? "") === opt.value;
                      return (
                        <button
                          aria-selected={selected}
                          className={cn(
                            "flex w-full items-center gap-3 px-4 py-2.5 text-left text-[13.5px] hover:bg-[var(--surface-2)]",
                            selected
                              ? "font-semibold text-[var(--primary)]"
                              : "text-[var(--fg)]",
                          )}
                          key={opt.value || "all"}
                          onClick={() => {
                            setQuery((q) => ({
                              ...q,
                              location: opt.value || undefined,
                              page: 1,
                            }));
                            setLocationOpen(false);
                          }}
                          role="option"
                          type="button"
                        >
                          <span className="flex-1 truncate">{opt.label}</span>
                          {opt.count !== undefined && (
                            <span className="itt-mono text-[11.5px] text-[var(--fg-subtle)]">
                              {opt.count}
                            </span>
                          )}
                          {selected && <Check className="size-4 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
            <button
              className="h-[54px] rounded-full bg-[var(--primary)] px-9 text-[14.5px] font-semibold text-white"
              onClick={applySearchNow}
              type="button"
            >
              Search
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1320px] px-8 pb-20 pt-8">
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            className={cn(
              "h-[38px] rounded-full border px-4 text-[13px] font-semibold transition-colors",
              !query.industry
                ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--primary)]",
            )}
            onClick={() =>
              setQuery((q) => ({ ...q, industry: undefined, page: 1 }))
            }
            type="button"
          >
            All industries
          </button>
          {filters?.industries.map((option) => {
            const active = query.industry === option.value;
            return (
              <button
                className={cn(
                  "inline-flex h-[38px] items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors",
                  active
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--primary)]",
                )}
                key={option.value}
                onClick={() =>
                  setQuery((q) => ({
                    ...q,
                    industry: active ? undefined : option.value,
                    page: 1,
                  }))
                }
                type="button"
              >
                {option.value}
                <span
                  className={cn(
                    "itt-mono text-[11px]",
                    active ? "text-white/80" : "text-[var(--fg-subtle)]",
                  )}
                >
                  {option.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <span className="itt-mono text-[12.5px] text-[var(--fg-muted)]">
            {isLoading
              ? "Loading…"
              : `Showing ${data?.data.length ?? 0} of ${data?.total ?? 0} enterprises`}
          </span>
          {hasActiveFilters && (
            <button
              className="inline-flex items-center gap-1.5 bg-transparent text-[13px] font-semibold text-[var(--primary)]"
              onClick={clearFilters}
              type="button"
            >
              <X className="size-4" /> Clear all filters
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                className="h-[300px] animate-pulse rounded-[20px] bg-[var(--surface-2)]"
                key={i}
              />
            ))}
          </div>
        ) : isError ? (
          <ErrorState
            description="Could not load enterprises. Please try again."
            icon={TriangleAlert}
            onRetry={() => refetch()}
            title="Could not load enterprises"
          />
        ) : data?.data.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-[20px] border border-dashed border-[var(--border)] py-20 text-center">
            <Building2 className="mb-1 size-10 text-[var(--fg-subtle)]" />
            <p className="font-medium text-[var(--fg-muted)]">
              No matching enterprises found.
            </p>
            <p className="text-[13.5px] text-[var(--fg-muted)]">
              Try another keyword, industry or location.
            </p>
            {hasActiveFilters && (
              <button
                className="mt-2 rounded-full border border-[var(--border)] px-4 py-2 text-[13px] font-semibold"
                onClick={clearFilters}
                type="button"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={cn(
              "grid gap-5 transition-opacity md:grid-cols-2 xl:grid-cols-3",
              isFetching && "opacity-60",
            )}
          >
            {data?.data.map((item) => (
              <EnterpriseCard
                item={item}
                key={item.id}
                onOpen={() => navigate(`/enterprises/${item.id}`)}
                roles={roleCounts ? (roleCounts[item.id] ?? 0) : undefined}
              />
            ))}
          </div>
        )}

        {data && totalPages > 1 && (
          <div className="mt-10 flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                aria-label="Previous page"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--fg-muted)] disabled:opacity-40"
                disabled={currentPage === 1}
                onClick={() =>
                  setQuery((q) => ({ ...q, page: currentPage - 1 }))
                }
                type="button"
              >
                <ChevronLeft className="size-[18px]" />
              </button>
              {pageNumbers(currentPage, totalPages).map((p, idx) =>
                p === "ellipsis" ? (
                  <span
                    className="px-1 text-[var(--fg-subtle)]"
                    key={`e-${idx}`}
                  >
                    …
                  </span>
                ) : (
                  <button
                    className={cn(
                      "h-10 w-10 rounded-full text-[13.5px] font-semibold",
                      p === currentPage
                        ? "bg-[var(--primary)] text-white"
                        : "border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)]",
                    )}
                    key={p}
                    onClick={() => setQuery((q) => ({ ...q, page: p }))}
                    type="button"
                  >
                    {p}
                  </button>
                ),
              )}
              <button
                aria-label="Next page"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--fg)] disabled:opacity-40"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setQuery((q) => ({ ...q, page: currentPage + 1 }))
                }
                type="button"
              >
                <ChevronRight className="size-[18px]" />
              </button>
            </div>
            <span className="itt-mono text-[12px] text-[var(--fg-muted)]">
              Page {currentPage} of {totalPages}
            </span>
          </div>
        )}
      </section>
    </main>
  );
}
