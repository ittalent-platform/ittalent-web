import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { ErrorState } from "@/components/common/error-state";

import {
  EMPLOYMENT_LABELS,
  formatDeadline,
  formatSalaryCard,
  LEVEL_LABELS,
  postedAgo,
} from "@/features/public-site/career/career-format";
import { CompanyMark } from "./company-mark";
import {
  CAREER_PATH,
  ENTERPRISES_PATH,
  SKELETON_CARD_COUNT,
} from "./home.constants";
import { useHomeData, type HomeJob } from "./home.queries";

const chip =
  "flex h-6 items-center rounded-full bg-mkt-chip px-2.5 text-[12px] font-semibold text-mkt-ink-2";

function JobCard({ job }: { job: HomeJob }) {
  const { t } = useTranslation();
  const deadline = formatDeadline(job.expiresAt);
  const type = job.employmentType
    ? (EMPLOYMENT_LABELS[job.employmentType.toLowerCase()] ??
      job.employmentType)
    : null;
  const level = job.level ? (LEVEL_LABELS[job.level] ?? job.level) : null;
  const meta = [
    postedAgo(job.createdAt),
    deadline ? t("home.latest.applyBy", { date: deadline }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="flex flex-col gap-3.5 rounded-2xl border border-mkt-line bg-white p-[22px]">
      <div className="flex items-center gap-3">
        <CompanyMark
          className="size-11 rounded-xl text-[15px]"
          name={job.companyName}
          seed={job.enterpriseId}
        />
        <span className="flex grow flex-col gap-0.5">
          <Link
            className="text-[13.5px] font-semibold text-mkt-ink hover:text-mkt-accent-hover"
            to={`${ENTERPRISES_PATH}/${job.enterpriseId}`}
          >
            {job.companyName}
          </Link>
          <span className="text-[12.5px] text-mkt-muted">
            {job.location ?? t("home.latest.anywhere")}
          </span>
        </span>
      </div>
      <Link
        className="itt-display text-[18px] font-semibold leading-[1.3] text-mkt-ink hover:text-mkt-accent-hover"
        to={`${CAREER_PATH}/${job.slug || job.id}`}
      >
        {job.title}
      </Link>
      <div className="flex flex-wrap gap-1.5">
        {type ? <span className={chip}>{type}</span> : null}
        {level ? <span className={chip}>{level}</span> : null}
      </div>
      <div className="grow" />
      <div className="flex items-center gap-2.5 border-t border-mkt-line-soft pt-3.5">
        <span className="text-sm font-semibold">
          {formatSalaryCard(job.salaryMin, job.salaryMax, job.currency)}
        </span>
        <div className="flex-1" />
        <span className="text-right text-[12px] text-mkt-subtle">{meta}</span>
      </div>
    </article>
  );
}

export function HomeLatestJobs() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useHomeData();
  const jobs = data?.latestJobs ?? [];

  return (
    <section className="flex flex-col gap-7 border-y border-mkt-line bg-mkt-canvas px-4 py-[72px] md:px-12">
      <div className="flex items-end gap-6">
        <div className="flex flex-col gap-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-mkt-accent-hover">
            {t("home.latest.eyebrow")}
          </span>
          <h2 className="itt-display text-[28px] font-semibold md:text-4xl">
            {t("home.latest.title")}
          </h2>
        </div>
        <div className="flex-1" />
        <Link
          className="flex h-10 shrink-0 items-center gap-2 rounded-full border border-mkt-line-strong bg-white px-[18px] text-[13.5px] font-semibold text-mkt-ink hover:bg-mkt-chip"
          to={CAREER_PATH}
        >
          {t("home.latest.viewAll")}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>

      {isLoading ? (
        <div
          aria-busy="true"
          className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
            <div
              className="h-[210px] animate-pulse rounded-2xl border border-mkt-line bg-white"
              key={index}
            />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          description={t("home.latest.error")}
          onRetry={() => void refetch()}
        />
      ) : jobs.length === 0 ? (
        <p className="rounded-2xl border border-mkt-line bg-white py-12 text-center text-mkt-ink-2">
          {t("home.latest.empty")}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => (
            <JobCard job={job} key={job.id} />
          ))}
        </div>
      )}
    </section>
  );
}
