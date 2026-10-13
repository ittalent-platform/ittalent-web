import { CalendarDays, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { requestStatus } from "@/api/request-error";
import { Breadcrumb } from "@/components/common/breadcrumb";
import { Callout } from "@/components/common/callout";
import { DetailRow } from "@/components/common/detail-row";
import { EmptyState } from "@/components/common/empty-state";
import { ErrorState } from "@/components/common/error-state";
import { PersonAvatar } from "@/components/common/person-avatar";
import { RailCard } from "@/components/common/rail-card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { RECRUITER_INTERVIEWS_PATH } from "@/config/routes";

import { InterviewActionsMenu } from "./interview-actions-menu";
import { InterviewHistory } from "./interview-history";
import { InterviewModeBadge, InterviewStatusBadge } from "./interview-badges";
import { BAD_REQUEST_STATUS, FORBIDDEN_STATUS, INTERVIEW_TIME_ZONE_NAME, NOT_FOUND_STATUS, type InterviewDetail } from "./interviews.constants";
import { applicantName, formatDuration, formatFullDay, formatTimeRange, initialsName } from "./interviews.format";
import { useInterviewDetail } from "./interviews.queries";
import { useInterviewActions } from "./use-interview-actions";

const CARD_SURFACE = "overflow-hidden rounded-2xl border border-border bg-card";
const LINK_CLASS = "font-semibold text-fg-link underline-offset-2 hover:underline";

function DetailSkeleton() {
  return (
    <div aria-busy="true" className="flex flex-col gap-5">
      <Skeleton className="h-5 w-48 rounded" />
      <Skeleton className="h-14 w-96 max-w-full rounded-2xl" />
      <div className="grid gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );
}

/** What stands in for the page when the interview cannot be shown, one message per cause. */
function DetailError({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const status = requestStatus(error);
  const back = { label: t("interviews.detail.back"), onClick: () => navigate(RECRUITER_INTERVIEWS_PATH) };

  if (status === NOT_FOUND_STATUS || status === BAD_REQUEST_STATUS) {
    return (
      <div className={CARD_SURFACE}>
        <EmptyState action={{ ...back, variant: "outline" }} description={t("interviews.detail.unavailableDescription")} icon={CalendarDays} title={t("interviews.detail.unavailableTitle")} />
      </div>
    );
  }
  if (status === FORBIDDEN_STATUS) {
    return (
      <div className={CARD_SURFACE}>
        <EmptyState description={t("interviews.noAccess.description")} icon={Lock} title={t("interviews.noAccess.title")} />
      </div>
    );
  }
  return <ErrorState description={t("interviews.detail.loadFailed")} onRetry={onRetry} secondaryAction={back} title={t("interviews.detail.loadFailedTitle")} />;
}

function Info({ interview }: { interview: InterviewDetail }) {
  const { t, i18n } = useTranslation();
  const row = (label: string, value: ReactNode) => <DetailRow label={label} layout="grid" value={<span className="font-semibold">{value}</span>} />;

  return (
    <RailCard ariaLabel={t("interviews.detail.information")} title={t("interviews.detail.information")}>
      <dl className="m-0">
        {row(t("interviews.detail.date"), formatFullDay(interview.scheduledAt, i18n.language))}
        {row(
          t("interviews.detail.time"),
          <>
            {formatTimeRange(interview.scheduledAt, interview.endsAt, i18n.language)}{" "}
            <span className="font-normal text-muted-foreground">({INTERVIEW_TIME_ZONE_NAME})</span>
          </>,
        )}
        {row(t("interviews.detail.duration"), formatDuration(interview.durationMinutes, t))}
        <DetailRow label={t("interviews.detail.mode")} layout="grid" value={<InterviewModeBadge mode={interview.mode} />} />
        {interview.meetingLink ? (
          <DetailRow
            label={t("interviews.detail.link")}
            layout="grid"
            value={
              <a className={LINK_CLASS} href={interview.meetingLink} rel="noreferrer" target="_blank">
                {t("interviews.detail.openLink")}
              </a>
            }
          />
        ) : null}
        {interview.location ? row(t("interviews.detail.location"), interview.location) : null}
        <DetailRow
          label={t("interviews.detail.notes")}
          layout="grid"
          value={interview.notes ? <span className="whitespace-pre-wrap font-semibold">{interview.notes}</span> : <span className="text-muted-foreground">—</span>}
        />
      </dl>
    </RailCard>
  );
}

function Interviewers({ interviewers }: { interviewers: InterviewDetail["interviewers"] }) {
  const { t } = useTranslation();

  return (
    <RailCard ariaLabel={t("interviews.detail.interviewers")} meta={interviewers.length} title={t("interviews.detail.interviewers")}>
      <ul className="m-0 flex list-none flex-col p-0">
        {interviewers.map((person) => (
          <li className="flex min-w-0 items-center gap-3 border-t border-border/50 py-3 first:border-t-0 first:pt-0 last:pb-0" key={person.id}>
            <PersonAvatar className="size-8 text-[11px]" name={initialsName(person.fullName ?? person.email ?? "")} tone="peach" />
            <span className="min-w-0 truncate text-[14px] text-foreground">{person.email ?? person.fullName}</span>
          </li>
        ))}
      </ul>
    </RailCard>
  );
}

/** One interview of the company: when and where it takes place, who interviews and how its status changed. */
export function InterviewDetailPage() {
  const { t } = useTranslation();
  const { interviewId } = useParams<{ interviewId: string }>();
  const query = useInterviewDetail(interviewId);
  const navigate = useNavigate();
  const actions = useInterviewActions({ onDeleted: () => navigate(RECRUITER_INTERVIEWS_PATH, { replace: true }) });

  if (query.isPending) return <DetailSkeleton />;
  if (query.isError || !query.data) return <DetailError error={query.error} onRetry={() => void query.refetch()} />;

  const interview = query.data;
  const name = applicantName(interview.applicant);

  return (
    <div className="flex flex-col gap-5">
      <Breadcrumb ariaLabel={t("interviews.page.title")} items={[{ label: t("interviews.page.title"), to: RECRUITER_INTERVIEWS_PATH }, { label: name }]} />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3.5">
          <PersonAvatar className="size-12 text-lg" name={initialsName(name)} tone="peach" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="itt-display truncate text-2xl font-semibold leading-tight text-foreground">{name}</h1>
              <InterviewStatusBadge status={interview.status} />
            </div>
            <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">{interview.job.title ?? "—"}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          {interview.status === "scheduled" ? (
            interview.canComplete ? (
              <Button className="h-11 rounded-xl px-5 text-sm font-semibold" onClick={() => actions.run("complete", interview)} type="button" variant="success-solid">
                {t("interviews.actions.complete")}
              </Button>
            ) : (
              <>
                <Button className="h-11 rounded-xl px-5 text-sm font-semibold" onClick={() => actions.run("edit", interview)} type="button" variant="outline">
                  {t("interviews.actions.edit")}
                </Button>
                <Button className="h-11 rounded-xl px-5 text-sm font-semibold" onClick={() => actions.run("reschedule", interview)} type="button">
                  {t("interviews.actions.reschedule")}
                </Button>
              </>
            )
          ) : null}
          <InterviewActionsMenu hide={interview.canComplete ? ["complete"] : ["edit", "reschedule"]} interview={interview} onAction={actions.run} placement="page" withView={false} />
        </div>
      </div>

      {interview.status === "cancelled" ? <Callout role="status" title={t("interviews.detail.cancelledNotice")} tone="warning" /> : null}

      <div className="grid items-start gap-[18px] lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="flex min-w-0 flex-col gap-[18px]">
          <Info interview={interview} />
          <Interviewers interviewers={interview.interviewers} />
        </div>
        <InterviewHistory history={interview.statusHistory} />
      </div>
      {actions.dialog}
    </div>
  );
}
