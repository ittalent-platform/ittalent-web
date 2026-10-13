import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, TriangleAlert, Link2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { requestCode } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { FormField, FormSectionLabel } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { ApplicationPicker, ApplicationSummary } from "./application-picker";
import { InterviewerEmailInput } from "./interviewer-email-input";
import {
  DURATION_OPTIONS_MINUTES,
  INTERVIEW_TIME_ZONE_LABEL,
  INTERVIEW_TIME_ZONE_NAME,
  SCHEDULE_ERROR_CODES,
  SCHEDULE_LIMITS,
  type InterviewerOption,
  type SchedulableApplication,
} from "./interviews.constants";
import { formatDuration, formatShortDay, formatTimeRange, vietnamDay } from "./interviews.format";
import { useCreateInterview } from "./interviews.queries";
import { buildCreateBody, DEFAULT_SCHEDULE_VALUES, scheduleSchema, scheduleWindow, startsInFuture, type ScheduleValues } from "./interviews.schedule";

type ScheduleInterviewDialogProps = {
  /** `YYYY-MM-DD` to start with, when the recruiter chose a day on the calendar. */
  initialDate?: string | undefined;
  onClose: () => void;
};

/**
 * Schedule interview: pick an application, a time in Vietnam, the interviewers by email and where it takes place.
 * Nothing is sent until every field passes; the API's own refusals (a clash, an ineligible application) are said
 * next to the field they concern. Closing with something typed asks before throwing it away.
 */
