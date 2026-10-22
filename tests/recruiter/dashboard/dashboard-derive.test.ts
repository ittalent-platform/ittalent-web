import { describe, expect, it } from "vitest";

import {
  applicationsListPath,
  busiestWeekday,
  columnLabelEvery,
  heatLevel,
  heatmapColumns,
  isEmptyPeriod,
  niceTop,
  pipelineModel,
  weekdayTotals,
} from "@/features/recruiter/dashboard/dashboard.derive";
import type { CompanyDashboardResponse } from "@/api/generated/types.gen";

const STATUSES: CompanyDashboardResponse["applicationStatuses"] = {
  hired: 5,
  interviewing: 21,
  offered: 6,
  positionFilled: 2,
  rejected: 24,
  submitted: 34,
  underReview: 29,
  withdrawn: 7,
};

describe("pipelineModel", () => {
  const model = pipelineModel(STATUSES, 128);

  it("splits the applications by current status, in pipeline order", () => {
    expect(model.segments.map((segment) => [segment.key, segment.count])).toEqual([
      ["submitted", 34],
      ["underReview", 29],
      ["interviewing", 21],
      ["offered", 6],
      ["hired", 5],
    ]);
  });

  it("counts what is still being worked on, what was hired and what closed without a hire", () => {
    expect(model.inProgress).toBe(90);
    expect(model.hired).toBe(5);
    expect(model.closed).toBe(33);
    expect(model.inProgress + model.hired + model.closed).toBe(128);
  });

  it("gives shares that add up to the whole", () => {
    const sum = model.segments.reduce((total, segment) => total + segment.share, 0) + model.closedShare;
    expect(sum).toBeCloseTo(1, 10);
  });

  it("has no share when nothing was received", () => {
    const empty = pipelineModel({ ...STATUSES, hired: 0, interviewing: 0, offered: 0, positionFilled: 0, rejected: 0, submitted: 0, underReview: 0, withdrawn: 0 }, 0);
    expect(empty.closedShare).toBe(0);
    expect(empty.segments.every((segment) => segment.share === 0)).toBe(true);
  });
});

describe("applicationsListPath", () => {
  it("opens the list for the statuses and the same days as the card", () => {
    const path = applicationsListPath(["under_review"], { from: "2026-09-11", to: "2026-10-10" });
    const [pathname, query] = path.split("?");
    expect(pathname).toBe("/recruiter/applications");
    const params = new URLSearchParams(query);
    expect(params.get("status")).toBe("under_review");
    expect(params.get("range")).toBe("custom");
    expect(params.get("from")).toBe("2026-09-11");
    expect(params.get("to")).toBe("2026-10-10");
  });

  it("joins several statuses with commas", () => {
    const path = applicationsListPath(["rejected", "withdrawn", "position_filled"], { from: "2026-09-11", to: "2026-10-10" });
    expect(new URLSearchParams(path.split("?")[1]).get("status")).toBe("rejected,withdrawn,position_filled");
  });
});

describe("niceTop", () => {
  it("rounds the axis top up to a round number", () => {
    expect(niceTop(0)).toBe(2);
    expect(niceTop(2)).toBe(2);
    expect(niceTop(3)).toBe(4);
    expect(niceTop(5)).toBe(6);
    expect(niceTop(7)).toBe(8);
    expect(niceTop(9)).toBe(10);
    expect(niceTop(10)).toBe(10);
    expect(niceTop(31)).toBe(40);
    expect(niceTop(36)).toBe(40);
    expect(niceTop(41)).toBe(60);
    expect(niceTop(100)).toBe(100);
    expect(niceTop(101)).toBe(200);
  });

  it("always fits the largest value", () => {
    for (let value = 0; value <= 1500; value += 7) expect(niceTop(value)).toBeGreaterThanOrEqual(value);
  });
});

