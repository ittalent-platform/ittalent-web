import { ArrowRight, RefreshCw } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { DetailRow } from "@/components/common/detail-row";
import { RailCard } from "@/components/common/rail-card";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { JobPostingHistoryDialog } from "./job-posting-dialogs";
import { JobPostingErrorState } from "./job-posting-error-state";
import { JobPostingStatusBadge } from "./job-posting-status-badge";
import { JOB_POSTINGS_PATH } from "./job-postings.constants";
import {
  formatDeadline,
  formatJobDateTime,
  formatPostedDate,
  formatSalary,
  jobDisplayId,
} from "./job-postings.format";
import { useJobPosting, useJobPostingHistory } from "./job-postings.queries";

function ContentSection({ label, text }: { label: string; text?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-2">
      <h2 className="eyebrow">{label}</h2>
      <p
        className={
          text
            ? "m-0 whitespace-pre-wrap text-[14px] leading-relaxed text-foreground"
            : "m-0 text-[14px] text-muted-foreground"
        }
      >
        {text || t("jobPostings.detail.notAddedYet")}
      </p>
    </div>
  );
}

function ActivityRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-[13.5px]">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="flex min-w-0 flex-col items-end text-right">{children}</span>
    </div>
  );
}

/** Enterprise admin view of one job posting (UC-S2-JOB-04@EntAdmin): read-only, no lifecycle or application actions. */
export function JobPostingReadOnlyDetailPage() {
  const { t, i18n } = useTranslation();
  const { jobPostingId } = useParams<{ jobPostingId: string }>();
  const { showToast } = useToast();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const query = useJobPosting(jobPostingId);
  const history = useJobPostingHistory(jobPostingId);

  if (query.isPending) {
    return (
      <div aria-busy="true" className="space-y-5">
        <Skeleton className="h-5 w-48 rounded" />
        <Skeleton className="h-14 w-96 rounded-2xl" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Skeleton className="h-96 rounded-xl" />
          <Skeleton className="h-96 rounded-xl" />
        </div>
      </div>
    );
  }

  if (query.isError || !query.data)
    return <JobPostingErrorState backTo={JOB_POSTINGS_PATH} error={query.error} />;

  const posting = query.data;
  const count = posting.applicationCount ?? 0;
  const isOpen = posting.recruitmentStatus === "open";
  const deadlinePassed =
    !!posting.expiresAt && new Date(posting.expiresAt).getTime() < now;
  const dateTime = (value: string) => formatJobDateTime(value, i18n.language);
  const yesNo = (value: boolean) =>
    t(value ? "jobPostings.enterpriseAdmin.yes" : "jobPostings.enterpriseAdmin.no");
  const events = history.data?.items ?? [];
  // History is newest first, so the last publish event in the page is the first publish.
  const firstPublishedAt =
    events.findLast((event) => event.action === "publish")?.occurredAt ??
    posting.publishedAt;
  const lastChange = events[0];
  const salary = formatSalary(posting);

  const meta = [
    jobDisplayId(posting.id),
    posting.publishedAt
      ? t("jobPostings.detail.metaPosted", { date: formatPostedDate(posting.publishedAt) })
      : t("jobPostings.detail.metaCreated", { date: formatPostedDate(posting.createdAt) }),
    posting.status === "draft"
      ? t("jobPostings.enterpriseAdmin.notPublished")
      : posting.status === "closed" && posting.closedAt
        ? t("jobPostings.enterpriseAdmin.metaClosed", { date: formatPostedDate(posting.closedAt) })
        : posting.status === "archived" && posting.archivedAt
          ? t("jobPostings.enterpriseAdmin.metaArchived", { date: formatPostedDate(posting.archivedAt) })
          : t("jobPostings.enterpriseAdmin.metaUpdated", { date: formatPostedDate(posting.updatedAt) }),
  ].join(" · ");

  const notice =
    posting.status === "draft"
      ? t("jobPostings.enterpriseAdmin.notices.draft", { company: posting.enterprise.name })
      : posting.status === "closed"
        ? t("jobPostings.enterpriseAdmin.notices.closed")
        : posting.status === "archived"
          ? t("jobPostings.enterpriseAdmin.notices.archived")
          : deadlinePassed && posting.expiresAt
            ? t("jobPostings.enterpriseAdmin.notices.deadlinePassed", {
                date: formatDeadline(posting.expiresAt),
              })
            : null;

  async function refresh() {
    const [detail] = await Promise.all([query.refetch(), history.refetch()]);
    if (!detail.isError)
      showToast({
        title: t("jobPostings.enterpriseAdmin.refreshedTitle"),
        message: t("jobPostings.enterpriseAdmin.refreshedMessage"),
        tone: "success",
      });
  }

  return (
    <div className="space-y-5">
      <Breadcrumb
        ariaLabel={t("jobPostings.title")}
        items={[{ label: t("jobPostings.title"), to: JOB_POSTINGS_PATH }, { label: posting.title }]}
      />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="itt-display text-2xl font-bold tracking-tight text-foreground sm:text-[26px]">
              {posting.title}
            </h1>
            <JobPostingStatusBadge mode="publication" posting={posting} />
          </div>
          <p className="m-0 text-[13.5px] text-muted-foreground">{meta}</p>
        </div>
        <Button
          className="h-10 px-4.5 text-[13.5px] font-semibold"
          disabled={query.isFetching}
          onClick={() => void refresh()}
          shape="pill"
          type="button"
          variant="outline"
        >
          <RefreshCw className="size-3.5" />
          {t("jobPostings.enterpriseAdmin.refresh")}
        </Button>
      </div>

      {notice ? (
        <div
          className="rounded-lg border border-border bg-(--canvas) p-3 px-4 text-[13.5px] leading-relaxed text-muted-foreground"
          role="status"
        >
          {notice}
        </div>
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="flex flex-col gap-6 surface-card p-6">
          <ContentSection label={t("jobPostings.detail.descriptionSection")} text={posting.description} />
          <ContentSection label={t("jobPostings.detail.requirementsSection")} text={posting.requirements} />
          <ContentSection label={t("jobPostings.detail.benefitsSection")} text={posting.benefits} />
        </section>

        <aside className="flex flex-col gap-4">
          <RailCard title={t("jobPostings.detail.statusCard")}>
            <div>
              <DetailRow
                bordered={false}
                label={t("jobPostings.status")}
                value={<JobPostingStatusBadge mode="publication" posting={posting} />}
              />
              <DetailRow
                bordered={false}
                label={t("jobPostings.enterpriseAdmin.acceptingApplications")}
                value={yesNo(isOpen)}
              />
              <DetailRow
                bordered={false}
                label={t("jobPostings.detail.deadline")}
                value={
                  posting.expiresAt ? (
                    <span className="flex flex-col sm:items-end">
                      <span className={deadlinePassed ? "font-semibold text-destructive" : undefined}>
                        {formatDeadline(posting.expiresAt)}
                      </span>
                      {deadlinePassed ? (
                        <span className="text-[12px] font-normal text-muted-foreground">
                          {t("jobPostings.actions.deadlinePassed")}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    t("jobPostings.detail.notSet")
                  )
                }
              />
              <DetailRow
                bordered={false}
                label={t("jobPostings.enterpriseAdmin.visibleToCandidates")}
                value={yesNo(isOpen)}
              />
            </div>
          </RailCard>

          <RailCard title={t("jobPostings.detail.detailsSection")}>
            <div>
              <DetailRow
                bordered={false}
                label={t("jobPostings.detail.salary")}
                value={
                  posting.salaryNegotiable
                    ? t("jobPostings.salaryNegotiable")
                    : salary === "—"
                      ? t("jobPostings.notSpecified")
                      : salary
                }
              />
              <DetailRow bordered={false} label={t("jobPostings.detail.level")} value={posting.level || t("jobPostings.notSpecified")} />
              <DetailRow
                bordered={false}
                label={t("jobPostings.detail.type")}
                value={
                  posting.employmentType
                    ? t(`jobPostings.employmentTypes.${posting.employmentType}`, { defaultValue: posting.employmentType })
                    : t("jobPostings.notSpecified")
                }
              />
              <DetailRow bordered={false} label={t("jobPostings.detail.location")} value={posting.location || t("jobPostings.notSpecified")} />
              <DetailRow bordered={false} label={t("jobPostings.detail.openings")} value={posting.openings ?? t("jobPostings.notSpecified")} />
            </div>
          </RailCard>

          <section
            aria-label={t("jobPostings.applications")}
            className="flex flex-col gap-1 rounded-xl bg-sidebar p-5 text-sidebar-foreground"
          >
            <h2 className="text-[11.5px] font-bold tracking-[0.05em] text-white/55 uppercase">
              {t("jobPostings.applications")}
            </h2>
            <span className="itt-display mt-1 text-4xl leading-none font-bold tracking-tight text-white">
              {count}
            </span>
            {count === 0 ? (
              <span className="mt-1 text-[12.5px] text-white/55">{t("jobPostings.detail.noApplicationsYet")}</span>
            ) : null}
          </section>

          <RailCard ariaLabel={t("jobPostings.enterpriseAdmin.activity")} title={t("jobPostings.enterpriseAdmin.activity")}>
            <div>
              <ActivityRow label={t("jobPostings.detail.created")}>
                <span className="font-medium text-foreground">{dateTime(posting.createdAt)}</span>
              </ActivityRow>
              <ActivityRow label={t("jobPostings.enterpriseAdmin.firstPublished")}>
                {firstPublishedAt ? (
                  <span className="font-medium text-foreground">{dateTime(firstPublishedAt)}</span>
                ) : (
                  <span className="text-muted-foreground">{t("jobPostings.enterpriseAdmin.notPublished")}</span>
                )}
              </ActivityRow>
              <ActivityRow label={t("jobPostings.enterpriseAdmin.lastChange")}>
                {lastChange ? (
                  <>
                    <span className="font-semibold text-foreground">
                      {t(`jobPostings.history.actions.${lastChange.action}`, { defaultValue: lastChange.action })}
                    </span>
                    <span className="text-[12.5px] text-muted-foreground">{dateTime(lastChange.occurredAt)}</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">{t("jobPostings.enterpriseAdmin.notRecorded")}</span>
                )}
              </ActivityRow>
            </div>
            <button
              className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-[13px] font-bold text-primary hover:underline"
              onClick={() => setHistoryOpen(true)}
              type="button"
            >
              {t("jobPostings.enterpriseAdmin.viewHistory")}
              <ArrowRight className="size-3.5" />
            </button>
          </RailCard>
        </aside>
      </div>

      <JobPostingHistoryDialog
        history={history.data}
        onOpenChange={setHistoryOpen}
        open={historyOpen}
        posting={posting}
      />
    </div>
  );
}
