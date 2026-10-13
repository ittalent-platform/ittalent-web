import { zodResolver } from "@hookform/resolvers/zod";
import { Link2, MapPin, TriangleAlert } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { requestCode } from "@/api/request-error";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";
import { FormField, FormSectionLabel } from "@/components/common/form-field";
import { InlineBanner } from "@/components/common/inline-banner";
import { PersonAvatar } from "@/components/common/person-avatar";
import { useToast } from "@/components/toast/toast-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { InterviewStaleDialog } from "./interview-stale-dialog";
import { InterviewerEmailInput } from "./interviewer-email-input";
import { INTERVIEW_TIME_ZONE_LABEL, INTERVIEW_TIME_ZONE_NAME, SCHEDULE_ERROR_CODES, SCHEDULE_LIMITS, type InterviewItem } from "./interviews.constants";
import { buildUpdateBody, durationOptions, editDefaults, editSchema, interviewersOf, staleKind, type EditValues, type StaleKind } from "./interviews.edit";
import { applicantName, formatDuration, formatFullDay, formatShortDay, formatTime, formatTimeRange, initialsName, vietnamClock, vietnamDay } from "./interviews.format";
import { useUpdateInterview } from "./interviews.queries";
import { scheduleWindow } from "./interviews.schedule";

type EditInterviewDialogProps = {
  interview: InterviewItem;
  onClose: () => void;
};

/** Who the interview is with and when, as a reminder of what is being edited. */
function InterviewSummaryCard({ interview }: { interview: InterviewItem }) {
  const { i18n } = useTranslation();
  const name = applicantName(interview.applicant);

  return (
    <div className="flex flex-col gap-2.5 rounded-xl border border-border bg-background px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <PersonAvatar className="size-10 text-[13px]" name={initialsName(name)} tone="peach" />
        <div className="min-w-0">
          <p className="truncate text-[14px] font-bold text-foreground">{name}</p>
          <p className="truncate text-[13px] text-muted-foreground">{interview.job.title ?? "—"}</p>
        </div>
      </div>
      <p className="text-[13px] text-muted-foreground">
        {formatFullDay(interview.scheduledAt, i18n.language)} · {formatTime(interview.scheduledAt, i18n.language)} ({INTERVIEW_TIME_ZONE_NAME})
      </p>
    </div>
  );
}

/**
 * Edit details: the duration, who interviews, where it takes place and the notes. The date and the time are locked
 * here (Reschedule changes them). Only what changed is sent, and saving stays off until something has.
 */
