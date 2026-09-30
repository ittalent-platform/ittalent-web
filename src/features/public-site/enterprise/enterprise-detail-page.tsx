import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Building2,
  Globe,
  MapPin,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/auth/use-session";
import { getErrorStatus } from "@/lib/api-errors";
import { cn } from "@/lib/utils";
import {
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  LEVEL_LABELS,
  postedAgo,
} from "@/features/public-site/career/career-format";
import { StateCard } from "@/features/public-site/career/state-card";

import {
  getApiV1EnterprisesByEnterpriseId,
  getApiV1JobPostings,
  type EnterpriseDetailDto,
  type JobPosting,
} from "@/api/generated";
import { EnterpriseLogo } from "./enterprise-logo";

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

type Job = {
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
  expires_at?: string;
  createdAt?: string;
};

const toEnterprise = (dto: EnterpriseDetailDto): Enterprise => ({
  id: dto.id,
  name: dto.name,
  logoUrl: dto.logoUrl ?? undefined,
  industry: dto.industry ?? undefined,
  location: [dto.address.city, dto.address.country].filter(Boolean).join(", ") || undefined,
  shortDescription: dto.shortDescription ?? undefined,
  description: dto.description ?? undefined,
  website: dto.website ?? undefined,
});

const toJob = (dto: JobPosting): Job => ({
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
  expires_at: dto.expiresAt,
  createdAt: dto.createdAt,
});

const JOBS_SHOWN = 6;

function safeUrl(value?: string) {
  if (!value) return undefined;
  const url = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    return new URL(url).toString();
  } catch {
    return undefined;
  }
}

function hostname(url: string) {
  return new URL(url).hostname.replace(/^www\./, "");
}

const card =
  "flex flex-col rounded-2xl border border-mkt-line bg-white";
const h2 =
  "font-['Space_Grotesk',sans-serif] text-[21px] font-semibold text-mkt-ink";

function Fact({
  icon,
  label,
  children,
}: {
  icon: ReactNode;
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-px shrink-0 text-mkt-subtle">{icon}</span>
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-mkt-muted">{label}</dt>
        <dd className="break-words text-[13.5px] font-semibold text-mkt-ink">
          {children}
        </dd>
      </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <main>
      <div className="h-5 w-40 animate-pulse rounded bg-mkt-chip mx-4 mt-5 md:mx-12" />
      <div className="mx-4 mt-4 h-[220px] animate-pulse rounded-[20px] bg-mkt-chip md:mx-12" />
      <div className="flex items-end gap-[22px] px-4 md:px-[80px]">
        <div className="relative z-10 -mt-11 size-[112px] shrink-0 animate-pulse rounded-[20px] border-4 border-white bg-mkt-line" />
        <div className="mb-2 h-8 w-64 animate-pulse rounded bg-mkt-chip" />
      </div>
      <div className="mx-4 mt-16 grid gap-4 md:mx-12 lg:grid-cols-12">
        <div className="h-64 animate-pulse rounded-2xl bg-mkt-chip lg:col-span-8" />
        <div className="h-64 animate-pulse rounded-2xl bg-mkt-chip lg:col-span-4" />
      </div>
    </main>
  );
}

