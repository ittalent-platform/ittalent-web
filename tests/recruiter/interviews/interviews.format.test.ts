import { describe, expect, it } from "vitest";

import i18n from "@/i18n";
import {
  dateWindow,
  formatDuration,
  formatFullDay,
  formatShortDay,
  formatTimeRange,
  initialsName,
  startOfVietnamDay,
  vietnamDay,
} from "@/features/recruiter/interviews/interviews.format";

// Thursday 8 Oct 2026, 10:00 in Vietnam.
const NOW = new Date("2026-10-08T03:00:00.000Z");

describe("Vietnam time", () => {
  it("shows an instant in Vietnam time whatever the time zone of the browser", () => {
    // 20:00 UTC on the 14th is 03:00 on the 15th in Vietnam.
    expect(formatShortDay("2026-10-14T20:00:00.000Z", "en")).toBe("Thu, 15 Oct");
    expect(formatFullDay("2026-10-14T20:00:00.000Z", "en")).toBe("Thu, 15 Oct 2026");
    expect(formatTimeRange("2026-10-15T03:00:00.000Z", "2026-10-15T04:00:00.000Z", "en")).toBe("10:00 – 11:00");
    expect(vietnamDay("2026-10-14T20:00:00.000Z")).toBe("2026-10-15");
    expect(new Date(startOfVietnamDay("2026-10-15")).toISOString()).toBe("2026-10-14T17:00:00.000Z");
  });

  it("writes the time of day with 24 hours", () => {
    expect(formatTimeRange("2026-10-15T07:30:00.000Z", "2026-10-15T08:15:00.000Z", "en")).toBe("14:30 – 15:15");
  });
});

describe("formatDuration", () => {
  it.each([
    [45, "45 minutes"],
    [60, "1 hour"],
    [120, "2 hours"],
    [90, "1 h 30 min"],
  ])("writes %i minutes as %s", (minutes, expected) => {
    expect(formatDuration(minutes, i18n.t)).toBe(expected);
  });
});

describe("initialsName", () => {
  it("keeps the first and last word so the avatar gets the family and given name", () => {
    expect(initialsName("Trịnh Văn Long")).toBe("Trịnh Long");
    expect(initialsName("Đặng Hà")).toBe("Đặng Hà");
    expect(initialsName("Cher")).toBe("Cher");
  });
});

describe("dateWindow", () => {
  it("covers the Vietnam calendar day for today", () => {
    expect(dateWindow("today", NOW)).toEqual({ from: "2026-10-07T17:00:00.000Z", to: "2026-10-08T16:59:59.999Z" });
  });

  it("moves to the next Vietnam day late in the evening UTC", () => {
    expect(dateWindow("today", new Date("2026-10-08T20:00:00.000Z"))).toEqual({
      from: "2026-10-08T17:00:00.000Z",
      to: "2026-10-09T16:59:59.999Z",
    });
  });

  it("runs from Monday to Sunday for this week", () => {
    expect(dateWindow("thisWeek", NOW)).toEqual({ from: "2026-10-04T17:00:00.000Z", to: "2026-10-11T16:59:59.999Z" });
    // Sunday 11 Oct still belongs to the week that started on Monday 5 Oct.
    expect(dateWindow("thisWeek", new Date("2026-10-11T05:00:00.000Z")).from).toBe("2026-10-04T17:00:00.000Z");
  });

  it("covers the whole month, including December", () => {
    expect(dateWindow("thisMonth", NOW)).toEqual({ from: "2026-09-30T17:00:00.000Z", to: "2026-10-31T16:59:59.999Z" });
    expect(dateWindow("thisMonth", new Date("2026-12-15T03:00:00.000Z"))).toEqual({
      from: "2026-11-30T17:00:00.000Z",
      to: "2026-12-31T16:59:59.999Z",
    });
  });

  it("is open on one side for upcoming and past", () => {
    expect(dateWindow("upcoming", NOW)).toEqual({ from: NOW.toISOString() });
    expect(dateWindow("past", NOW)).toEqual({ to: NOW.toISOString() });
  });
});
