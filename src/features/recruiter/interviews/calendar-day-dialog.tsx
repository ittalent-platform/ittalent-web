import { useTranslation } from "react-i18next";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { interviewPath } from "@/config/routes";
import { cn } from "@/lib/utils";

import { longDayTitle } from "./interviews.calendar";
import { CHIP_TONE_CLASS, type InterviewItem } from "./interviews.constants";
import { applicantName, formatTime } from "./interviews.format";

type CalendarDayDialogProps = {
  day: string;
  interviews: InterviewItem[];
  onOpenChange: (open: boolean) => void;
};

/** Every interview of one day, for the days that do not fit in their cell. */
export function CalendarDayDialog({ day, interviews, onOpenChange }: CalendarDayDialogProps) {
  const { t, i18n } = useTranslation();

  return (
    <Dialog onOpenChange={onOpenChange} open>
      <DialogContent className="max-w-[460px]" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{longDayTitle(day, i18n.language)}</DialogTitle>
          <DialogDescription>{t("interviews.calendar.dayCount", { count: interviews.length })}</DialogDescription>
        </DialogHeader>
        <ul className="m-0 flex max-h-[55vh] list-none flex-col gap-2 overflow-y-auto p-5">
          {interviews.map((interview) => (
            <li key={interview.id}>
              <Link
                className={cn("flex items-center gap-4 rounded-lg px-3.5 py-2.5 outline-none transition hover:opacity-90 focus-visible:ring-2 focus-visible:ring-primary/50", CHIP_TONE_CLASS[interview.status])}
                to={interviewPath(interview.id)}
              >
                <span className="text-[14px] font-bold tabular-nums">{formatTime(interview.scheduledAt, i18n.language)}</span>
                <span className="flex min-w-0 flex-col">
                  <span className={cn("truncate text-[13.5px] font-semibold", interview.status === "cancelled" && "line-through")}>{applicantName(interview.applicant)}</span>
                  <span className="truncate text-[12px] opacity-80">{interview.job.title ?? "—"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <DialogFooter>
          <DialogClose asChild>
            <Button className="h-10 px-5 text-sm font-semibold" type="button" variant="outline">
              {t("actions.close")}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
