import { describe, expect, it } from "vitest";

import { toScheduledAt } from "@/features/recruiter/interviews/interviews.format";
import {
  buildCreateBody,
  DEFAULT_SCHEDULE_VALUES,
  isHttpsUrl,
  scheduleSchema,
  scheduleWindow,
  startsInFuture,
  type ScheduleValues,
} from "@/features/recruiter/interviews/interviews.schedule";

const valid: ScheduleValues = {
  applicationId: "app1",
  date: "2026-10-20",
  durationMinutes: "60",
  location: "",
  meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
  notes: "",
  startTime: "10:00",
};

const issue = (values: Partial<ScheduleValues>) => {
  const result = scheduleSchema.safeParse({ ...valid, ...values });
  return result.success ? null : result.error.issues.map((item) => `${item.path.join(".")}:${item.message}`);
};

describe("toScheduledAt", () => {
  it("reads a date and a time as Vietnam time", () => {
    expect(toScheduledAt("2026-10-20", "10:00")).toBe("2026-10-20T03:00:00.000Z");
    expect(toScheduledAt("2026-10-20", "00:30")).toBe("2026-10-19T17:30:00.000Z");
  });
});

describe("scheduleSchema", () => {
  it("accepts a complete online interview", () => {
    expect(issue({})).toBeNull();
  });

  it("accepts an onsite interview with only a location", () => {
    expect(issue({ location: "12 Tôn Đản, Quận 4", meetingLink: "" })).toBeNull();
  });

  it("asks for an application, a date and a start time", () => {
    expect(issue({ applicationId: "" })).toEqual(["applicationId:application"]);
    expect(issue({ date: "" })).toEqual(["date:date"]);
    expect(issue({ startTime: "" })).toEqual(["startTime:time"]);
    expect(issue({ startTime: "25:00" })).toEqual(["startTime:time"]);
  });

  it("wants a location or a meeting link, and says so once", () => {
    expect(issue({ location: "", meetingLink: "" })).toEqual(["location:place"]);
    expect(issue({ location: "   ", meetingLink: "  " })).toEqual(["location:place"]);
  });

  it("takes https links only", () => {
    expect(issue({ meetingLink: "http://meet.example.com/x" })).toEqual(["meetingLink:linkInvalid"]);
    expect(issue({ meetingLink: "meet.google.com/x" })).toEqual(["meetingLink:linkInvalid"]);
    expect(isHttpsUrl("https://zoom.us/j/123")).toBe(true);
    expect(isHttpsUrl("javascript:alert(1)")).toBe(false);
  });

  it("keeps each text within what the API takes", () => {
    expect(issue({ location: "x".repeat(256), meetingLink: "" })).toEqual(["location:locationLong"]);
    expect(issue({ notes: "x".repeat(2001) })).toEqual(["notes:notesLong"]);
    expect(issue({ meetingLink: `https://a.com/${"x".repeat(2048)}` })).toContain("meetingLink:linkLong");
  });
});

describe("startsInFuture", () => {
  const now = new Date("2026-10-08T03:00:00.000Z"); // 10:00 in Vietnam

  it("compares in Vietnam time", () => {
    expect(startsInFuture({ date: "2026-10-08", startTime: "10:01" }, now)).toBe(true);
    expect(startsInFuture({ date: "2026-10-08", startTime: "10:00" }, now)).toBe(false);
    expect(startsInFuture({ date: "2026-10-08", startTime: "09:59" }, now)).toBe(false);
    expect(startsInFuture({ date: "2026-10-09", startTime: "00:00" }, now)).toBe(true);
  });
});

describe("scheduleWindow", () => {
  it("gives the instants the interview runs between", () => {
    expect(scheduleWindow({ date: "2026-10-20", durationMinutes: "90", startTime: "10:00" })).toEqual({ endsAt: "2026-10-20T04:30:00.000Z", startsAt: "2026-10-20T03:00:00.000Z" });
  });

  it("is nothing until the date and the time are there", () => {
    expect(scheduleWindow({ date: "", durationMinutes: "60", startTime: "10:00" })).toBeNull();
    expect(scheduleWindow({ date: "2026-10-20", durationMinutes: "60", startTime: "" })).toBeNull();
  });
});

describe("buildCreateBody", () => {
  it("makes an online interview of one with a meeting link", () => {
    expect(buildCreateBody({ ...valid, notes: "  Panel interview  " }, ["u1", "u2"])).toEqual({
      applicationId: "app1",
      durationMinutes: 60,
      interviewerIds: ["u1", "u2"],
      meetingLink: "https://meet.google.com/kqr-pmzt-bvx",
      mode: "online",
      notes: "Panel interview",
      scheduledAt: "2026-10-20T03:00:00.000Z",
    });
  });

  it("makes an onsite interview of one with only a location", () => {
    const body = buildCreateBody({ ...valid, location: "12 Tôn Đản", meetingLink: "" }, ["u1"]);
    expect(body).toMatchObject({ location: "12 Tôn Đản", mode: "onsite" });
    expect(body).not.toHaveProperty("meetingLink");
    expect(body).not.toHaveProperty("notes");
  });

  it("keeps both when both are given, online first", () => {
    expect(buildCreateBody({ ...valid, location: "HQ" }, ["u1"])).toMatchObject({ location: "HQ", meetingLink: "https://meet.google.com/kqr-pmzt-bvx", mode: "online" });
  });

  it("starts from an hour with nothing chosen", () => {
    expect(DEFAULT_SCHEDULE_VALUES).toMatchObject({ applicationId: "", date: "", durationMinutes: "60", startTime: "" });
  });
});
