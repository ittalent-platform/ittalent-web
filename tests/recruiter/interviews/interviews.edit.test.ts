import { describe, expect, it } from "vitest";

import {
  buildUpdateBody,
  durationOptions,
  editDefaults,
  editSchema,
  interviewersOf,
  isCurrentTime,
  rescheduleDefaults,
  rescheduleSchema,
  staleKind,
} from "@/features/recruiter/interviews/interviews.edit";
import { vietnamClock } from "@/features/recruiter/interviews/interviews.format";

const interview = {
  durationMinutes: 60,
  interviewers: [
    { email: "nam.bui@novafintech.vn", fullName: "Nam Bùi", id: "u-nam" },
    { email: "tran.b@novafintech.vn", fullName: null, id: "u-tran" },
    { email: null, fullName: "Left the company", id: "u-gone" },
  ],
  location: null,
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  mode: "online" as const,
  notes: "Panel interview",
  scheduledAt: "2026-10-15T03:00:00.000Z",
};
const initial = interviewersOf(interview);
const failure = (status: number, code?: string) => Object.assign(new Error("failed"), { code, status });

describe("Editing an interview", () => {
  it("starts from what the interview already says", () => {
    expect(editDefaults(interview)).toEqual({ durationMinutes: "60", location: "", meetingLink: "https://meet.google.com/kqr-pmzt-bvx", notes: "Panel interview" });
    expect(editDefaults({ ...interview, location: "HQ", meetingLink: null, notes: null })).toEqual({ durationMinutes: "60", location: "HQ", meetingLink: "", notes: "" });
  });

  it("lists the interviewers that still have an account with an email", () => {
    expect(initial.map((person) => person.id)).toEqual(["u-nam", "u-tran"]);
  });

  it("sends nothing when nothing changed, so a save is not even offered", () => {
    expect(buildUpdateBody(interview, editDefaults(interview), initial, initial)).toEqual({});
  });

  it("sends only what changed", () => {
    const values = { ...editDefaults(interview), durationMinutes: "90", notes: "  Bring a laptop  " };
    expect(buildUpdateBody(interview, values, initial, initial)).toEqual({ durationMinutes: 90, notes: "Bring a laptop" });
  });

  it("clears an emptied field with null", () => {
    const values = { ...editDefaults(interview), notes: "   ", location: "HQ" };
    expect(buildUpdateBody(interview, values, initial, initial)).toEqual({ location: "HQ", notes: null });
  });

  it("makes the interview onsite when its link is replaced by a location", () => {
    const values = { ...editDefaults(interview), location: "12 Tôn Đản, Quận 4", meetingLink: "" };
    expect(buildUpdateBody(interview, values, initial, initial)).toEqual({ location: "12 Tôn Đản, Quận 4", meetingLink: null, mode: "onsite" });
  });

  it("makes the interview online when a link is added to an onsite one", () => {
    const onsite = { ...interview, location: "HQ", meetingLink: null, mode: "onsite" as const };
    const values = { ...editDefaults(onsite), meetingLink: "https://meet.google.com/new" };
    expect(buildUpdateBody(onsite, values, initial, initial)).toEqual({ meetingLink: "https://meet.google.com/new", mode: "online" });
  });

  it("keeps the mode when only the notes change, even if the interview has both a place and a link", () => {
    const both = { ...interview, location: "HQ", mode: "onsite" as const };
    expect(buildUpdateBody(both, { ...editDefaults(both), notes: "x" }, initial, initial)).toEqual({ notes: "x" });
  });

  it("sends the interviewers when the people changed, whatever their order", () => {
    const [nam, tran] = initial;
    expect(buildUpdateBody(interview, editDefaults(interview), [tran!, nam!], initial)).toEqual({});
    expect(buildUpdateBody(interview, editDefaults(interview), [nam!], initial)).toEqual({ interviewerIds: ["u-nam"] });
    const extra = { email: "x@novafintech.vn", fullName: null, id: "u-x" };
    expect(buildUpdateBody(interview, editDefaults(interview), [...initial, extra], initial)).toEqual({ interviewerIds: ["u-nam", "u-tran", "u-x"] });
  });

  it("offers the usual durations, plus the interview's own when it is something else", () => {
    expect(durationOptions(60)).toEqual([15, 30, 45, 60, 90, 120, 180, 240]);
    expect(durationOptions(50)).toEqual([15, 30, 45, 50, 60, 90, 120, 180, 240]);
  });

  it("asks for a place, like scheduling does", () => {
    const result = editSchema.safeParse({ durationMinutes: "60", location: "", meetingLink: "", notes: "" });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]).toMatchObject({ message: "place", path: ["location"] });
    expect(editSchema.safeParse({ durationMinutes: "60", location: "HQ", meetingLink: "", notes: "" }).success).toBe(true);
    expect(editSchema.safeParse({ durationMinutes: "60", location: "", meetingLink: "http://x.vn", notes: "" }).error?.issues[0]?.message).toBe("linkInvalid");
  });
});

describe("Rescheduling an interview", () => {
  it("starts from the current date and time in Vietnam", () => {
    expect(rescheduleDefaults(interview)).toEqual({ date: "2026-10-15", startTime: "10:00" });
    expect(rescheduleDefaults({ scheduledAt: "2026-10-15T17:30:00.000Z" })).toEqual({ date: "2026-10-16", startTime: "00:30" });
  });

  it("reads the clock of Vietnam, not of the browser", () => {
    expect(vietnamClock("2026-10-15T03:00:00.000Z")).toBe("10:00");
    expect(vietnamClock("2026-10-15T16:59:00.000Z")).toBe("23:59");
  });

  it("knows when the time is the one it already has", () => {
    expect(isCurrentTime({ date: "2026-10-15", startTime: "10:00" }, interview.scheduledAt)).toBe(true);
    expect(isCurrentTime({ date: "2026-10-15", startTime: "10:15" }, interview.scheduledAt)).toBe(false);
    expect(isCurrentTime({ date: "2026-10-15", startTime: "" }, interview.scheduledAt)).toBe(false);
    expect(isCurrentTime({ date: "", startTime: "10:00" }, interview.scheduledAt)).toBe(false);
  });

  it("needs a date and a time", () => {
    expect(rescheduleSchema.safeParse({ date: "", startTime: "10:00" }).error?.issues[0]?.message).toBe("date");
    expect(rescheduleSchema.safeParse({ date: "2026-10-20", startTime: "" }).error?.issues[0]?.message).toBe("time");
    expect(rescheduleSchema.safeParse({ date: "2026-10-20", startTime: "14:00" }).success).toBe(true);
  });
});

describe("An interview that is no longer what the screen showed", () => {
  it("is told apart from other failures", () => {
    expect(staleKind(failure(409, "INTERVIEW_STATE_CHANGED"))).toBe("changed");
    expect(staleKind(failure(409, "INTERVIEW_STATUS_FINAL"))).toBe("changed");
    expect(staleKind(failure(409, "INTERVIEW_NOT_EDITABLE"))).toBe("notEditable");
    expect(staleKind(failure(409, "INTERVIEWER_CONFLICT"))).toBeNull();
    expect(staleKind(failure(500))).toBeNull();
    expect(staleKind(new Error("offline"))).toBeNull();
  });
});
