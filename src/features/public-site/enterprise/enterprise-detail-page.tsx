import { useEffect, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  ExternalLink,
  Factory,
  Globe,
  MapPin,
  TriangleAlert,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { ErrorState } from "@/components/common/error-state";
import { getErrorStatus } from "@/lib/api-errors";

import { DetailTextBlock } from "@/features/public-site/career/career-detail-blocks";
import {
  EMPLOYMENT_LABELS,
  formatSalary,
  timeAgo,
} from "@/features/public-site/career/career-format";
import {
  fetchEnterprise,
  fetchEnterprises,
  fetchEnterpriseJobs,
} from "./enterprise.api";
import { EnterpriseCover } from "./enterprise-cover";
import { EnterpriseLogo } from "./enterprise-logo";

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

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="itt-mono mb-3 inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--primary)]">
      <span className="inline-block h-[2px] w-[18px] bg-[var(--primary)]" />{" "}
      {children}
    </div>
  );
}

function FactTile({
  children,
  icon,
  label,
}: {
  children: ReactNode;
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-[var(--primary-50)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="min-w-0">
        <div className="itt-mono mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
          {label}
        </div>
        <div className="truncate text-[15px] font-semibold">{children}</div>
      </div>
    </div>
  );
}

export function EnterpriseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const {
    data: enterprise,
    error,
    isError,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["enterprise", id],
    queryFn: () => fetchEnterprise(id!),
    enabled: !!id,
  });
  const { data: jobs, isLoading: jobsLoading } = useQuery({
    queryKey: ["enterprise-jobs", id],
    queryFn: () => fetchEnterpriseJobs(id!),
    enabled: !!id,
  });
  const industry = enterprise?.industry;
  const { data: related } = useQuery({
    queryKey: ["enterprise-related", industry],
    queryFn: () => fetchEnterprises({ industry, limit: 4 }),
    enabled: !!industry,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [id]);

  if (isLoading) {
    return (
      <main>
        <div className="h-[230px] animate-pulse bg-[var(--surface-2)]" />
        <div className="mx-auto max-w-[1320px] px-8">
          <div className="-mt-16 size-[128px] animate-pulse rounded-[28px] border-[6px] border-[var(--bg)] bg-[var(--surface-2)]" />
          <div className="mt-6 h-10 w-1/3 animate-pulse rounded bg-[var(--surface-2)]" />
          <div className="mt-8 h-32 animate-pulse rounded-[16px] bg-[var(--surface-2)]" />
        </div>
      </main>
    );
  }

  if (isError && getErrorStatus(error) !== 404) {
    return (
      <main className="mx-auto max-w-[1320px] px-8 pb-20 pt-[140px]">
        <ErrorState
          description="Could not load this enterprise. Please try again."
          icon={TriangleAlert}
          onRetry={() => refetch()}
          secondaryAction={{
            label: "Back to enterprises",
            onClick: () => navigate("/enterprises"),
          }}
          title="Could not load enterprise"
        />
      </main>
    );
  }

  if (!enterprise) {
    return (
      <main className="mx-auto flex max-w-[1320px] flex-col items-center gap-4 px-8 pb-20 pt-[160px] text-center">
        <Building2 className="size-10 text-[var(--fg-subtle)]" />
        <p className="font-medium text-[var(--fg-muted)]">
          Enterprise not found.
        </p>
        <button
          className="h-11 rounded-full border border-[var(--border-strong)] bg-transparent px-6 text-[14px] font-semibold text-[var(--fg)]"
          onClick={() => navigate("/enterprises")}
          type="button"
        >
          Back to enterprises
        </button>
      </main>
    );
  }

  const website = safeUrl(enterprise.website);
  const others = (related?.data ?? [])
    .filter((e) => e.id !== enterprise.id)
    .slice(0, 3);
  const openRoles = jobs?.length;

  return (
    <main>
      <EnterpriseCover className="h-[230px]">
        <div className="relative mx-auto max-w-[1320px] px-8 pt-[104px]">
          <button
            className="inline-flex items-center gap-2 rounded-full bg-[var(--surface)]/80 px-4 py-2 text-[13px] font-semibold text-[var(--fg)] backdrop-blur-sm"
            onClick={() => navigate("/enterprises")}
            type="button"
          >
            <ArrowLeft className="size-4" /> All enterprises
          </button>
        </div>
      </EnterpriseCover>

      <div className="mx-auto max-w-[1320px] px-8 pb-20">
        <div className="relative -mt-16 flex flex-wrap items-end justify-between gap-6">
          <div className="flex min-w-0 flex-wrap items-end gap-6">
            <EnterpriseLogo
              className="relative z-10 size-[128px] rounded-[28px] border-[6px] border-[var(--bg)] text-[40px] shadow-md"
              logoUrl={enterprise.logoUrl}
              name={enterprise.name}
            />
            <div className="min-w-0 pb-2">
              {enterprise.industry && (
                <span className="itt-mono mb-3 inline-block rounded-full bg-[var(--primary-50)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.05em] text-[var(--primary)]">
                  {enterprise.industry}
                </span>
              )}
              <h1
                className="text-[40px] font-bold normal-case leading-[1.05] tracking-[-0.025em] [overflow-wrap:anywhere]"
                style={{ textTransform: "none" }}
              >
                {enterprise.name}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 pb-2">
            <button
              className="inline-flex h-12 items-center gap-2 rounded-full border border-[var(--border-strong)] bg-transparent px-6 text-[14.5px] font-semibold text-[var(--fg)]"
              onClick={() =>
                document
                  .getElementById("open-roles")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              type="button"
            >
              <Briefcase className="size-4" /> View open roles
            </button>
            {website && (
              <a
                className="inline-flex h-12 items-center gap-2 rounded-full bg-[var(--primary)] px-6 text-[14.5px] font-semibold text-white no-underline"
                href={website}
                rel="noopener noreferrer"
                target="_blank"
              >
                Visit website <ExternalLink className="size-4" />
              </a>
            )}
          </div>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <FactTile icon={<Factory className="size-5" />} label="Industry">
            {enterprise.industry ?? "—"}
          </FactTile>
          <FactTile icon={<MapPin className="size-5" />} label="Headquarters">
            {enterprise.location ?? "—"}
          </FactTile>
          <FactTile icon={<Globe className="size-5" />} label="Website">
            {website ? (
              <a
                className="text-[var(--fg)] no-underline hover:text-[var(--primary)]"
                href={website}
                rel="noopener noreferrer"
                target="_blank"
              >
                {hostname(website)}
              </a>
            ) : (
              "—"
            )}
          </FactTile>
          <FactTile icon={<Briefcase className="size-5" />} label="Open roles">
            {openRoles ?? "—"}
          </FactTile>
        </div>

        <section className="mt-16 grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-14">
          <div>
            <Eyebrow>Company</Eyebrow>
            <h2 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">
              About {enterprise.name}
            </h2>
          </div>
          <div className="min-w-0">
            {enterprise.shortDescription && (
              <p className="mb-6 border-l-[3px] border-[var(--primary)] pl-5 text-[20px] font-medium leading-[1.5] tracking-[-0.01em]">
                {enterprise.shortDescription}
              </p>
            )}
            {enterprise.description ? (
              <DetailTextBlock text={enterprise.description} />
            ) : (
              !enterprise.shortDescription && (
                <p className="text-[14.5px] text-[var(--fg-muted)]">
                  This company has not added a description yet.
                </p>
              )
            )}
          </div>
        </section>

        <section className="mt-16 scroll-mt-[100px]" id="open-roles">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <Eyebrow>Careers</Eyebrow>
              <h2 className="text-[30px] font-bold leading-[1.1] tracking-[-0.02em]">
                Open positions
              </h2>
            </div>
            <span className="itt-mono text-[12.5px] text-[var(--fg-muted)]">
              {jobsLoading ? "—" : `${openRoles ?? 0} open`}
            </span>
          </div>

          {jobsLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[...Array(2)].map((_, i) => (
                <div
                  className="h-[170px] animate-pulse rounded-[16px] bg-[var(--surface-2)]"
                  key={i}
                />
              ))}
            </div>
          ) : !jobs || jobs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-[16px] border border-dashed border-[var(--border)] py-14 text-center">
              <Briefcase className="size-8 text-[var(--fg-subtle)]" />
              <p className="text-[14px] text-[var(--fg-muted)]">
                No open positions at the moment. Check back soon.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {jobs.map((job) => (
                <article
                  className="group flex min-w-0 cursor-pointer flex-col rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-6 transition duration-200 hover:-translate-y-1 hover:shadow-lg"
                  key={job._id}
                  onClick={() => navigate(`/career/${job.slug}`)}
                >
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className="line-clamp-2 text-[18px] font-semibold leading-[1.3] tracking-[-0.01em]">
                      {job.title}
                    </h3>
                    {timeAgo(job.createdAt) && (
                      <span className="itt-mono shrink-0 pt-1 text-[11px] text-[var(--fg-subtle)]">
                        {timeAgo(job.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="mb-5 flex flex-wrap items-center gap-2">
                    {job.employment_type && (
                      <span className="itt-mono rounded-[6px] bg-[var(--primary-50)] px-[9px] py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--primary)]">
                        {EMPLOYMENT_LABELS[job.employment_type] ??
                          job.employment_type}
                      </span>
                    )}
                    {job.level && (
                      <span className="itt-mono rounded-[6px] bg-[var(--surface-2)] px-[9px] py-1 text-[10.5px] font-semibold uppercase tracking-[0.04em] text-[var(--fg-muted)]">
                        {job.level}
                      </span>
                    )}
                    {job.location && (
                      <span className="flex items-center gap-1 text-[12.5px] text-[var(--fg-muted)]">
                        <MapPin className="size-[14px]" />
                        {job.location}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto flex items-center justify-between border-t border-[var(--border)] pt-4">
                    <span className="itt-mono text-[13.5px] font-semibold">
                      {formatSalary(
                        job.salary_min,
                        job.salary_max,
                        job.currency,
                      )}
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--primary)]">
                      View role
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        {others.length > 0 && (
          <section className="mt-16">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Eyebrow>Keep exploring</Eyebrow>
                <h2 className="text-[26px] font-bold leading-[1.1] tracking-[-0.02em]">
                  More in {industry}
                </h2>
              </div>
              <button
                className="inline-flex items-center gap-1.5 bg-transparent text-[13.5px] font-semibold text-[var(--primary)]"
                onClick={() => navigate("/enterprises")}
                type="button"
              >
                Browse all <ArrowUpRight className="size-4" />
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {others.map((item) => (
                <article
                  className="group flex min-w-0 cursor-pointer items-center gap-4 rounded-[16px] border border-[var(--border)] bg-[var(--surface)] p-4 transition-transform duration-200 hover:-translate-y-1"
                  key={item.id}
                  onClick={() => navigate(`/enterprises/${item.id}`)}
                >
                  <EnterpriseLogo
                    className="size-12 rounded-[12px] text-[16px]"
                    logoUrl={item.logoUrl}
                    name={item.name}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold">
                      {item.name}
                    </div>
                    <div className="truncate text-[12.5px] text-[var(--fg-muted)]">
                      {item.location ?? "—"}
                    </div>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 text-[var(--fg-subtle)] transition-colors group-hover:text-[var(--primary)]" />
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