describe("heatLevel", () => {
  it("is absolute: 0, 1, 2, 3, and 4 or more", () => {
    expect([0, 1, 2, 3, 4, 5, 20].map(heatLevel)).toEqual([0, 1, 2, 3, 4, 4, 4]);
    expect(heatLevel(-1)).toBe(0);
  });
});

describe("heatmapColumns", () => {
  // 2026-09-11 is a Friday; 2026-10-10 a Saturday.
  const days = [
    { count: 2, date: "2026-09-11" },
    { count: 3, date: "2026-10-09" },
  ];
  const columns = heatmapColumns(days, "2026-09-11", "2026-10-10");

  it("makes one column per week from the Monday of the first day", () => {
    expect(columns.map((column) => column.monday)).toEqual(["2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28", "2026-10-05"]);
  });

  it("leaves the days outside the period empty so weekdays stay aligned", () => {
    const first = columns[0];
    expect(first?.cells.map((cell) => cell?.date ?? null)).toEqual([null, null, null, null, "2026-09-11", "2026-09-12", "2026-09-13"]);
    const last = columns[4];
    expect(last?.cells.map((cell) => cell?.date ?? null)).toEqual(["2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08", "2026-10-09", "2026-10-10", null]);
  });

  it("fills the counts and treats a missing day as zero", () => {
    expect(columns[0]?.cells[4]).toEqual({ count: 2, date: "2026-09-11", level: 2 });
    expect(columns[1]?.cells[0]).toEqual({ count: 0, date: "2026-09-14", level: 0 });
    expect(columns[4]?.cells[4]).toEqual({ count: 3, date: "2026-10-09", level: 3 });
  });

  it("handles a single day", () => {
    const single = heatmapColumns([], "2026-10-07", "2026-10-07");
    expect(single).toHaveLength(1);
    expect(single[0]?.cells.filter(Boolean)).toHaveLength(1);
  });
});

describe("weekdayTotals and busiestWeekday", () => {
  it("adds the counts per weekday, Monday first", () => {
    const totals = weekdayTotals([
      { count: 2, date: "2026-10-05" }, // Monday
      { count: 1, date: "2026-10-12" }, // Monday
      { count: 4, date: "2026-10-09" }, // Friday
      { count: 1, date: "2026-10-11" }, // Sunday
    ]);
    expect(totals).toEqual([3, 0, 0, 0, 4, 0, 1]);
  });

  it("names the one busiest weekday", () => {
    expect(busiestWeekday([3, 0, 0, 0, 4, 0, 1])).toBe(4);
  });

  it("names none when nothing happened or days tie", () => {
    expect(busiestWeekday([0, 0, 0, 0, 0, 0, 0])).toBeNull();
    expect(busiestWeekday([4, 0, 0, 0, 4, 0, 1])).toBeNull();
  });
});

describe("columnLabelEvery", () => {
  it("prints fewer labels as the columns get crowded", () => {
    expect(columnLabelEvery(1)).toBe(1);
    expect(columnLabelEvery(6)).toBe(1);
    expect(columnLabelEvery(7)).toBe(2);
    expect(columnLabelEvery(14)).toBe(2);
    expect(columnLabelEvery(15)).toBe(4);
    expect(columnLabelEvery(53)).toBe(4);
  });
});

describe("isEmptyPeriod", () => {
  const base = { summary: { applicationsReceived: 0, interviews: 0, jobsPosted: 0 } } as CompanyDashboardResponse;

  it("is empty only when nothing was posted, received or scheduled", () => {
    expect(isEmptyPeriod(base)).toBe(true);
    expect(isEmptyPeriod({ summary: { ...base.summary, jobsPosted: 1 } } as CompanyDashboardResponse)).toBe(false);
    expect(isEmptyPeriod({ summary: { ...base.summary, applicationsReceived: 1 } } as CompanyDashboardResponse)).toBe(false);
    expect(isEmptyPeriod({ summary: { ...base.summary, interviews: 1 } } as CompanyDashboardResponse)).toBe(false);
  });
});