export function EditInterviewDialog({ interview, onClose }: EditInterviewDialogProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const update = useUpdateInterview();
  const initialInterviewers = useMemo(() => interviewersOf(interview), [interview]);
  const [interviewers, setInterviewers] = useState(initialInterviewers);
  const [interviewersError, setInterviewersError] = useState<string | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const [stale, setStale] = useState<StaleKind | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<EditValues>({ defaultValues: editDefaults(interview), resolver: zodResolver(editSchema) });
  const { errors } = form.formState;
  const [durationMinutes = "", location = "", meetingLink = "", notes = ""] = useWatch({ control: form.control, name: ["durationMinutes", "location", "meetingLink", "notes"] });

  const changed = Object.keys(buildUpdateBody(interview, { durationMinutes, location, meetingLink, notes }, interviewers, initialInterviewers)).length > 0;
  const name = applicantName(interview.applicant);
  const window = scheduleWindow({ date: vietnamDay(interview.scheduledAt), durationMinutes, startTime: vietnamClock(interview.scheduledAt) });

  // The message about the whole interview sits at the top of the form, which may be scrolled away.
  useEffect(() => {
    if (banner && formRef.current) formRef.current.scrollTop = 0;
  }, [banner]);

  const error = (field: keyof EditValues) => {
    const code = errors[field]?.message;
    return code ? t(`interviews.schedule.errors.${code}`) : undefined;
  };
  // "Provide a location or a meeting link" concerns both fields, so it is said once under them; a too-long location is the field's own.
  const needsPlace = errors.location?.message === "place";
  const locationError = needsPlace ? undefined : error("location");

  function requestClose() {
    if (update.isPending) return;
    if (changed) setConfirmDiscard(true);
    else onClose();
  }

  function explain(failure: unknown) {
    const kind = staleKind(failure);
    const code = requestCode(failure);
    if (kind) setStale(kind);
    else if (code === SCHEDULE_ERROR_CODES.invalidInterviewers) setInterviewersError(t("interviews.schedule.errors.invalidInterviewers"));
    else if (code === SCHEDULE_ERROR_CODES.interviewerConflict) setBanner(t("interviews.edit.errors.interviewerConflict"));
    else if (code === SCHEDULE_ERROR_CODES.applicantConflict) setBanner(t("interviews.edit.errors.applicantConflict"));
    else setBanner(t("interviews.edit.errors.saveFailed"));
  }

  const send = form.handleSubmit((values) => {
    if (interviewers.length === 0) return;
    const body = buildUpdateBody(interview, values, interviewers, initialInterviewers);
    if (Object.keys(body).length === 0) return;
    update.mutate(
      { id: interview.id, ...body },
      {
        onError: explain,
        onSuccess: () => {
          showToast({ message: t("interviews.edit.doneMessage"), title: t("interviews.edit.doneTitle"), tone: "success" });
          onClose();
        },
      },
    );
  });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    setBanner(null);
    setInterviewersError(interviewers.length === 0 ? t("interviews.schedule.errors.interviewersRequired") : null);
    return send(event);
  }

  if (stale) return <InterviewStaleDialog kind={stale} onClose={onClose} />;

  return (
    <>
      <Dialog onOpenChange={(open) => !open && requestClose()} open>
        <DialogContent className="max-w-[640px] gap-0 overflow-hidden rounded-[20px] p-0">
          <DialogHeader className="pr-14">
            <DialogTitle className="text-xl">{t("interviews.edit.title")}</DialogTitle>
            <DialogDescription>{t("interviews.edit.description")}</DialogDescription>
          </DialogHeader>

          <form className="flex max-h-[68vh] flex-col gap-5 overflow-y-auto px-[26px] py-5" id="edit-interview-form" noValidate onSubmit={submit} ref={formRef}>
            {banner ? <InlineBanner tone="error">{banner}</InlineBanner> : null}
            <InterviewSummaryCard interview={interview} />

            <div className="flex flex-col gap-5 border-t border-border pt-5">
              <FormSectionLabel>{t("interviews.schedule.schedule")}</FormSectionLabel>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField htmlFor="edit-duration" label={t("interviews.schedule.duration")} required>
                  <Controller
                    control={form.control}
                    name="durationMinutes"
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger id="edit-duration">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {durationOptions(interview.durationMinutes).map((minutes) => (
                            <SelectItem key={minutes} value={String(minutes)}>
                              {formatDuration(minutes, t)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </FormField>
                <FormField htmlFor="edit-zone" label={t("interviews.schedule.timezone")} required>
                  <Select disabled value={INTERVIEW_TIME_ZONE_NAME}>
                    <SelectTrigger id="edit-zone">
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
              <FormField htmlFor="edit-interviewers" label={t("interviews.schedule.interviewers")} required>
                <InterviewerEmailInput
                  error={interviewersError ?? undefined}
                  id="edit-interviewers"
                  onChange={(next) => {
                    setInterviewers(next);
                    setInterviewersError(null);
                  }}
                  value={interviewers}
                />
              </FormField>
              <div className="grid gap-5 sm:grid-cols-2">
                <FormField error={locationError} htmlFor="edit-location" label={<span className="inline-flex items-center gap-1.5"><MapPin aria-hidden className="size-3.5 text-muted-foreground" />{t("interviews.schedule.location")}</span>}>
                  <Input aria-invalid={Boolean(errors.location)} id="edit-location" maxLength={SCHEDULE_LIMITS.location} placeholder={t("interviews.schedule.locationPlaceholder")} {...form.register("location")} />
                </FormField>
                <FormField error={error("meetingLink")} htmlFor="edit-link" label={<span className="inline-flex items-center gap-1.5"><Link2 aria-hidden className="size-3.5 text-muted-foreground" />{t("interviews.schedule.meetingLink")}</span>}>
                  <Input aria-invalid={Boolean(errors.meetingLink || errors.location)} id="edit-link" inputMode="url" maxLength={SCHEDULE_LIMITS.link} placeholder={t("interviews.schedule.linkPlaceholder")} {...form.register("meetingLink")} />
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
              <FormField error={error("notes")} hint={t("interviews.schedule.notesHint")} htmlFor="edit-notes" label={t("interviews.schedule.notes")}>
                <Textarea aria-invalid={Boolean(errors.notes)} id="edit-notes" maxLength={SCHEDULE_LIMITS.notes} placeholder={t("interviews.schedule.notesPlaceholder")} rows={3} {...form.register("notes")} />
              </FormField>
            </div>

            <InlineBanner tone="info">{t("interviews.edit.notice", { name })}</InlineBanner>
          </form>

          <DialogFooter className="bg-background">
            <Button className="h-10 px-5 text-sm font-semibold" disabled={update.isPending} onClick={requestClose} type="button" variant="outline">
              {t("interviews.schedule.cancel")}
            </Button>
            <Button className="h-10 px-5 text-sm font-semibold" disabled={update.isPending || !changed} form="edit-interview-form" type="submit">
              {update.isPending ? t("interviews.edit.saving") : t("interviews.edit.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActionConfirmDialog
        action={t("interviews.schedule.discard")}
        cancelLabel={t("interviews.schedule.keepEditing")}
        description={t("interviews.edit.discardDescription")}
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
