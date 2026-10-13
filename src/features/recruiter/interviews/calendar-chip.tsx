import { useTranslation } from "react-i18next";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { InterviewPeek } from "./interview-peek";
import { CHIP_TONE_CLASS, type CalendarField, type InterviewItem } from "./interviews.constants";
import { applicantName, formatTime } from "./interviews.format";
import type { InterviewAction } from "./use-interview-actions";

type CalendarChipProps = {
  fields: ReadonlySet<CalendarField>;
  interview: InterviewItem;
  onAction: (action: InterviewAction, interview: InterviewItem) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

/** One interview in a day of the calendar: coloured by status, opens a summary when clicked. */
export function CalendarChip({ fields, interview, onAction, onOpenChange, open }: CalendarChipProps) {
  const { i18n } = useTranslation();
  const headline = [fields.has("time") ? formatTime(interview.scheduledAt, i18n.language) : null, fields.has("applicant") ? applicantName(interview.applicant) : null]
    .filter(Boolean)
    .join(" · ");
  const job = fields.has("job") ? (interview.job.title ?? "—") : null;
  const first = headline || job;
  const second = headline ? job : null;

  return (
    <Popover onOpenChange={onOpenChange} open={open}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "flex w-full min-w-0 cursor-pointer flex-col rounded-md px-1.5 py-1 text-left outline-none transition focus-visible:ring-2 focus-visible:ring-primary/50 data-[state=open]:ring-2 data-[state=open]:ring-foreground",
            CHIP_TONE_CLASS[interview.status],
          )}
          type="button"
        >
          <span className={cn("block w-full truncate text-[11.5px] font-semibold leading-tight", interview.status === "cancelled" && "line-through")}>{first}</span>
          {second ? <span className="block w-full truncate text-[11px] leading-tight opacity-80">{second}</span> : null}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[340px] p-0" side="right">
        <InterviewPeek interview={interview} onAction={onAction} />
      </PopoverContent>
    </Popover>
  );
}
