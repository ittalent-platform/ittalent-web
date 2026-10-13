import { z } from "zod";

import type { CreateInterviewRequest } from "@/api/generated/types.gen";

import { DEFAULT_DURATION_MINUTES, SCHEDULE_LIMITS, TIME_PATTERN } from "./interviews.constants";
import { toScheduledAt } from "./interviews.format";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MS_PER_MINUTE = 60_000;

export type ScheduleValues = {
  applicationId: string;
  date: string;
  durationMinutes: string;
  location: string;
  meetingLink: string;
  notes: string;
  startTime: string;
};

export const DEFAULT_SCHEDULE_VALUES: ScheduleValues = {
  applicationId: "",
  date: "",
  durationMinutes: String(DEFAULT_DURATION_MINUTES),
  location: "",
  meetingLink: "",
  notes: "",
  startTime: "",
};

/** A link the API accepts: https, nothing else. */
export function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * What the form checks before it asks the API. A message here is a key under `interviews.schedule.errors`,
 * not a sentence, so the screen words it in the language in use.
 */
export const scheduleSchema = z
  .object({
    applicationId: z.string().min(1, "application"),
    date: z.string().regex(DATE_PATTERN, "date"),
    durationMinutes: z.string().min(1),
    location: z.string().trim().max(SCHEDULE_LIMITS.location, "locationLong"),
    meetingLink: z
      .string()
      .trim()
      .max(SCHEDULE_LIMITS.link, "linkLong")
      .refine((value) => value === "" || isHttpsUrl(value), "linkInvalid"),
    notes: z.string().trim().max(SCHEDULE_LIMITS.notes, "notesLong"),
    startTime: z.string().regex(TIME_PATTERN, "time"),
  })
  .superRefine((values, ctx) => {
    if (!values.location && !values.meetingLink) ctx.addIssue({ code: "custom", message: "place", path: ["location"] });
  });

/** Whether a Vietnam-time date and time that the form accepted is still ahead of `now`. */
export function startsInFuture(values: Pick<ScheduleValues, "date" | "startTime">, now: Date): boolean {
  return Date.parse(toScheduledAt(values.date, values.startTime)) > now.getTime();
}

/** The instants the interview runs from and to, for "Runs Tue, 20 Oct · 10:00 – 11:00". */
export function scheduleWindow(values: Pick<ScheduleValues, "date" | "durationMinutes" | "startTime">): { endsAt: string; startsAt: string } | null {
  if (!DATE_PATTERN.test(values.date) || !TIME_PATTERN.test(values.startTime)) return null;
  const startsAt = toScheduledAt(values.date, values.startTime);
  const minutes = Number(values.durationMinutes);
  if (!Number.isFinite(minutes)) return null;
  return { endsAt: new Date(Date.parse(startsAt) + minutes * MS_PER_MINUTE).toISOString(), startsAt };
}

/** The request for validated values: online when there is a link, otherwise at the place given. */
export function buildCreateBody(values: ScheduleValues, interviewerIds: string[]): CreateInterviewRequest {
  const meetingLink = values.meetingLink.trim();
  const location = values.location.trim();
  const notes = values.notes.trim();
  return {
    applicationId: values.applicationId,
    durationMinutes: Number(values.durationMinutes),
    interviewerIds,
    mode: meetingLink ? "online" : "onsite",
    scheduledAt: toScheduledAt(values.date, values.startTime),
    ...(meetingLink ? { meetingLink } : {}),
    ...(location ? { location } : {}),
    ...(notes ? { notes } : {}),
  };
}
