import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ExternalLink, FileText } from "lucide-react";

import { Breadcrumb } from "@/components/common/breadcrumb";
import { Callout } from "@/components/common/callout";
import { DetailRow } from "@/components/common/detail-row";
import { DocumentTypeBadge } from "@/components/common/document-chip";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { LogoTile } from "@/components/common/logo-tile";
import { RailCard } from "@/components/common/rail-card";
import { Stepper } from "@/components/common/stepper";
import { Timeline, type TimelineEntry } from "@/components/common/timeline";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ApplicationStatusBadge } from "./application-status-badge";
import { applicationDisplayId, formatDate, formatDateTime, jobFacts } from "./application-formatters";
import { APPLICATIONS_PATH, ATTACHMENT_KIND, HTTP_BAD_REQUEST, HTTP_NOT_FOUND, NEXT_STEP_TEXT, PIPELINE_STEPS, TIMELINE_TONES } from "./applications.constants";
import { jobPath } from "@/config/routes";
import { requestStatus, useApplication, useApplicationHistory } from "./applications.queries";
import { WithdrawApplicationsDialog } from "./withdraw-applications-dialog";

const PAGE = "mx-auto flex w-full max-w-[1264px] flex-col gap-5 px-4 pb-12 pt-8 sm:px-6";
const CARD = "rounded-2xl border border-border bg-card";

