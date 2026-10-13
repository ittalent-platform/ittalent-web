import { Clock, Link2, MapPin, UserRound, X } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { PersonAvatar } from "@/components/common/person-avatar";
import { Button } from "@/components/ui/button";
import { PopoverClose } from "@/components/ui/popover";
import { interviewPath } from "@/config/routes";

import { InterviewStatusBadge } from "./interview-badges";
import type { InterviewItem } from "./interviews.constants";
import { applicantName, formatDurationShort, formatFullDay, formatTimeRange, initialsName } from "./interviews.format";
import type { InterviewAction } from "./use-interview-actions";

function Fact({ children, icon: Icon }: { children: ReactNode; icon: typeof Clock }) {
  return (
    <li className="flex min-w-0 items-start gap-2.5 text-[13.5px] text-foreground">
      <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </li>
  );
}

/** What a calendar chip opens: the interview at a glance, and the way on to its page. */
export function InterviewPeek({ interview, onAction }: { interview: InterviewItem; onAction: (action: InterviewAction, interview: InterviewItem) => void }) {
  const { t, i18n } = useTranslation();
  const name = applicantName(interview.applicant);
  const interviewers = interview.interviewers.map((person) => person.email ?? person.fullName).filter(Boolean);

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-2 px-4 pt-4">
        <InterviewStatusBadge status={interview.status} />
        <PopoverClose aria-label={t("actions.close")} className="grid size-7 place-items-center rounded-md text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/40">
          <X aria-hidden className="size-4" />
        </PopoverClose>
      </div>

      <div className="flex min-w-0 items-center gap-3 px-4 pt-3">
        <PersonAvatar className="size-10 text-sm" name={initialsName(name)} tone="peach" />
        <div className="min-w-0">
          <p className="truncate text-[15px] font-bold text-foreground">{name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{interview.job.title ?? "—"}</p>
        </div>
      </div>

      <ul className="m-0 flex list-none flex-col gap-2 px-4 pb-4 pt-3.5">
        <Fact icon={Clock}>
          {formatFullDay(interview.scheduledAt, i18n.language)} · {formatTimeRange(interview.scheduledAt, interview.endsAt, i18n.language)} ({formatDurationShort(interview.durationMinutes)})
        </Fact>
        {interview.meetingLink ? (
          <Fact icon={Link2}>
            <a className="text-fg-link underline-offset-2 hover:underline" href={interview.meetingLink} rel="noreferrer" target="_blank">
              {interview.meetingLink.replace(/^https?:\/\//, "")}
            </a>
          </Fact>
        ) : null}
        {interview.location ? <Fact icon={MapPin}>{interview.location}</Fact> : null}
        {interviewers.length > 0 ? <Fact icon={UserRound}>{interviewers.join(", ")}</Fact> : null}
      </ul>

      <div className="flex flex-wrap items-center justify-end gap-x-1 gap-y-2 border-t border-border px-4 py-3">
        {interview.status === "scheduled" ? (
          <>
            <Button className="h-9 px-2 text-[13px] font-semibold text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => onAction("cancel", interview)} type="button" variant="ghost">
              {t("interviews.actions.cancelShort")}
            </Button>
            <Button className="h-9 px-2 text-[13px] font-semibold" onClick={() => onAction("edit", interview)} type="button" variant="ghost">
              {t("interviews.actions.editShort")}
            </Button>
            {interview.canComplete ? null : (
              <Button className="h-9 px-2 text-[13px] font-semibold" onClick={() => onAction("reschedule", interview)} type="button" variant="ghost">
                {t("interviews.actions.reschedule")}
              </Button>
            )}
          </>
        ) : null}
        <Button asChild className="h-9 px-4 text-[13px] font-semibold" shape="pill">
          <Link to={interviewPath(interview.id)}>{t("interviews.actions.view")}</Link>
        </Button>
      </div>
    </div>
  );
}
