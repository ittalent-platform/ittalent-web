import { describe, expect, it } from "vitest";

import { addDays, daysBetween, isCalendarDay, mondayOf, weekdayIndex } from "@/lib/calendar-day";

describe("calendar-day", () => {
  it("accepts only days that exist", () => {
    expect(isCalendarDay("2026-10-10")).toBe(true);
    expect(isCalendarDay("2028-02-29")).toBe(true);
    expect(isCalendarDay("2026-02-29")).toBe(false);
    expect(isCalendarDay("2026-02-30")).toBe(false);
    expect(isCalendarDay("2026-13-01")).toBe(false);
    expect(isCalendarDay("10/10/2026")).toBe(false);
    expect(isCalendarDay("")).toBe(false);
    expect(isCalendarDay(null)).toBe(false);
    expect(isCalendarDay(undefined)).toBe(false);
  });

  it("adds days across month and year ends", () => {
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
    expect(addDays("2026-10-10", 0)).toBe("2026-10-10");
  });

  it("counts whole days between two days, negative when going back", () => {
    expect(daysBetween("2026-09-11", "2026-10-10")).toBe(29);
    expect(daysBetween("2026-10-10", "2026-10-10")).toBe(0);
    expect(daysBetween("2026-10-10", "2026-10-04")).toBe(-6);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
  });

  it("numbers weekdays from Monday and finds the Monday of a week", () => {
    // 2026-10-05 is a Monday, 2026-10-11 a Sunday.
    expect(weekdayIndex("2026-10-05")).toBe(0);
    expect(weekdayIndex("2026-10-09")).toBe(4);
    expect(weekdayIndex("2026-10-11")).toBe(6);
    expect(mondayOf("2026-10-11")).toBe("2026-10-05");
    expect(mondayOf("2026-10-05")).toBe("2026-10-05");
    expect(mondayOf("2026-09-11")).toBe("2026-09-07");
  });
});
