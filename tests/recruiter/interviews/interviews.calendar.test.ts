import { describe, expect, it } from "vitest";

import { groupByDay, longDayTitle, monthGrid, monthName, monthOf, monthTitle, parseMonth, shiftMonth, weekdayNames } from "@/features/recruiter/interviews/interviews.calendar";
import type { InterviewItem } from "@/features/recruiter/interviews/interviews.constants";

const at = (id: string, scheduledAt: string) => ({ id, scheduledAt }) as InterviewItem;

describe("monthGrid", () => {
  it("draws October 2026 over five weeks, Sunday 27 September to Saturday 31 October", () => {
    const grid = monthGrid("2026-10");
    expect(grid.days).toHaveLength(35);
    expect(grid.days[0]).toEqual({ day: "2026-09-27", dayOfMonth: 27, inMonth: false });
    expect(grid.days[4]).toEqual({ day: "2026-10-01", dayOfMonth: 1, inMonth: true });
    expect(grid.days.at(-1)).toEqual({ day: "2026-10-31", dayOfMonth: 31, inMonth: true });
    expect(grid.days.filter((cell) => cell.inMonth)).toHaveLength(31);
  });

  it("asks for the interviews from the first to the last instant of the grid in Vietnam time", () => {
    const grid = monthGrid("2026-10");
    expect(grid.from).toBe("2026-09-26T17:00:00.000Z");
    expect(grid.to).toBe("2026-10-31T16:59:59.999Z");
  });

  it("uses six weeks when the month needs them", () => {
    const grid = monthGrid("2026-08");
    expect(grid.days).toHaveLength(42);
    expect(grid.days[0]!.day).toBe("2026-07-26");
    expect(grid.days.at(-1)!.day).toBe("2026-09-05");
  });

  it("uses exactly four weeks for a February that starts on a Sunday", () => {
    const grid = monthGrid("2026-02");
    expect(grid.days).toHaveLength(28);
    expect(grid.days.every((cell) => cell.inMonth)).toBe(true);
  });

  it("never asks for more days than the API allows", () => {
    for (let month = 1; month <= 12; month += 1) {
      expect(monthGrid(`2026-${String(month).padStart(2, "0")}`).days.length).toBeLessThanOrEqual(42);
    }
  });
});

describe("months", () => {
  it("moves between months and rolls over the year", () => {
    expect(shiftMonth("2026-10", 1)).toBe("2026-11");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });

  it("takes a month from the address only when it is one", () => {
    expect(parseMonth("2026-03", "2026-10")).toBe("2026-03");
    expect(parseMonth("2026-13", "2026-10")).toBe("2026-10");
    expect(parseMonth("march", "2026-10")).toBe("2026-10");
    expect(parseMonth(null, "2026-10")).toBe("2026-10");
  });

  it("names the month an instant falls in by Vietnam time", () => {
    expect(monthOf("2026-09-30T17:30:00.000Z")).toBe("2026-10");
    expect(monthOf("2026-10-31T16:59:00.000Z")).toBe("2026-10");
    expect(monthOf("2026-10-31T17:00:00.000Z")).toBe("2026-11");
  });
});

describe("labels", () => {
  it("writes the month and the day in English and Vietnamese", () => {
    expect(monthTitle("2026-10", "en")).toBe("October 2026");
    expect(monthName("2026-10", "en")).toBe("October");
    expect(longDayTitle("2026-10-15", "en")).toBe("Thursday, October 15");
    expect(monthTitle("2026-10", "vi")).toBe("Tháng 10 năm 2026");
  });

  it("lists the weekdays from Sunday", () => {
    expect(weekdayNames("en")).toEqual(["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]);
  });
});

describe("groupByDay", () => {
  it("files an interview under its Vietnam-time day and orders each day by start", () => {
    const grouped = groupByDay([at("late", "2026-10-15T09:00:00.000Z"), at("early", "2026-10-15T02:00:00.000Z"), at("after-midnight", "2026-10-14T18:30:00.000Z")]);
    expect([...grouped.keys()]).toEqual(["2026-10-15"]);
    expect(grouped.get("2026-10-15")!.map((item) => item.id)).toEqual(["after-midnight", "early", "late"]);
  });
});