export function EnterpriseDetailPage() {
  const { id } = useParams();
  const { data: session } = useSession();
  const [tab, setTab] = useState<"about" | "open-jobs">("about");

  const {
    data: enterprise,
    error,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["enterprise", id],
    queryFn: async () => {
      const result = await getApiV1EnterprisesByEnterpriseId({ path: { enterpriseId: id! } });
      if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
      return toEnterprise(result.data);
    },
    enabled: !!id,
  });
  const {
    data: jobs,
    isLoading: jobsLoading,
    isError: jobsError,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ["enterprise-jobs", id],
    queryFn: async () => {
      const result = await getApiV1JobPostings({ query: { enterprise_id: id!, limit: 100, page: 1 } });
      if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
      const now = Date.now();
      return result.data.items
        .filter((item) => item.enterpriseId === id)
        .filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() >= now)
        .map(toJob);
    },
    enabled: !!id,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  // Underline the section tab that is currently in view.
  useEffect(() => {
    function onScroll() {
      const el = document.getElementById("open-jobs");
      if (!el) return;
      setTab(el.getBoundingClientRect().top < 160 ? "open-jobs" : "about");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  function jumpTo(section: "about" | "open-jobs") {
    setTab(section);
    document
      .getElementById(section)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isLoading) return <DetailSkeleton />;

  const notFound = isError && getErrorStatus(error) === 404;

  if (isError && !notFound) {
    return (
      <main className="mx-auto w-full max-w-[1344px] px-4 py-16 md:px-12">
        <StateCard
          description="Something went wrong on our side. Please try again."
          icon={
            <TriangleAlert
              aria-hidden="true"
              className="size-[26px] text-mkt-danger"
            />
          }
          iconBg="#fbe9e7"
          title="We couldn't load this company"
        >
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              className="flex h-10 items-center gap-2 rounded-full bg-mkt-accent px-[18px] text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
              onClick={() => refetch()}
              type="button"
            >
              <RefreshCw aria-hidden="true" className="size-4" />
              Try again
            </button>
            <Link
              className="flex h-10 items-center rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
              to="/enterprises"
            >
              Back to companies
            </Link>
          </div>
        </StateCard>
      </main>
    );
  }

  if (!enterprise) {
    return (
      <main className="mx-auto w-full max-w-[1344px] px-4 py-16 md:px-12">
        <StateCard
          description="This company doesn't exist or is no longer listed."
          icon={
            <Building2
              aria-hidden="true"
              className="size-[26px] text-mkt-accent-hover"
            />
          }
          iconBg="#fde8e0"
          title="Company not found"
        >
          <Link
            className="flex h-10 items-center rounded-full bg-mkt-accent px-[18px] text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
            to="/enterprises"
          >
            Browse companies
          </Link>
        </StateCard>
      </main>
    );
  }

  const website = safeUrl(enterprise.website);
  const jobCount = jobs?.length ?? 0;
  const shownJobs = (jobs ?? []).slice(0, JOBS_SHOWN);
  const aboutText = enterprise.description ?? enterprise.shortDescription;
  const aboutParagraphs = (aboutText ?? "")
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  const meta: ReactNode[] = [];
  if (enterprise.industry)
    meta.push(<span key="industry">{enterprise.industry}</span>);
  if (enterprise.location)
    meta.push(<span key="hq">Headquarters: {enterprise.location}</span>);
  if (website)
    meta.push(
      <a
        className="font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
        href={website}
        key="site"
        rel="noopener noreferrer"
        target="_blank"
      >
        {hostname(website)}
      </a>,
    );
  // "A · B · C" — each dot is its own item so the spacing is one 14px gap.
  const metaItems = meta.flatMap((node, i) =>
    i === 0
      ? [node]
      : [
          <span aria-hidden="true" className="text-mkt-subtle" key={`dot-${i}`}>
            ·
          </span>,
          node,
        ],
  );

  const tabClass = (active: boolean) =>
    cn(
      "flex h-12 items-center text-[13.5px] font-semibold",
      active
        ? "text-mkt-ink shadow-[inset_0_-2px_0_#d73c03]"
        : "text-mkt-muted hover:text-mkt-ink",
    );

  return (
    <main className="flex flex-col">
      {/* Header block */}
      <section className="border-b border-mkt-line bg-white">
        <div className="px-4 pt-5 md:px-12">
          <Link
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
            to="/enterprises"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to companies
          </Link>
        </div>

        <div
          aria-hidden="true"
          className="relative mx-4 mt-4 h-[220px] overflow-hidden rounded-[20px] bg-mkt-ink md:mx-12"
        >
          <div className="absolute -right-[60px] -top-20 size-[360px] rounded-full bg-mkt-brand opacity-90" />
          <div className="absolute right-[220px] top-[90px] size-40 rounded-full border-2 border-white/25" />
        </div>

        {/* The logo is pulled up over the banner with a negative margin; the
            name block is never pulled up, so it always starts below the banner. */}
        <div className="flex flex-wrap items-end gap-[22px] px-4 pb-7 md:px-[80px]">
          <EnterpriseLogo
            className="relative z-10 -mt-11 size-[112px] rounded-[20px] border-4 border-white text-[32px] shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
            logoUrl={enterprise.logoUrl}
            name={enterprise.name}
            seed={enterprise.id}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1">
            <h1 className="font-['Space_Grotesk',sans-serif] text-[32px] font-semibold leading-[1.25] text-mkt-ink [overflow-wrap:anywhere]">
              {enterprise.name}
            </h1>
            {metaItems.length > 0 ? (
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13.5px] text-mkt-ink-2">
                {metaItems}
              </div>
            ) : null}
          </div>
          {jobCount > 0 ? (
            <button
              className="mb-1 flex h-11 items-center gap-2 rounded-full bg-mkt-accent px-[22px] text-sm font-semibold text-white hover:bg-mkt-accent-hover"
              onClick={() => jumpTo("open-jobs")}
              type="button"
            >
              See {jobCount} open {jobCount === 1 ? "job" : "jobs"}
            </button>
          ) : null}
        </div>

        <nav
          aria-label="Company sections"
          className="flex gap-7 border-t border-mkt-line-soft px-4 md:px-12"
        >
          <button
            aria-current={tab === "about" ? "true" : undefined}
            className={tabClass(tab === "about")}
            onClick={() => jumpTo("about")}
            type="button"
          >
            About
          </button>
          <button
            aria-current={tab === "open-jobs" ? "true" : undefined}
            className={tabClass(tab === "open-jobs")}
            onClick={() => jumpTo("open-jobs")}
            type="button"
          >
            Open jobs
            <span className="ml-1.5 flex h-5 items-center rounded-full bg-mkt-chip px-[7px] text-[11.5px] text-mkt-ink-2">
              {jobsLoading ? "—" : jobCount}
            </span>
          </button>
        </nav>
      </section>

      {/* Body */}
      <div className="grid items-start gap-6 px-4 pb-[72px] pt-8 md:px-12 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          <section
            className={cn(card, "scroll-mt-4 gap-3.5 p-7")}
            id="about"
          >
            <h2 className={h2}>About {enterprise.name}</h2>
            {aboutParagraphs.length > 0 ? (
              aboutParagraphs.map((p, i) => (
                <p
                  className="text-[14.5px] leading-[1.7] text-mkt-ink-2"
                  key={i}
                >
                  {p}
                </p>
              ))
            ) : (
              <p className="text-[14.5px] leading-[1.7] text-mkt-muted">
                This company hasn't added a description yet.
              </p>
            )}
          </section>

          <section
            className={cn(card, "scroll-mt-4 gap-1.5 p-7")}
            id="open-jobs"
          >
            <div className="flex flex-wrap items-center gap-y-1 pb-2.5">
              <h2 className={h2}>Open jobs</h2>
              {jobCount > JOBS_SHOWN ? (
                <span className="ml-2.5 text-[13px] text-mkt-muted">
                  Showing {shownJobs.length} of {jobCount}
                </span>
              ) : null}
              <div className="flex-1" />
              {jobCount > 0 ? (
                <Link
                  className="text-[13.5px] font-semibold text-mkt-accent-hover hover:text-mkt-accent-dark"
                  to={`/career?company=${enterprise.id}`}
                >
                  View all {jobCount} {jobCount === 1 ? "job" : "jobs"} →
                </Link>
              ) : null}
            </div>

            {jobsLoading ? (
              Array.from({ length: 3 }, (_, i) => (
                <div
                  className="my-1 h-[68px] animate-pulse rounded-xl bg-mkt-chip"
                  key={i}
                />
              ))
            ) : jobsError ? (
              <p className="border-t border-mkt-line-soft pt-5 text-[14px] text-mkt-danger">
                Couldn't load open jobs.{" "}
                <button
                  className="font-semibold underline"
                  onClick={() => refetchJobs()}
                  type="button"
                >
                  Retry
                </button>
              </p>
            ) : shownJobs.length === 0 ? (
              <p className="border-t border-mkt-line-soft pt-5 text-[14px] text-mkt-muted">
                No open jobs right now. Check back soon.
              </p>
            ) : (
              shownJobs.map((job) => {
                const type = job.employment_type
                  ? (EMPLOYMENT_LABELS[job.employment_type] ??
                    job.employment_type)
                  : null;
                const level = job.level
                  ? (LEVEL_LABELS[job.level.toLowerCase()] ?? job.level)
                  : null;
                const deadline = formatDeadline(job.expires_at);
                const posted = postedAgo(job.createdAt);
                return (
                  <Link
                    className="-mx-3.5 flex items-center gap-4 rounded-xl border-t border-mkt-line-soft px-3.5 py-4 text-mkt-ink hover:bg-mkt-canvas"
                    key={job._id}
                    to={`/career/${job.slug}`}
                  >
                    <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
                      <span className="truncate text-[15.5px] font-semibold">
                        {job.title}
                      </span>
                      <span className="text-[13px] text-mkt-ink-2">
                        {[job.location, type, level]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </div>
                    <div className="hidden w-[180px] shrink-0 flex-col items-end gap-1 sm:flex">
                      <span className="text-sm font-semibold">
                        {formatSalaryCard(
                          job.salary_min,
                          job.salary_max,
                          job.currency,
                        )}
                      </span>
                      {deadline ? (
                        <span className="text-xs text-mkt-subtle">
                          Apply by {deadline}
                        </span>
                      ) : posted ? (
                        <span className="text-xs text-mkt-subtle">
                          Posted {posted}
                        </span>
                      ) : null}
                    </div>
                    <svg
                      aria-hidden="true"
                      className="shrink-0 text-mkt-subtle"
                      fill="none"
                      height="18"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      width="18"
                    >
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </Link>
                );
              })
            )}
          </section>
        </div>

        <aside className="flex flex-col gap-4 lg:col-span-4">
          <section className={cn(card, "gap-4 p-6")}>
            <h2 className="text-[15px] font-semibold text-mkt-ink">
              Company facts
            </h2>
            <dl className="flex flex-col gap-3.5">
              <Fact
                icon={<Building2 aria-hidden="true" className="size-[18px]" />}
                label="Industry"
              >
                {enterprise.industry ?? "—"}
              </Fact>
              <Fact
                icon={<MapPin aria-hidden="true" className="size-[18px]" />}
                label="Headquarters"
              >
                {enterprise.location ?? "—"}
              </Fact>
              <Fact
                icon={<Globe aria-hidden="true" className="size-[18px]" />}
                label="Website"
              >
                {website ? (
                  <a
                    className="text-mkt-accent-hover hover:text-mkt-accent-dark"
                    href={website}
                    rel="noopener noreferrer"
                    target="_blank"
                  >
                    {hostname(website)}
                  </a>
                ) : (
                  "—"
                )}
              </Fact>
            </dl>
          </section>

          {!session ? (
            <section className="flex flex-col gap-3 rounded-2xl bg-mkt-ink p-6 text-white">
              <h2 className="font-['Space_Grotesk',sans-serif] text-[19px] font-semibold">
                Want to work here?
              </h2>
              <p className="text-[13.5px] leading-[1.55] text-mkt-on-dark">
                Create one ITTalent profile and apply to {enterprise.name} and
                any other company with the same CV.
              </p>
              <Link
                className="mt-1 flex h-[42px] items-center self-start rounded-full bg-white px-5 text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
                to="/register"
              >
                Create an account
              </Link>
            </section>
          ) : null}
        </aside>
      </div>
    </main>
  );
}