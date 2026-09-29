import { useEffect } from "react";
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  ShieldCheck,
  TriangleAlert,
  Users,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";

import { useSession } from "@/auth/use-session";
import { ErrorState } from "@/components/common/error-state";
import { getErrorStatus } from "@/lib/api-errors";

import { ApplyButton } from "./apply-button";
import { fetchJob, type Job } from "./career.api";
import {
  DetailRow,
  DetailTextBlock,
  PhoneFallback,
} from "./career-detail-blocks";
import {
  EMPLOYMENT_LABELS,
  formatDateDMY,
  formatSalaryRange,
  LEVEL_LABELS,
  timeAgo,
} from "./career-format";

export function CareerJobPage() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const { data: session } = useSession();

  const { data, error, isError, isLoading, refetch } = useQuery({
    queryKey: ["job", slug],
    queryFn: () => fetchJob(slug!),
    enabled: !!slug,
  });

  const job: Job | undefined = data;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [slug]);

  // Field mapping note: "department", "managing_unit", "address",
  // and "contact_*" are shown in this UI but are not yet part of the `Job`
  // type/schema. Each section hides itself gracefully when the field is
  // missing, so nothing breaks — add these fields on the backend/type to
  // populate them fully.
  const anyJob = job as
    | (Job & {
        department?: string;
        managing_unit?: string;
        address?: string;
        contact_name?: string;
        contact_role?: string;
        contact_email?: string;
        contact_phone?: string;
      })
    | undefined;

  if (isLoading) {
    return (
      <main className="mx-auto max-w-[1320px] px-8 pb-12 pt-10">
        <div className="mb-7 h-5 w-32 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="h-10 w-2/3 animate-pulse rounded bg-[var(--surface-2)]" />
        <div className="mt-6 h-40 animate-pulse rounded-[16px] bg-[var(--surface-2)]" />
      </main>
    );
  }

  if (isError && getErrorStatus(error) !== 404) {
    return (
      <main className="mx-auto max-w-[1320px] px-8 py-20">
        <ErrorState
          description="Could not load this job. Please try again."
          icon={TriangleAlert}
          onRetry={() => refetch()}
          secondaryAction={{
            label: "Back to job list",
            onClick: () => navigate("/career"),
          }}
          title="Could not load job"
        />
      </main>
    );
  }

  if (!anyJob) {
    return (
      <main className="mx-auto flex max-w-[1320px] flex-col items-center gap-4 px-8 py-20 text-center">
        <Briefcase className="size-10 text-[var(--fg-subtle)]" />
        <p className="font-medium text-[var(--fg-muted)]">Job not found.</p>
        <button
          className="h-11 rounded-full border border-[var(--border-strong)] bg-transparent px-6 text-[14px] font-semibold text-[var(--fg)]"
          type="button"
          onClick={() => navigate("/career")}
        >
          Back to job list
        </button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1320px] px-8 pb-12 pt-10">
      <button
        className="mb-7 inline-flex items-center gap-2 bg-transparent text-[13.5px] font-semibold text-[var(--fg-muted)]"
        onClick={() => navigate("/career")}
        type="button"
      >
        <ArrowLeft className="size-4" /> All positions
      </button>

      <div className="grid gap-10 xl:grid-cols-[1fr_340px] xl:items-start">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {anyJob.department && (
              <span className="itt-mono rounded-[6px] bg-[var(--primary-50)] px-2.5 py-1 text-[10.5px] font-bold uppercase tracking-[0.04em] text-[var(--primary)]">
                {anyJob.department}
              </span>
            )}
            {timeAgo(anyJob.createdAt) && (
              <span className="itt-mono text-[11.5px] text-[var(--fg-subtle)]">
                {timeAgo(anyJob.createdAt)}
              </span>
            )}
          </div>
          <h1 className="mb-4 text-[42px] font-bold leading-[1.05] tracking-[-0.025em] [overflow-wrap:anywhere]">
            {anyJob.title}
          </h1>
          <div className="mb-8 flex flex-wrap gap-x-6 gap-y-3 text-[14px] text-[var(--fg-muted)]">
            {anyJob.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="size-[17px]" />
                {anyJob.location}
              </span>
            )}
            {anyJob.employment_type && (
              <span className="flex items-center gap-1.5">
                <Clock3 className="size-[17px]" />
                {EMPLOYMENT_LABELS[anyJob.employment_type] ??
                  anyJob.employment_type}
              </span>
            )}
            {anyJob.level && (
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="size-[17px]" />
                {LEVEL_LABELS[anyJob.level] ?? anyJob.level}
              </span>
            )}
            {typeof anyJob.openings === "number" && (
              <span className="flex items-center gap-1.5">
                <Users className="size-[17px]" />
                {anyJob.openings} opening{anyJob.openings === 1 ? "" : "s"}
              </span>
            )}
          </div>

          {anyJob.aboutTheRole && (
            <>
              <h2 className="mb-3 text-[21px] font-semibold">About the role</h2>
              <div className="mb-9">
                <DetailTextBlock text={anyJob.aboutTheRole} />
              </div>
            </>
          )}

          {anyJob.description && (
            <>
              <h2 className="mb-5 text-[21px] font-semibold">
                Job description
              </h2>
              <div className="mb-10">
                <DetailTextBlock text={anyJob.description} />
              </div>
            </>
          )}

          {anyJob.requirements && (
            <>
              <h2 className="mb-5 text-[21px] font-semibold">Requirements</h2>
              <div className="mb-10">
                <DetailTextBlock text={anyJob.requirements} />
              </div>
            </>
          )}

          {anyJob.benefits && (
            <>
              <h2 className="mb-4 text-[21px] font-semibold">Benefits</h2>
              <ul className="mb-10 flex flex-col gap-3">
                {anyJob.benefits
                  .split("\n")
                  .map((l) => l.trim())
                  .filter(Boolean)
                  .map((line, i) => (
                    <li
                      className="flex items-start gap-3"
                      key={i} /* static list */
                    >
                      <CheckCircle2 className="mt-[3px] size-4 flex-shrink-0 text-[var(--primary)]" />
                      <span className="text-[14.5px] leading-[1.55] text-[var(--fg-muted)]">
                        {line.replace(/^[-*]\s+/, "")}
                      </span>
                    </li>
                  ))}
              </ul>
            </>
          )}

          {(anyJob.location || anyJob.address) && (
            <>
              <h2 className="mb-4 text-[21px] font-semibold">
                Where you'll work
              </h2>
              <div className="mb-10 flex items-start gap-3 rounded-[14px] border border-[var(--border)] bg-[var(--surface-2)] p-5">
                <MapPin className="mt-1 size-5 flex-shrink-0 text-[var(--primary)]" />
                <div>
                  {anyJob.location && (
                    <div className="mb-1 text-[14.5px] font-semibold">
                      {anyJob.location}
                    </div>
                  )}
                  {anyJob.address && (
                    <div className="text-[13.5px] text-[var(--fg-muted)]">
                      {anyJob.address}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {anyJob.contact_name && (
            <>
              <h2 className="mb-4 text-[21px] font-semibold">Contact</h2>
              <div className="mb-2 flex flex-wrap items-center gap-4 rounded-[14px] border border-[var(--border)] bg-[var(--surface)] p-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-50)] font-bold text-[var(--primary)]">
                  {anyJob.contact_name
                    .split(" ")
                    .slice(-2)
                    .map((s) => s[0])
                    .join("")
                    .toUpperCase()}
                </div>
                <div className="mr-auto">
                  <div className="text-[14.5px] font-semibold">
                    {anyJob.contact_name}
                  </div>
                  {anyJob.contact_role && (
                    <div className="text-[12.5px] text-[var(--fg-muted)]">
                      {anyJob.contact_role}
                    </div>
                  )}
                </div>
                {anyJob.contact_email && (
                  <a
                    className="flex items-center gap-2 text-[13.5px] no-underline"
                    href={`mailto:${anyJob.contact_email}`}
                  >
                    <Mail className="size-4 text-[var(--primary)]" />{" "}
                    {anyJob.contact_email}
                  </a>
                )}
                {anyJob.contact_phone && (
                  <a
                    className="itt-mono flex items-center gap-2 text-[13px] text-[var(--fg)]"
                    href={`tel:${anyJob.contact_phone}`}
                  >
                    <PhoneFallback /> {anyJob.contact_phone}
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        <aside className="rounded-[18px] border border-[var(--border)] bg-[var(--surface)] p-7 xl:sticky xl:top-[94px]">
          <div className="itt-mono mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-[var(--fg-subtle)]">
            Salary range
          </div>
          <div className="mb-7 text-[28px] font-bold tracking-[-0.02em]">
            {formatSalaryRange(
              anyJob.salary_min,
              anyJob.salary_max,
              anyJob.currency,
            )}
            {anyJob.salary_min || anyJob.salary_max ? (
              <span className="ml-1 text-[14px] font-medium text-[var(--fg-subtle)]">
                /mo
              </span>
            ) : null}
          </div>
          <div className="mb-6 flex flex-col gap-3 border-y border-[var(--border)] py-5 text-[13.5px]">
            <DetailRow label="Department" value={anyJob.department} />
            <DetailRow label="Location" value={anyJob.location} />
            <DetailRow
              label="Type"
              value={
                anyJob.employment_type
                  ? EMPLOYMENT_LABELS[anyJob.employment_type]
                  : undefined
              }
            />
            <DetailRow
              label="Level"
              value={anyJob.level ? LEVEL_LABELS[anyJob.level] : undefined}
            />
            <DetailRow label="Openings" value={anyJob.openings} />
            <DetailRow
              label="Apply by"
              value={formatDateDMY(anyJob.expires_at) ?? "—"}
            />
            <DetailRow label="Managing unit" value={anyJob.managing_unit} />
          </div>

          {session ? (
            <ApplyButton
              companyName={anyJob.managing_unit}
              deadline={anyJob.expires_at}
              jobTitle={anyJob.title}
              slug={slug!}
            />
          ) : (
            <>
              <button
                type="button"
                className="mb-3 h-12 w-full rounded-full bg-[var(--primary)] text-[15px] font-semibold text-white"
                onClick={() => navigate("/login")}
              >
                Sign in to apply
              </button>
              <p className="text-center text-[12px] text-[var(--fg-muted)]">
                You need to sign in to apply for this position.
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
