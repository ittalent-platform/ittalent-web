import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { requestCode } from "@/api/request-error";
import { FormField } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

import { InterviewStaleDialog } from "./interview-stale-dialog";
import { INTERVIEW_TIME_ZONE_NAME, SCHEDULE_ERROR_CODES, type InterviewItem } from "./interviews.constants";
import { isCurrentTime, rescheduleDefaults, rescheduleSchema, staleKind, type RescheduleValues, type StaleKind } from "./interviews.edit";
import { applicantName, formatShortDay, formatTime, formatTimeRange, toScheduledAt, vietnamDay } from "./interviews.format";
import { useUpdateInterview } from "./interviews.queries";
import { scheduleWindow, startsInFuture } from "./interviews.schedule";

type RescheduleInterviewDialogProps = {
  interview: InterviewItem;
  onClose: () => void;
};

/**
 * Reschedule: a new date and start time for a scheduled interview; the duration stays. The same checks as
 * scheduling apply (a time ahead, nobody double-booked) and say so at the top of the dialog.
 */
export function RescheduleInterviewDialog({ interview, onClose }: RescheduleInterviewDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const update = useUpdateInterview();
  const [banner, setBanner] = useState<string | null>(null);
  const [stale, setStale] = useState<StaleKind | null>(null);

  const form = useForm<RescheduleValues>({ defaultValues: rescheduleDefaults(interview), resolver: zodResolver(rescheduleSchema) });
  const { errors } = form.formState;
  const [date = "", startTime = ""] = useWatch({ control: form.control, name: ["date", "startTime"] });

  const name = applicantName(interview.applicant);
  const today = vietnamDay(new Date());
  const window = scheduleWindow({ date, durationMinutes: String(interview.durationMinutes), startTime });
  const unchanged = isCurrentTime({ date, startTime }, interview.scheduledAt);
  const error = (field: keyof RescheduleValues) => {
    const code = errors[field]?.message;
    return code ? t(`interviews.schedule.errors.${code}`) : undefined;
  };

  function explain(failure: unknown) {
    const kind = staleKind(failure);
    const code = requestCode(failure);
    if (kind) setStale(kind);
    else if (code === SCHEDULE_ERROR_CODES.timeInPast) setBanner(t("interviews.schedule.errors.past"));
    else if (code === SCHEDULE_ERROR_CODES.interviewerConflict) setBanner(t("interviews.schedule.errors.interviewerConflict"));
    else if (code === SCHEDULE_ERROR_CODES.applicantConflict) setBanner(t("interviews.schedule.errors.applicantConflict"));
    else setBanner(t("interviews.reschedule.errors.saveFailed"));
  }

  const send = form.handleSubmit((values) => {
    if (!startsInFuture(values, new Date())) {
      setBanner(t("interviews.schedule.errors.past"));
      return;
    }
    const scheduledAt = toScheduledAt(values.date, values.startTime);
    update.mutate(
      { id: interview.id, scheduledAt },
      {
        onError: explain,
        onSuccess: () => {
          const when = `${formatShortDay(scheduledAt, i18n.language)} · ${formatTime(scheduledAt, i18n.language)}`;
          showToast({ message: t("interviews.reschedule.doneMessage", { name, when }), title: t("interviews.reschedule.doneTitle"), tone: "success" });
          onClose();
        },
      },
    );
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    setBanner(null);
    return send(event);
  }

  function requestClose() {
    if (!update.isPending) onClose();
  }

  if (stale) return <InterviewStaleDialog kind={stale} onClose={onClose} />;

  const current = `${formatShortDay(interview.scheduledAt, i18n.language)} · ${formatTime(interview.scheduledAt, i18n.language)}`;
  return (
    <Dialog onOpenChange={(open) => !open && requestClose()} open>
      <DialogContent className="max-w-[540px] gap-0 overflow-hidden rounded-[20px] p-0">
        <DialogHeader className="pr-14">
          <DialogTitle className="text-xl">{t("interviews.reschedule.title")}</DialogTitle>
          <DialogDescription>{t("interviews.reschedule.description", { current, name })}</DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-5 px-[26px] py-5" id="reschedule-interview-form" noValidate onSubmit={submit}>
          {banner ? <InlineBanner tone="error">{banner}</InlineBanner> : null}
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField error={error("date")} htmlFor="reschedule-date" label={t("interviews.schedule.date")} required>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => <DatePicker aria-invalid={Boolean(errors.date)} id="reschedule-date" min={today} onChange={field.onChange} today={today} value={field.value} />}
              />
            </FormField>
            <FormField error={error("startTime")} htmlFor="reschedule-time" label={t("interviews.schedule.startTime")} required>
              <Input aria-invalid={Boolean(errors.startTime)} id="reschedule-time" type="time" {...form.register("startTime")} />
            </FormField>
          </div>
          {window ? (
            <p className="-mt-3 text-[12.5px] text-muted-foreground">
              {t("interviews.reschedule.runs", {
                day: formatShortDay(window.startsAt, i18n.language),
                range: formatTimeRange(window.startsAt, window.endsAt, i18n.language),
                zone: INTERVIEW_TIME_ZONE_NAME,
              })}
            </p>
          ) : null}
          <InlineBanner tone="info">{t("interviews.reschedule.notice", { name })}</InlineBanner>
        </form>

        <DialogFooter className="bg-background">
          <Button className="h-10 px-5 text-sm font-semibold" disabled={update.isPending} onClick={requestClose} type="button" variant="outline">
            {t("interviews.schedule.cancel")}
          </Button>
          <Button className="h-10 px-5 text-sm font-semibold" disabled={update.isPending || unchanged} form="reschedule-interview-form" type="submit">
            {update.isPending ? t("interviews.reschedule.saving") : t("interviews.reschedule.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
