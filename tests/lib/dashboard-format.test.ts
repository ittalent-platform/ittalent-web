import { describe, expect, it } from "vitest";

import { formatAsOf, formatCount, formatDayRange, formatDecimal, formatFullDay, formatShortDay, intlLocale, percentOf } from "@/lib/dashboard-format";

describe("dashboard-format", () => {
  it("picks the Vietnamese locale only for Vietnamese", () => {
    expect(intlLocale("vi")).toBe("vi-VN");
    expect(intlLocale("vi-VN")).toBe("vi-VN");
    expect(intlLocale("en")).toBe("en-GB");
    expect(intlLocale("fr")).toBe("en-GB");
  });

  it("groups thousands the way each language does", () => {
    expect(formatCount(2116, "en")).toBe("2,116");
    expect(formatCount(2116, "vi")).toBe("2.116");
    expect(formatCount(0, "en")).toBe("0");
  });

  it("shows at most one decimal", () => {
    expect(formatDecimal(4.266, "en")).toBe("4.3");
    expect(formatDecimal(4, "en")).toBe("4");
    expect(formatDecimal(4.3, "vi")).toBe("4,3");
  });

  it("rounds a share and never divides by zero", () => {
    expect(percentOf(34, 128)).toBe(27);
    expect(percentOf(5, 128)).toBe(4);
    expect(percentOf(0, 0)).toBe(0);
    expect(percentOf(3, 0)).toBe(0);
  });

  it("prints a calendar day the same wherever the browser is", () => {
    expect(formatShortDay("2026-09-11", "en")).toMatch(/^11 Sept?$/);
    expect(formatFullDay("2026-09-11", "en")).toMatch(/^11 Sept? 2026$/);
    expect(formatShortDay("2026-01-01", "en")).toMatch(/^1 Jan$/);
  });

  it("writes ranges compactly and adds years only when needed", () => {
    expect(formatDayRange("2026-10-04", "2026-10-10", "en")).toMatch(/^4 – 10 Oct$/);
    expect(formatDayRange("2026-10-04", "2026-10-10", "en", { spaced: false })).toMatch(/^4–10 Oct$/);
    expect(formatDayRange("2026-09-11", "2026-10-10", "en", { spaced: false })).toMatch(/^11 Sept?–10 Oct$/);
    expect(formatDayRange("2026-09-11", "2026-10-10", "en", { withYear: true })).toMatch(/^11 Sept? – 10 Oct 2026$/);
    expect(formatDayRange("2026-12-20", "2027-01-10", "en")).toMatch(/^20 Dec 2026 – 10 Jan 2027$/);
    expect(formatDayRange("2026-10-10", "2026-10-10", "en")).toBe("10 Oct");
    expect(formatDayRange("2026-10-10", "2026-10-10", "en", { withYear: true })).toBe("10 Oct 2026");
  });

  it("gives the moment of the data in Ho Chi Minh City time", () => {
    // 03:42 UTC is 10:42 in UTC+7, the same calendar day.
    const asOf = formatAsOf("2026-10-11T03:42:00.000Z", "en");
    expect(asOf.time).toBe("10:42");
    expect(asOf.date).toMatch(/^11 Oct 2026$/);
    // 18:00 UTC is already the next day in Vietnam.
    expect(formatAsOf("2026-10-10T18:00:00.000Z", "en").date).toMatch(/^11 Oct 2026$/);
  });

  it("does not throw on an unreadable instant", () => {
    expect(formatAsOf("not a date", "en")).toEqual({ date: "—", time: "—" });
  });
});