export function ScheduleInterviewDialog({ initialDate, onClose }: ScheduleInterviewDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const create = useCreateInterview();
  const [application, setApplication] = useState<SchedulableApplication | null>(null);
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [interviewersError, setInterviewersError] = useState<string | null>(null);

  const form = useForm<ScheduleValues>({
    defaultValues: { ...DEFAULT_SCHEDULE_VALUES, date: initialDate ?? "" },
    resolver: zodResolver(scheduleSchema),
  });
  const { errors, isDirty } = form.formState;

  // The message about the whole interview sits at the top of the form, which may be scrolled away.
  useEffect(() => {
    if (banner && formRef.current) formRef.current.scrollTop = 0;
  }, [banner]);
  const [date = "", startTime = "", durationMinutes = ""] = useWatch({ control: form.control, name: ["date", "startTime", "durationMinutes"] });
  const window = scheduleWindow({ date, durationMinutes, startTime });
  const today = vietnamDay(new Date());
  const dirty = isDirty || application !== null || interviewers.length > 0;

  const error = (field: keyof ScheduleValues) => {
    const code = errors[field]?.message;
    return code ? t(`interviews.schedule.errors.${code}`) : undefined;
  };
  // "Provide a location or a meeting link" concerns both fields, so it is said once under them; a too-long location is the field's own.
  const needsPlace = errors.location?.message === "place";
  const locationError = needsPlace ? undefined : error("location");

  function requestClose() {
    if (create.isPending) return;
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function chooseApplication(next: SchedulableApplication) {
    setApplication(next);
    setApplicationError(null);
    form.setValue("applicationId", next.id, { shouldDirty: true, shouldValidate: form.formState.isSubmitted });
  }

  function explain(failure: unknown) {
    const code = requestCode(failure);
    if (code === SCHEDULE_ERROR_CODES.timeInPast) form.setError("date", { message: "past" });
    else if (code === SCHEDULE_ERROR_CODES.invalidInterviewers) setInterviewersError(t("interviews.schedule.errors.invalidInterviewers"));
    else if (code === SCHEDULE_ERROR_CODES.notSchedulable) setApplicationError(t("interviews.schedule.errors.notSchedulable"));
    else if (code === SCHEDULE_ERROR_CODES.applicantUnavailable) setApplicationError(t("interviews.schedule.errors.applicantUnavailable"));
    else if (code === SCHEDULE_ERROR_CODES.interviewerConflict) setBanner(t("interviews.schedule.errors.interviewerConflict"));
    else if (code === SCHEDULE_ERROR_CODES.applicantConflict) setBanner(t("interviews.schedule.errors.applicantConflict"));
    else setBanner(t("interviews.schedule.errors.saveFailed"));
  }

  const send = form.handleSubmit((values) => {
    if (interviewers.length === 0) return;
    if (!startsInFuture(values, new Date())) {
      form.setError("date", { message: "past" });
      return;
    }
    create.mutate(buildCreateBody(values, interviewers.map((person) => person.id)), {
      onError: explain,
      onSuccess: () => {
        showToast({ message: t("interviews.schedule.doneMessage"), title: t("interviews.schedule.doneTitle"), tone: "success" });
        onClose();
      },
    });
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    setBanner(null);
    setApplicationError(null);
    setInterviewersError(interviewers.length === 0 ? t("interviews.schedule.errors.interviewersRequired") : null);
    return send(event);
  }

  return (
    <>
      <Dialog onOpenChange={(open) => !open && requestClose()} open>
        <DialogContent className="max-w-[640px] gap-0 overflow-hidden rounded-[20px] p-0">
          <DialogHeader className="pr-14">
            <DialogTitle className="text-xl">{t("interviews.schedule.title")}</DialogTitle>
            <DialogDescription>{t("interviews.schedule.description")}</DialogDescription>
          </DialogHeader>

          <form className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto px-[26px] py-5" id="schedule-interview-form" noValidate onSubmit={submit} ref={formRef}>
            {banner ? <InlineBanner tone="error">{banner}</InlineBanner> : null}

            <FormSectionLabel>{t("interviews.schedule.selectApplication")}</FormSectionLabel>
            <FormField error={applicationError ?? error("applicationId")} htmlFor="schedule-application" label={t("interviews.schedule.application")} required>
              <ApplicationPicker id="schedule-application" invalid={Boolean(applicationError ?? errors.applicationId)} onChange={chooseApplication} value={application} />
            </FormField>
            {application ? <ApplicationSummary application={application} /> : null}

            <div className="flex flex-col gap-5 border-t border-border pt-5">
              <FormSectionLabel>{t("interviews.schedule.schedule")}</FormSectionLabel>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField error={error("date")} htmlFor="schedule-date" label={t("interviews.schedule.date")} required>
                  <Controller
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <DatePicker aria-invalid={Boolean(errors.date)} id="schedule-date" min={today} onChange={field.onChange} today={today} value={field.value} />
                    )}
                  />
                </FormField>
                <FormField error={error("startTime")} htmlFor="schedule-time" label={t("interviews.schedule.startTime")} required>
                  <Input aria-invalid={Boolean(errors.startTime)} id="schedule-time" type="time" {...form.register("startTime")} />
                </FormField>
                <FormField htmlFor="schedule-duration" label={t("interviews.schedule.duration")} required>
                  <Controller
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="schedule-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DURATION_OPTIONS_MINUTES.map((minutes) => (
                            <SelectItem key={minutes} value={String(minutes)}>
                              {formatDuration(minutes, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField htmlFor="schedule-zone" label={t("interviews.schedule.timezone")} required>
                  <Select value={INTERVIEW_TIME_ZONE_NAME}>
                    <SelectTrigger id="schedule-zone">
                      <SelectValue>{INTERVIEW_TIME_ZONE_LABEL}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={INTERVIEW_TIME_ZONE_NAME}>{INTERVIEW_TIME_ZONE_LABEL}</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
              {window ? (
                <p className="-mt-3 text-[12.5px] text-muted-foreground">
                  {t("interviews.schedule.runs", { day: formatShortDay(window.startsAt, i18n.language), range: formatTimeRange(window.startsAt, window.endsAt, i18n.language) })}
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-5 border-t border-border pt-5">
              <FormSectionLabel>{t("interviews.schedule.peopleAndPlace")}</FormSectionLabel>
              <FormField htmlFor="schedule-interviewers" label={t("interviews.schedule.interviewers")} required>
                <InterviewerEmailInput
                  error={interviewersError ?? undefined}
                  id="schedule-interviewers"
                  onChange={(next) => {
                    setInterviewers(next);
                    setInterviewersError(null);
                  }}
                  value={interviewers}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField error={locationError} htmlFor="schedule-location" label={<span className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="size-3.5 text-muted-foreground" />{t("interviews.schedule.location")}</span>}>
                  <Input aria-invalid={Boolean(errors.location)} id="schedule-location" maxLength={SCHEDULE_LIMITS.location} placeholder={t("interviews.schedule.locationPlaceholder")} {...form.register("location")} />
                </FormField>
                <FormField error={error("meetingLink")} htmlFor="schedule-link" label={<span className="inline-flex items-center gap-1.5"><Link2 aria-hidden className="size-3.5 text-muted-foreground" />{t("interviews.schedule.meetingLink")}</span>}>
                  <Input aria-invalid={Boolean(errors.meetingLink || errors.location)} id="schedule-link" inputMode="url" maxLength={SCHEDULE_LIMITS.link} placeholder={t("interviews.schedule.linkPlaceholder")} {...form.register("meetingLink")} />
                </FormField>
              </div>
              {needsPlace ? (
                <p className="-mt-3 text-[12.5px] text-(--danger-fg)" role="alert">{error("location")}</p>
              ) : (
                <p className="-mt-3 text-[12.5px] text-muted-foreground">{t("interviews.schedule.placeHint")}</p>
              )}
            </div>

            <div className="flex flex-col gap-5 border-t border-border pt-5">
              <FormSectionLabel>{t("interviews.schedule.notesSection")}</FormSectionLabel>
              <FormField error={error("notes")} hint={t("interviews.schedule.notesHint")} htmlFor="schedule-notes" label={t("interviews.schedule.notes")}>
                <Textarea aria-invalid={Boolean(errors.notes)} id="schedule-notes" maxLength={SCHEDULE_LIMITS.notes} placeholder={t("interviews.schedule.notesPlaceholder")} rows={3} {...form.register("notes")} />
              </FormField>
            </div>
          </form>

          <DialogFooter className="bg-background">
            <Button className="h-10 px-5 text-sm font-semibold" disabled={create.isPending} onClick={requestClose} type="button" variant="outline">
              {t("interviews.schedule.cancel")}
            </Button>
            <Button className="h-10 px-5 text-sm font-semibold" disabled={create.isPending} form="schedule-interview-form" type="submit">
              {create.isPending ? t("interviews.schedule.creating") : t("interviews.schedule.create")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionConfirmDialog
        action={t("interviews.schedule.discard")}
        cancelLabel={t("interviews.schedule.keepEditing")}
        description={t("interviews.schedule.discardDescription")}
        icon={TriangleAlert}
        onConfirm={onClose}
        onOpenChange={setConfirmDiscard}
        open={confirmDiscard}
        title={t("interviews.schedule.discardTitle")}
        variant="destructive-solid"
      />
    </>
  );
}
