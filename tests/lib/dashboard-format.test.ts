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
    expect(formatShortDay("2026-09-11", "en")).toBe("11 Sep");
    expect(formatFullDay("2026-09-11", "en")).toBe("11 Sep 2026");
    expect(formatShortDay("2026-01-01", "en")).toBe("1 Jan");
  });

  it("writes every English month with three letters, September too", () => {
    const months = Array.from({ length: 12 }, (_, index) => formatShortDay(`2026-${String(index + 1).padStart(2, "0")}-05`, "en"));
    expect(months).toEqual(["5 Jan", "5 Feb", "5 Mar", "5 Apr", "5 May", "5 Jun", "5 Jul", "5 Aug", "5 Sep", "5 Oct", "5 Nov", "5 Dec"]);
    expect(formatAsOf("2026-09-11T03:42:00.000Z", "en").date).toBe("11 Sep 2026");
  });

  it("leaves the Vietnamese months as the locale writes them", () => {
    expect(formatShortDay("2026-09-11", "vi")).toBe(new Intl.DateTimeFormat("vi-VN", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date("2026-09-11T00:00:00Z")));
  });

  it("writes ranges compactly and adds years only when needed", () => {
    expect(formatDayRange("2026-10-04", "2026-10-10", "en")).toBe("4 – 10 Oct");
    expect(formatDayRange("2026-10-04", "2026-10-10", "en", { spaced: false })).toBe("4–10 Oct");
    expect(formatDayRange("2026-09-11", "2026-10-10", "en", { spaced: false })).toBe("11 Sep–10 Oct");
    expect(formatDayRange("2026-09-11", "2026-10-10", "en", { withYear: true })).toBe("11 Sep – 10 Oct 2026");
    expect(formatDayRange("2026-12-20", "2027-01-10", "en")).toBe("20 Dec 2026 – 10 Jan 2027");
    expect(formatDayRange("2026-10-10", "2026-10-10", "en")).toBe("10 Oct");
    expect(formatDayRange("2026-10-10", "2026-10-10", "en", { withYear: true })).toBe("10 Oct 2026");
  });

  it("gives the moment of the data in Ho Chi Minh City time", () => {
    // 03:42 UTC is 10:42 in UTC+7, the same calendar day.
    const asOf = formatAsOf("2026-10-11T03:42:00.000Z", "en");
    expect(asOf.time).toBe("10:42");
    expect(asOf.date).toBe("11 Oct 2026");
    // 18:00 UTC is already the next day in Vietnam.
    expect(formatAsOf("2026-10-10T18:00:00.000Z", "en").date).toBe("11 Oct 2026");
  });

  it("does not throw on an unreadable instant", () => {
    expect(formatAsOf("not a date", "en")).toEqual({ date: "—", time: "—" });
  });
});
