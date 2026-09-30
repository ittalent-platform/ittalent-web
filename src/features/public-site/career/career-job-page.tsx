import { useEffect, type ReactNode } from "react";
import {
  ArrowLeft,
  Briefcase,
  CalendarDays,
  CircleCheck,
  Clock,
  Lock,
  MapPin,
  RefreshCw,
  TrendingUp,
  TriangleAlert,
  Users,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/auth/use-session";
import { getErrorStatus } from "@/lib/api-errors";
import {
  getApiV1EnterprisesByEnterpriseId,
  getApiV1JobPostings,
  getApiV1JobPostingsByIdPublic,
  type EnterpriseDetailDto,
  type JobPostingResponse,
} from "@/api/generated";

import { ApplyButton } from "./apply-button";

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
  aboutTheRole?: string;
  description?: string;
  requirements?: string;
  benefits?: string;
  openings?: number;
  expires_at?: string;
  createdAt?: string;
};

const toJob = (dto: JobPostingResponse): Job => ({
  _id: dto.id,
  enterpriseId: dto.enterpriseId,
  title: dto.title,
  slug: dto.slug || dto.id,
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
import {
  companyInitials,
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  LEVEL_LABELS,
  logoPalette,
  postedAgo,
} from "./career-format";
import { StateCard } from "./state-card";

const h2Class =
  "m-0 font-['Space_Grotesk',sans-serif] text-[21px] font-semibold";
const cardClass =
  "flex flex-col gap-3.5 rounded-2xl border border-mkt-line bg-white p-5 md:p-7";

function linesOf(text?: string) {
  return (text ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** Paragraphs and "- bullet" lines, in the design's body-text style. */
function TextBlock({ text }: { text?: string }) {
  const lines = linesOf(text);
  if (lines.length === 0) return null;
  const isBullet = (l: string) => /^[-*•]\s+/.test(l);
  const strip = (l: string) => l.replace(/^[-*•]\s+/, "");

  const groups: { bullets: boolean; items: string[] }[] = [];
  for (const line of lines) {
    const bullets = isBullet(line);
    const last = groups[groups.length - 1];
    if (last && last.bullets === bullets) last.items.push(strip(line));
    else groups.push({ bullets, items: [strip(line)] });
  }

  return (
    <>
      {groups.map((group, gi) =>
        group.bullets ? (
          <ul
            className="m-0 flex list-disc flex-col gap-2 pl-5 text-[14.5px] leading-[1.6] text-mkt-ink-2"
            key={gi}
          >
            {group.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        ) : (
          group.items.map((item, i) => (
            <p
              className="m-0 text-[14.5px] leading-[1.7] text-mkt-ink-2 [overflow-wrap:anywhere]"
              key={`${gi}-${i}`}
            >
              {item}
            </p>
          ))
        ),
      )}
    </>
  );
}

function daysLeft(deadline?: string) {
  if (!deadline) return null;
  const time = new Date(deadline).getTime();
  if (Number.isNaN(time)) return null;
  return Math.ceil((time - Date.now()) / 86_400_000);
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="flex h-8 items-center gap-[7px] rounded-full bg-mkt-chip px-3 text-[13px] font-semibold text-mkt-ink-2">
      {icon}
      {children}
    </span>
  );
}

function PageShell({ children }: { children: ReactNode }) {
  return <main className="mx-auto w-full max-w-[1440px]">{children}</main>;
}

export function CareerJobPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { data: session } = useSession();

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["job", slug],
    queryFn: async () => {
      const result = await getApiV1JobPostingsByIdPublic({ path: { id: slug! } });
      if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
      return toJob(result.data);
    },
    enabled: !!slug,
  });
  const job: Job | undefined = data;

  const enterpriseId = job?.enterpriseId;
  const { data: company } = useQuery({
    queryKey: ["enterprise", enterpriseId],
    queryFn: async () => {
      const result = await getApiV1EnterprisesByEnterpriseId({ path: { enterpriseId: enterpriseId! } });
      if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
      return toEnterprise(result.data);
    },
    enabled: !!enterpriseId,
    staleTime: 60_000,
  });
  const { data: companyJobs } = useQuery({
    queryKey: ["enterprise-jobs", enterpriseId],
    queryFn: async () => {
      const result = await getApiV1JobPostings({ query: { enterprise_id: enterpriseId!, limit: 100, page: 1, status: "published" } });
      if (result.error || !result.data) throw Object.assign(result.error ?? {}, { status: result.response?.status });
      const now = Date.now();
      const jobs = result.data.items
        .filter((item) => !item.expiresAt || new Date(item.expiresAt).getTime() >= now)
        .map(toJob);
      return jobs;
    },
    enabled: !!enterpriseId,
    staleTime: 60_000,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  if (isLoading) {
    return (
      <PageShell>
        <div className="flex flex-col gap-5 border-b border-mkt-line bg-white px-4 pb-8 pt-6 md:px-12">
          <div className="h-4 w-48 animate-pulse rounded bg-mkt-chip" />
          <div className="flex gap-5">
            <div className="size-[72px] animate-pulse rounded-2xl bg-mkt-chip" />
            <div className="flex flex-1 flex-col gap-3">
              <div className="h-8 w-2/3 animate-pulse rounded bg-mkt-chip" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-mkt-chip" />
            </div>
          </div>
        </div>
        <div className="mx-4 mt-8 h-64 animate-pulse rounded-2xl bg-mkt-chip md:mx-12" />
      </PageShell>
    );
  }

  if (isError && getErrorStatus(error) !== 404) {
    return (
      <PageShell>
        <div className="px-4 py-16 md:px-12">
          <StateCard
            description="Something went wrong on our side. Please try again."
            icon={
              <TriangleAlert
                aria-hidden="true"
                className="size-[26px] text-mkt-danger"
              />
            }
            iconBg="#fbe9e7"
            title="We couldn't load this job"
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
                to="/career"
              >
                Back to job list
              </Link>
            </div>
          </StateCard>
        </div>
      </PageShell>
    );
  }

  if (!job) {
    return (
      <PageShell>
        <div className="px-4 py-16 md:px-12">
          <StateCard
            description="It may have been filled, or its application deadline has passed."
            icon={
              <Briefcase
                aria-hidden="true"
                className="size-[26px] text-mkt-accent-hover"
              />
            }
            iconBg="#fde8e0"
            title="This job is no longer available"
          >
            <div className="flex flex-wrap justify-center gap-2.5">
              <Link
                className="flex h-10 items-center rounded-full bg-mkt-accent px-[18px] text-[13.5px] font-semibold text-white hover:bg-mkt-accent-hover"
                to="/career"
              >
                Browse jobs
              </Link>
              <Link
                className="flex h-10 items-center rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
                to="/enterprises"
              >
                Browse companies
              </Link>
            </div>
          </StateCard>
        </div>
      </PageShell>
    );
  }

  const companyName = company?.name;
  const palette = logoPalette(job.enterpriseId ?? companyName);
  const type = job.employment_type
    ? (EMPLOYMENT_LABELS[job.employment_type] ?? job.employment_type)
    : null;
  const level = job.level
    ? (LEVEL_LABELS[job.level.toLowerCase()] ?? job.level)
    : null;
  const posted = postedAgo(job.createdAt);
  const deadline = formatDeadline(job.expires_at);
  const remaining = daysLeft(job.expires_at);
  const hasSalary = Boolean(
    (job.salary_min && job.salary_min > 0) ||
    (job.salary_max && job.salary_max > 0),
  );
  const salaryText = formatSalaryCard(
    job.salary_min,
    job.salary_max,
    job.currency,
  );
  const salaryMatch = salaryText.match(
    /^(.*?)\s?((?:M )?(?:VND|[A-Z]{3}) \/ mo)$/,
  );
  const salaryBig =
    hasSalary && salaryMatch
      ? salaryMatch[1] + (salaryMatch[2].startsWith("M") ? "M" : "")
      : salaryText;
  const salaryUnit =
    hasSalary && salaryMatch
      ? salaryMatch[2].replace(/^M /, "").replace(" / mo", " / month")
      : null;

  const otherJobs = (companyJobs ?? [])
    .filter((j) => j._id !== job._id)
    .slice(0, 3);
  const companyJobCount = companyJobs?.length ?? 0;

  const keyFacts = [
    { l: "Job type", v: type },
    { l: "Level", v: level },
    { l: "City", v: job.location },
    {
      l: "Openings",
      v: typeof job.openings === "number" ? String(job.openings) : null,
    },
  ].filter((k): k is { l: string; v: string } => Boolean(k.v));

  const benefits = linesOf(job.benefits).map((l) => l.replace(/^[-*•]\s+/, ""));
  const about = [job.aboutTheRole, job.description].filter(Boolean).join("\n");

  return (
    <PageShell>
      <section className="flex flex-col gap-[22px] border-b border-mkt-line bg-white px-4 pb-8 pt-6 md:px-12">
        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 items-center gap-2 text-[13px] text-mkt-muted"
        >
          <Link
            className="flex shrink-0 items-center gap-1.5 font-semibold hover:text-mkt-ink"
            to="/career"
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to results
          </Link>
          <span className="text-mkt-check">/</span>
          <Link className="shrink-0 hover:text-mkt-ink" to="/career">
            Jobs
          </Link>
          <span className="text-mkt-check">/</span>
          <span className="min-w-0 truncate">{job.title}</span>
        </nav>

        <div className="flex items-start gap-5">
          <span
            aria-hidden="true"
            className="hidden size-[72px] shrink-0 items-center justify-center rounded-2xl font-['Space_Grotesk',sans-serif] text-[22px] font-bold sm:flex"
            style={{ background: palette.bg, color: palette.fg }}
          >
            {companyInitials(companyName)}
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <h1 className="m-0 font-['Space_Grotesk',sans-serif] text-[26px] font-semibold leading-[1.15] [overflow-wrap:anywhere] md:text-[32px]">
              {job.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-sm text-mkt-ink-2">
              {companyName && job.enterpriseId ? (
                <Link
                  className="font-semibold text-mkt-ink underline decoration-mkt-line-strong underline-offset-[3px] hover:text-mkt-accent-hover"
                  to={`/enterprises/${job.enterpriseId}`}
                >
                  {companyName}
                </Link>
              ) : null}
              {company?.industry ? (
                <>
                  <span className="text-mkt-subtle">·</span>
                  <span>{company.industry}</span>
                </>
              ) : null}
              {posted ? (
                <>
                  {companyName ? (
                    <span className="text-mkt-subtle">·</span>
                  ) : null}
                  <span>Posted {posted}</span>
                </>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {job.location ? (
                <Fact
                  icon={<MapPin aria-hidden="true" className="size-[15px]" />}
                >
                  {job.location}
                </Fact>
              ) : null}
              {type ? (
                <Fact
                  icon={<Clock aria-hidden="true" className="size-[15px]" />}
                >
                  {type}
                </Fact>
              ) : null}
              {level ? (
                <Fact
                  icon={
                    <TrendingUp aria-hidden="true" className="size-[15px]" />
                  }
                >
                  {level}
                </Fact>
              ) : null}
              {typeof job.openings === "number" ? (
                <Fact
                  icon={<Users aria-hidden="true" className="size-[15px]" />}
                >
                  {job.openings} opening{job.openings === 1 ? "" : "s"}
                </Fact>
              ) : null}
              {deadline ? (
                <Fact
                  icon={
                    <CalendarDays aria-hidden="true" className="size-[15px]" />
                  }
                >
                  Apply by {deadline}
                </Fact>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 items-start gap-6 px-4 pb-14 pt-8 md:px-12 lg:grid-cols-12">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
          {about ? (
            <section className={cardClass}>
              <h2 className={h2Class}>About the role</h2>
              <TextBlock text={about} />
            </section>
          ) : null}

          {job.requirements ? (
            <section className={cardClass}>
              <h2 className={h2Class}>Requirements</h2>
              <TextBlock text={job.requirements} />
            </section>
          ) : null}

          {benefits.length > 0 ? (
            <section className={cardClass}>
              <h2 className={h2Class}>Benefits</h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {benefits.map((b, i) => (
                  <div
                    className="flex items-start gap-2.5 text-sm leading-[1.5] text-mkt-ink-2"
                    key={i}
                  >
                    <CircleCheck
                      aria-hidden="true"
                      className="mt-px size-[18px] shrink-0 text-mkt-green-fg"
                    />
                    <span>{b}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {job.location ? (
            <section className={`${cardClass} gap-3`}>
              <h2 className={h2Class}>Where you'll work</h2>
              <div className="flex items-start gap-3 text-sm text-mkt-ink-2">
                <MapPin
                  aria-hidden="true"
                  className="mt-px size-[18px] shrink-0 text-mkt-muted"
                />
                <span className="font-semibold text-mkt-ink">
                  {job.location}
                </span>
              </div>
            </section>
          ) : null}
        </div>

        <aside className="flex min-w-0 flex-col gap-4 lg:col-span-4">
          <section
            aria-label="Apply"
            className="flex flex-col gap-[18px] rounded-2xl border border-mkt-line bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.07)]"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[11.5px] font-bold tracking-[0.05em] text-mkt-label">
                SALARY
              </span>
              <span className="font-['Space_Grotesk',sans-serif] text-[26px] font-bold">
                {salaryBig}
                {salaryUnit ? (
                  <span className="ml-1 text-[15px] font-semibold text-mkt-muted">
                    {salaryUnit}
                  </span>
                ) : null}
              </span>
            </div>

            {keyFacts.length > 0 ? (
              <dl className="m-0 grid grid-cols-2 gap-x-3 gap-y-3.5">
                {keyFacts.map((k) => (
                  <div className="flex flex-col gap-0.5" key={k.l}>
                    <dt className="text-xs text-mkt-muted">{k.l}</dt>
                    <dd className="m-0 text-[13.5px] font-semibold">{k.v}</dd>
                  </div>
                ))}
              </dl>
            ) : null}

            {deadline && remaining !== null ? (
              <div className="flex items-center gap-2 rounded-xl border border-mkt-amber-border bg-mkt-amber-bg px-3 py-2.5 text-[13px] text-mkt-amber-fg">
                <Clock aria-hidden="true" className="size-4 shrink-0" />
                {remaining > 0
                  ? `Applications close in ${remaining} day${remaining === 1 ? "" : "s"} · ${deadline}`
                  : `Applications closed · ${deadline}`}
              </div>
            ) : null}

            <div className="flex flex-col gap-2.5">
              {session ? (
                <ApplyButton
                  companyName={companyName}
                  deadline={job.expires_at}
                  jobId={job._id}
                  jobTitle={job.title}
                />
              ) : (
                <>
                  <button
                    className="flex h-[46px] items-center justify-center gap-2 rounded-full bg-mkt-accent text-[14.5px] font-semibold text-white hover:bg-mkt-accent-hover"
                    onClick={() => navigate("/login")}
                    type="button"
                  >
                    <Lock aria-hidden="true" className="size-4" />
                    Sign in to apply
                  </button>
                  <Link
                    className="flex h-[46px] items-center justify-center rounded-full border border-mkt-line-strong text-[14.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
                    to="/register"
                  >
                    Create an account
                  </Link>
                  <p className="m-0 text-center text-[12.5px] leading-normal text-mkt-muted">
                    You need to sign in to apply for this position.
                  </p>
                </>
              )}
            </div>
          </section>

          {company ? (
            <section
              aria-label="Company"
              className="flex flex-col gap-4 rounded-2xl border border-mkt-line bg-white p-6"
            >
              <div className="flex items-center gap-3.5">
                <span
                  aria-hidden="true"
                  className="flex size-[52px] shrink-0 items-center justify-center rounded-xl font-['Space_Grotesk',sans-serif] text-[17px] font-bold"
                  style={{ background: palette.bg, color: palette.fg }}
                >
                  {companyInitials(company.name)}
                </span>
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-['Space_Grotesk',sans-serif] text-[17px] font-semibold">
                    {company.name}
                  </span>
                  {company.industry ? (
                    <span className="text-[12.5px] text-mkt-muted">
                      {company.industry}
                    </span>
                  ) : null}
                </div>
              </div>
              {company.shortDescription ? (
                <p className="m-0 text-[13.5px] leading-[1.55] text-mkt-ink-2">
                  {company.shortDescription}
                </p>
              ) : null}
              <div className="flex items-center gap-2.5">
                {companyJobCount > 0 ? (
                  <span className="flex h-6 items-center rounded-full bg-mkt-green-bg px-2.5 text-xs font-semibold text-mkt-green-fg">
                    {companyJobCount} open job{companyJobCount === 1 ? "" : "s"}
                  </span>
                ) : null}
                <div className="flex-1" />
                <Link
                  className="text-[13px] font-semibold hover:text-mkt-accent-hover"
                  to={`/enterprises/${company.id}`}
                >
                  View company →
                </Link>
              </div>
            </section>
          ) : null}
        </aside>
      </div>

      {company && otherJobs.length > 0 ? (
        <section className="flex flex-col gap-5 px-4 pb-[72px] md:px-12">
          <div className="flex items-end">
            <h2 className="m-0 font-['Space_Grotesk',sans-serif] text-2xl font-semibold">
              More jobs at {company.name}
            </h2>
            <div className="flex-1" />
            <Link
              className="text-[13.5px] font-semibold hover:text-mkt-accent-hover"
              to={`/enterprises/${company.id}`}
            >
              View all {companyJobCount} jobs →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {otherJobs.map((j) => {
              const meta = [
                j.location,
                j.employment_type
                  ? (EMPLOYMENT_LABELS[j.employment_type] ?? j.employment_type)
                  : null,
                j.level
                  ? (LEVEL_LABELS[j.level.toLowerCase()] ?? j.level)
                  : null,
              ]
                .filter(Boolean)
                .join(" · ");
              const jd = formatDeadline(j.expires_at);
              return (
                <Link
                  className="flex flex-col gap-2.5 rounded-2xl border border-mkt-line bg-white p-5 text-mkt-ink hover:border-mkt-line-strong"
                  key={j._id}
                  to={`/career/${j.slug}`}
                >
                  <span className="font-['Space_Grotesk',sans-serif] text-[17px] font-semibold">
                    {j.title}
                  </span>
                  <span className="text-[13px] text-mkt-ink-2">{meta}</span>
                  <div className="flex items-center border-t border-mkt-line-soft pt-2.5">
                    <span className="text-[13.5px] font-semibold">
                      {formatSalaryCard(j.salary_min, j.salary_max, j.currency)}
                    </span>
                    <div className="flex-1" />
                    {jd ? (
                      <span className="text-xs text-mkt-subtle">
                        Apply by {jd}
                      </span>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}
    </PageShell>
  );
}