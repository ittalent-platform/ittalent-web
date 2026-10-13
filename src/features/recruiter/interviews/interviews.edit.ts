import { z } from "zod";

import type { UpdateInterviewRequest } from "@/api/generated/types.gen";
import { requestCode, requestStatus } from "@/api/request-error";

import { CONFLICT_STATUS, DURATION_OPTIONS_MINUTES, NOT_EDITABLE_ERROR_CODE, STALE_ERROR_CODES, type InterviewItem, type InterviewerOption } from "./interviews.constants";
import { toScheduledAt, vietnamClock, vietnamDay } from "./interviews.format";
import { requirePlace, scheduleFields } from "./interviews.schedule";

type Editable = Pick<InterviewItem, "durationMinutes" | "location" | "meetingLink" | "mode" | "notes">;

export type EditValues = { durationMinutes: string; location: string; meetingLink: string; notes: string };
export type RescheduleValues = { date: string; startTime: string };

export const editSchema = z
  .object({
    durationMinutes: scheduleFields.durationMinutes,
    location: scheduleFields.location,
    meetingLink: scheduleFields.meetingLink,
    notes: scheduleFields.notes,
  })
  .superRefine(requirePlace);

export const rescheduleSchema = z.object({ date: scheduleFields.date, startTime: scheduleFields.startTime });

export function editDefaults(interview: Editable): EditValues {
  return {
    durationMinutes: String(interview.durationMinutes),
    location: interview.location ?? "",
    meetingLink: interview.meetingLink ?? "",
    notes: interview.notes ?? "",
  };
}

export function rescheduleDefaults(interview: Pick<InterviewItem, "scheduledAt">): RescheduleValues {
  return { date: vietnamDay(interview.scheduledAt), startTime: vietnamClock(interview.scheduledAt) };
}

/** The interviewers the form can show: an account that no longer has an email cannot be listed, so it drops out. */
export function interviewersOf(interview: Pick<InterviewItem, "interviewers">): InterviewerOption[] {
  return interview.interviewers.flatMap((person) => (person.email ? [{ email: person.email, fullName: person.fullName, id: person.id }] : []));
}

/** The durations to choose from, plus the interview's own when it was set to something else (by another client). */
export function durationOptions(current: number): number[] {
  return [...new Set<number>([...DURATION_OPTIONS_MINUTES, current])].sort((a, b) => a - b);
}

function sameMembers(a: readonly string[], b: readonly string[]): boolean {
  const members = new Set(b);
  return a.length === b.length && a.every((id) => members.has(id));
}

/** `null` clears an optional field on the API, so a field emptied by the recruiter is sent as `null`. */
function changedText(next: string, current: string | null): string | null | undefined {
  const value = next.trim();
  if (value === (current ?? "")) return undefined;
  return value === "" ? null : value;
}

/**
 * The request for an edit: only what the recruiter changed, since the API takes a partial update and an empty one
 * is refused. The mode follows the place: a meeting link makes it online, otherwise it is onsite.
 */
export function buildUpdateBody(interview: Editable, values: EditValues, interviewers: InterviewerOption[], initial: InterviewerOption[]): UpdateInterviewRequest {
  const body: UpdateInterviewRequest = {};
  const ids = interviewers.map((person) => person.id);
  if (!sameMembers(ids, initial.map((person) => person.id))) body.interviewerIds = ids;

  const duration = Number(values.durationMinutes);
  if (duration !== interview.durationMinutes) body.durationMinutes = duration;

  const meetingLink = changedText(values.meetingLink, interview.meetingLink);
  const location = changedText(values.location, interview.location);
  if (meetingLink !== undefined) body.meetingLink = meetingLink;
  if (location !== undefined) body.location = location;
  if (meetingLink !== undefined || location !== undefined) {
    const mode = values.meetingLink.trim() ? "online" : "onsite";
    if (mode !== interview.mode) body.mode = mode;
  }

  const notes = changedText(values.notes, interview.notes);
  if (notes !== undefined) body.notes = notes;
  return body;
}

/** Whether the time of the form is the one the interview already has; a date or time not filled in yet is not. */
export function isCurrentTime(values: RescheduleValues, scheduledAt: string): boolean {
  if (!rescheduleSchema.safeParse(values).success) return false;
  return toScheduledAt(values.date, values.startTime) === new Date(scheduledAt).toISOString();
}

export type StaleKind = "changed" | "notEditable";

/** Whether the API refused because the interview is no longer what the screen showed, and in which way. */
export function staleKind(error: unknown): StaleKind | null {
  if (requestStatus(error) !== CONFLICT_STATUS) return null;
  const code = requestCode(error);
  if (code === NOT_EDITABLE_ERROR_CODE) return "notEditable";
  return code && STALE_ERROR_CODES.includes(code) ? "changed" : null;
}