/** UC-MYAPP-02 / 03: one owned application with its progress, documents and status history. */
export function ApplicationDetailPage() {
  const { id = "" } = useParams();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const detail = useApplication(id);
  const history = useApplicationHistory(id);
  const application = detail.data;
  const locale = i18n.language;

  const isReapplication = Boolean(application?.reappliedFrom);
  // BR-APP-008: linked records are read-only context; each keeps its own history.
  const earlier = useApplication(application?.reappliedFrom ?? "");
  const later = useApplication(application?.reappliedAs ?? "");

  const entries = useMemo<TimelineEntry[]>(
    () => (history.data?.items ?? []).map((event, index) => ({
      atIso: event.occurredAt,
      by: t(`applications.actor.${event.actorRole}`),
      // A reapplication starts its own history with "Submitted · applied again".
      label: index === 0 && isReapplication ? t("applications.history.submittedAgain") : t(`applications.history.${event.status}`),
      tone: TIMELINE_TONES[event.status],
    })).reverse(),
    [history.data, isReapplication, t],
  );

  if (detail.isPending) {
    return <main aria-busy="true" className={PAGE}><Skeleton className="h-6 w-56" /><Skeleton className="h-44 w-full rounded-2xl" /><Skeleton className="h-64 w-full rounded-2xl" /></main>;
  }
  if (detail.isError || !application) {
    const status = requestStatus(detail.error);
    const missing = status === HTTP_NOT_FOUND || status === HTTP_BAD_REQUEST;
    return (
      <main className={PAGE}>
        {missing
          ? <div className={CARD}><EmptyState action={{ label: t("applications.back"), onClick: () => navigate(APPLICATIONS_PATH), variant: "outline" }} description={t(status === HTTP_BAD_REQUEST ? "applications.invalidLinkDescription" : "applications.notFoundDescription")} icon={FileText} title={t(status === HTTP_BAD_REQUEST ? "applications.invalidLink" : "applications.notFound")} /></div>
          : <ErrorState description={t("applications.loadErrorHint")} onRetry={() => void detail.refetch()} secondaryAction={{ label: t("applications.back"), onClick: () => navigate(APPLICATIONS_PATH) }} title={t("applications.loadErrorTitle")} />}
      </main>
    );
  }

  const displayId = applicationDisplayId(application.id);
  const stepIndex = PIPELINE_STEPS.indexOf(application.status);
  const isWithdrawn = application.status === "withdrawn";

  return (
    <main className={PAGE}>
      <div className="flex items-center gap-3">
        <Breadcrumb ariaLabel={t("applications.breadcrumb")} items={[{ label: t("applications.title"), to: APPLICATIONS_PATH }, { label: displayId, mono: true }]} />
        <Button asChild className="h-10 gap-2 px-[18px] text-sm font-semibold" shape="pill" variant="outline"><Link to={jobPath(application.jobId)}><ExternalLink aria-hidden />{t("applications.viewJob")}</Link></Button>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <section className={`${CARD} flex flex-col gap-[18px] p-6`}>
            <div className="flex items-center gap-4">
              <LogoTile name={application.job.companyName} size="lg" />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <h1 className="itt-display m-0 text-2xl font-semibold leading-tight">{application.job.title}</h1>
                <span className="text-[13.5px] text-foreground/80"><span className="font-semibold text-fg-link">{application.job.companyName}</span>{jobFacts(application.job) ? ` · ${jobFacts(application.job)}` : ""}</span>
              </div>
              <ApplicationStatusBadge size="md" status={application.status} />
            </div>
            {stepIndex >= 0 ? <Stepper ariaLabel={t("applications.progress")} currentIndex={stepIndex} steps={PIPELINE_STEPS.map((step) => t(`applications.status.${step}`))} /> : null}
          </section>

          {application.reappliedFrom ? (
            <Callout title={t("applications.reapply.secondTitle")} tone="info">
              {t("applications.reapply.earlierWithdrawn", { date: earlier.data?.withdrawnAt ? formatDate(earlier.data.withdrawnAt, locale) : "…" })}{" "}
              <Link className="font-semibold underline" to={`${APPLICATIONS_PATH}/${application.reappliedFrom}`}>{t("applications.reapply.openEarlier", { id: applicationDisplayId(application.reappliedFrom) })}</Link>
            </Callout>
          ) : null}
          {application.reappliedAs ? (
            <Callout title={t("applications.reapply.appliedAgainTitle", { date: later.data ? formatDate(later.data.submittedAt, locale) : "…" })} tone="info">
              <Link className="font-semibold underline" to={`${APPLICATIONS_PATH}/${application.reappliedAs}`}>{t("applications.reapply.openLater", { id: applicationDisplayId(application.reappliedAs) })}</Link>
            </Callout>
          ) : null}

          {isWithdrawn && application.withdrawnAt ? (
            <Callout title={t("applications.withdrawnOn", { date: formatDate(application.withdrawnAt, locale) })}>
              {application.withdrawalReason ? <p className="m-0">{t("applications.withdrawnReason", { reason: application.withdrawalReason })}</p> : null}
            </Callout>
          ) : null}

          <section className={`${CARD} p-6`}>
            <h2 className="itt-display m-0 mb-2 text-[19px] font-semibold">{t("applications.detailsTitle")}</h2>
            <dl className="m-0">
              <DetailRow label={t("applications.reference")} layout="grid" value={<span className="itt-mono">{displayId}</span>} />
              <DetailRow label={t("applications.submitted")} layout="grid" value={formatDateTime(application.submittedAt, locale)} />
              <DetailRow label={t("applications.lastUpdate")} layout="grid" value={formatDate(application.latestStatusAt, locale)} />
              {application.reviewStage ? <DetailRow label={t("applications.stageLabel")} layout="grid" value={t(`applications.stage.${application.reviewStage}`)} /> : null}
              <DetailRow
                label={t("applications.documents")}
                layout="grid"
                value={application.attachments.length ? (
                  <span className="flex flex-wrap gap-2">
                    {application.attachments.map((file) => (
                      <span className="inline-flex h-8 items-center gap-2 rounded-xl border border-border px-2.5 text-[13px]" key={file.documentId}>
                        <DocumentTypeBadge kind={ATTACHMENT_KIND[file.type] ?? "cv"} label={file.type === "cv" ? t("applications.attachmentShort.cv") : t("applications.attachmentShort.cover_letter")} />
                        {file.fileName}
                      </span>
                    ))}
                  </span>
                ) : <span className="text-muted-foreground">{t("applications.noDocuments")}</span>}
              />
              <DetailRow label={t("applications.jobDetails")} layout="grid" value={t("applications.jobSnapshotDescription")} />
            </dl>
          </section>
        </div>

        <aside className="flex min-w-0 flex-col gap-4">
          <RailCard title={t("applications.nextStep")}>
            <p className={`m-0 text-[14.5px] font-semibold leading-normal ${NEXT_STEP_TEXT[application.status] ?? "text-foreground"}`}>{t(`applications.next.${application.status}`)}</p>
            {application.canApplyAgain ? (
              <div className="flex flex-col gap-2 border-t border-line-muted pt-3">
                <Button asChild className="h-10 px-[18px] text-sm font-semibold" shape="pill"><Link to={jobPath(application.jobId)}>{t("applications.applyAgain")}</Link></Button>
                <span className="text-xs leading-normal text-slate-subtle">{t("applications.applyAgainRule")}</span>
              </div>
            ) : null}
            {application.canWithdraw ? (
              <div className="flex flex-col gap-2 border-t border-line-muted pt-3">
                <Button className="h-10 px-[18px] text-sm font-semibold" onClick={() => setWithdrawOpen(true)} shape="pill" variant="destructive-outline">{t("applications.withdraw")}</Button>
                <span className="text-xs leading-normal text-slate-subtle">{t("applications.withdrawRule")}</span>
              </div>
            ) : null}
          </RailCard>

          {history.isPending ? <Skeleton className="h-40 w-full rounded-2xl" /> : history.isError
            ? <Callout role="alert" title={t("applications.historyError")} tone="error"><Button className="mt-1 h-auto p-0 text-[13px] font-semibold" onClick={() => void history.refetch()} variant="link">{t("actions.retry")}</Button></Callout>
            : entries.length ? <Timeline entries={entries} formatDate={(iso) => formatDateTime(iso, locale)} title={t("applications.history.title")} />
            : <RailCard title={t("applications.history.title")}><p className="m-0 text-[13px] text-muted-foreground">{t("applications.noHistory")}</p></RailCard>}
        </aside>
      </div>

      <WithdrawApplicationsDialog
        onOpenChange={() => setWithdrawOpen(false)}
        targets={withdrawOpen ? [{ id: application.id, jobTitle: application.job.title, companyName: application.job.companyName, version: application.version, isReapplication }] : []}
      />
    </main>
  );
}
