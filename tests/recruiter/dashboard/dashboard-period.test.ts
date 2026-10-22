import { describe, expect, it } from "vitest";

import { customRangeError, isFuturePeriod, parsePeriodParams, periodQuery, presetWindow, todayInVietnam } from "@/features/recruiter/dashboard/dashboard.period";

describe("presetWindow", () => {
  const today = "2026-10-11";

  it("ends yesterday and covers the stated number of days", () => {
    expect(presetWindow("last_7_days", today)).toEqual({ from: "2026-10-04", to: "2026-10-10" });
    expect(presetWindow("last_30_days", today)).toEqual({ from: "2026-09-11", to: "2026-10-10" });
    expect(presetWindow("last_90_days", today)).toEqual({ from: "2026-07-13", to: "2026-10-10" });
  });

  it("runs this month from the 1st to yesterday", () => {
    expect(presetWindow("this_month", today)).toEqual({ from: "2026-10-01", to: "2026-10-10" });
    expect(presetWindow("this_month", "2026-10-02")).toEqual({ from: "2026-10-01", to: "2026-10-01" });
  });

  it("shows the 1st itself, so far, on the first day of a month", () => {
    expect(presetWindow("this_month", "2026-10-01")).toEqual({ from: "2026-10-01", to: "2026-10-01" });
  });

  it("crosses month and year ends", () => {
    expect(presetWindow("last_7_days", "2027-01-03")).toEqual({ from: "2026-12-27", to: "2027-01-02" });
  });
});

describe("todayInVietnam", () => {
  it("uses the Vietnamese calendar day, not the browser's", () => {
    expect(todayInVietnam(new Date("2026-10-10T18:00:00.000Z"))).toBe("2026-10-11");
    expect(todayInVietnam(new Date("2026-10-10T16:59:00.000Z"))).toBe("2026-10-10");
  });
});

describe("isFuturePeriod", () => {
  it("is true only for a period that starts after today", () => {
    expect(isFuturePeriod("2026-10-12", "2026-10-11")).toBe(true);
    expect(isFuturePeriod("2026-10-11", "2026-10-11")).toBe(false);
    expect(isFuturePeriod("2026-09-01", "2026-10-11")).toBe(false);
  });
});

describe("customRangeError", () => {
  it("accepts a valid range, including one day and a future one", () => {
    expect(customRangeError("2026-10-04", "2026-10-10")).toBeNull();
    expect(customRangeError("2026-10-04", "2026-10-04")).toBeNull();
    expect(customRangeError("2027-01-01", "2027-01-31")).toBeNull();
  });

  it("asks for both days", () => {
    expect(customRangeError("", "2026-10-10")).toBe("required");
    expect(customRangeError("2026-10-04", null)).toBe("required");
    expect(customRangeError("2026-02-30", "2026-03-10")).toBe("required");
  });

  it("refuses an end before the start", () => {
    expect(customRangeError("2026-10-10", "2026-10-04")).toBe("order");
  });

  it("allows 366 days and refuses 367", () => {
    expect(customRangeError("2027-01-01", "2027-12-31")).toBeNull();
    expect(customRangeError("2028-01-01", "2028-12-31")).toBeNull();
    expect(customRangeError("2026-01-01", "2027-01-02")).toBe("tooLong");
  });
});

describe("parsePeriodParams", () => {
  const parse = (query: string) => parsePeriodParams(new URLSearchParams(query));

  it("defaults to the last 30 days with no notice", () => {
    expect(parse("")).toEqual({ range: "last_30_days" });
  });

  it("reads a preset", () => {
    expect(parse("range=last_7_days")).toEqual({ range: "last_7_days" });
    expect(parse("range=this_month")).toEqual({ range: "this_month" });
  });

  it("reads a valid custom range", () => {
    expect(parse("range=custom&from=2026-10-04&to=2026-10-10")).toEqual({ from: "2026-10-04", range: "custom", to: "2026-10-10" });
  });

  it("falls back, with a notice, to the default for a range it does not know", () => {
    expect(parse("range=last_year")).toEqual({ notice: "dates", range: "last_30_days" });
  });

  it("falls back, with a notice, for a custom range that cannot be asked for", () => {
    expect(parse("range=custom")).toEqual({ notice: "dates", range: "last_30_days" });
    expect(parse("range=custom&from=2026-10-10&to=2026-10-04")).toEqual({ notice: "dates", range: "last_30_days" });
    expect(parse("range=custom&from=2026-02-30&to=2026-03-04")).toEqual({ notice: "dates", range: "last_30_days" });
    expect(parse("range=custom&from=2026-01-01&to=2027-06-01")).toEqual({ notice: "dates", range: "last_30_days" });
  });

  it("ignores dates sent with a preset", () => {
    expect(parse("range=last_7_days&from=2026-01-01&to=2026-01-31")).toEqual({ range: "last_7_days" });
  });

  it("reports a time zone other than Ho Chi Minh City and keeps the period", () => {
    expect(parse("tz=America/New_York")).toEqual({ notice: "timeZone", range: "last_30_days" });
    expect(parse("range=last_7_days&tz=UTC")).toEqual({ notice: "timeZone", range: "last_7_days" });
    expect(parse("tz=Asia/Ho_Chi_Minh")).toEqual({ range: "last_30_days" });
  });

  it("reports another company's id in the link and never uses it", () => {
    expect(parse("company=abc")).toEqual({ notice: "company", range: "last_30_days" });
    expect(parse("enterpriseId=abc&range=last_90_days")).toEqual({ notice: "company", range: "last_90_days" });
  });
});

describe("periodQuery", () => {
  it("sends a preset as its name alone", () => {
    expect(periodQuery({ range: "last_7_days" })).toEqual({ range: "last_7_days" });
  });

  it("sends a custom range with its two days", () => {
    expect(periodQuery({ from: "2026-10-04", range: "custom", to: "2026-10-10" })).toEqual({ from: "2026-10-04", range: "custom", to: "2026-10-10" });
  });

  it("never sends a company or a time zone", () => {
    const query = periodQuery({ notice: "company", range: "last_30_days" });
    expect(Object.keys(query)).toEqual(["range"]);
  });
});
