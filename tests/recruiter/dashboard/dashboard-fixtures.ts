import type { CompanyDashboardResponse, PlatformOverviewResponse } from "@/api/generated/types.gen";

/** One company's statistics for 11 Sep – 10 Oct 2026, built to add up: 128 applications, 26 interviews, 9 jobs. */
export function companyDashboard(overrides: Partial<CompanyDashboardResponse> = {}): CompanyDashboardResponse {
  const interviewDays = Array.from({ length: 30 }, (_unused, index) => {
    const date = new Date(Date.UTC(2026, 8, 11 + index)).toISOString().slice(0, 10);
    // Friday 2026-10-09 carries 8 interviews, the rest are spread so the total is 26.
    const counts: Record<string, number> = { "2026-09-14": 2, "2026-09-15": 3, "2026-09-21": 2, "2026-09-22": 1, "2026-09-25": 2, "2026-10-02": 4, "2026-10-09": 8, "2026-10-10": 4 };
    return { count: counts[date] ?? 0, date };
  });
  return {
    applicationStatuses: { hired: 5, interviewing: 21, offered: 6, positionFilled: 2, rejected: 24, submitted: 34, underReview: 29, withdrawn: 7 },
    asOf: "2026-10-11T03:42:00.000Z",
    company: { id: "company-1", name: "Nova Fintech" },
    interviewDays,
    interviewStatuses: { cancelled: 3, completed: 12, noShow: 3, rescheduleRequested: 2, scheduled: 6 },
    jobStatuses: { archived: 0, closed: 2, draft: 1, published: 6 },
    period: { days: 30, from: "2026-09-11", range: "last_30_days", to: "2026-10-10" },
    summary: { applicationsReceived: 128, averageApplicationsPerDay: 4.3, hired: 5, hiredPercent: 3.9, interviews: 26, interviewsCompleted: 12, jobsOpen: 6, jobsPosted: 9 },
    timeZone: "Asia/Ho_Chi_Minh",
    topJobs: [
      { applications: 34, hired: 2, id: "job-1", interviews: 8, title: "Senior Backend Engineer (Go)" },
      { applications: 27, hired: 1, id: "job-2", interviews: 6, title: "Frontend Developer (React)" },
      { applications: 21, hired: 1, id: "job-3", interviews: 4, title: "Data Analyst" },
      { applications: 18, hired: 0, id: "job-4", interviews: 3, title: "DevOps Engineer" },
      { applications: 12, hired: 1, id: "job-5", interviews: 2, title: "QA Automation Engineer" },
    ],
    weeklyAverageApplications: 29,
    weeks: [
      { applications: 22, days: 7, from: "2026-09-11", hired: 1, interviews: 4, jobsPosted: 2, to: "2026-09-17" },
      { applications: 31, days: 7, from: "2026-09-18", hired: 0, interviews: 6, jobsPosted: 1, to: "2026-09-24" },
      { applications: 27, days: 7, from: "2026-09-25", hired: 2, interviews: 5, jobsPosted: 3, to: "2026-10-01" },
      { applications: 36, days: 7, from: "2026-10-02", hired: 1, interviews: 8, jobsPosted: 2, to: "2026-10-08" },
      { applications: 12, days: 2, from: "2026-10-09", hired: 1, interviews: 3, jobsPosted: 1, to: "2026-10-10" },
    ],
    ...overrides,
  };
}

/** The same company in a period where nothing happened. */
export function emptyCompanyDashboard(period: CompanyDashboardResponse["period"]): CompanyDashboardResponse {
  return companyDashboard({
    applicationStatuses: { hired: 0, interviewing: 0, offered: 0, positionFilled: 0, rejected: 0, submitted: 0, underReview: 0, withdrawn: 0 },
    interviewDays: [{ count: 0, date: period.from }],
    interviewStatuses: { cancelled: 0, completed: 0, noShow: 0, rescheduleRequested: 0, scheduled: 0 },
    jobStatuses: { archived: 0, closed: 0, draft: 0, published: 0 },
    period,
    summary: { applicationsReceived: 0, averageApplicationsPerDay: 0, hired: 0, hiredPercent: null, interviews: 0, interviewsCompleted: 0, jobsOpen: 0, jobsPosted: 0 },
    topJobs: [],
    weeklyAverageApplications: 0,
    weeks: [{ applications: 0, days: period.days, from: period.from, hired: 0, interviews: 0, jobsPosted: 0, to: period.to }],
  });
}

export function platformOverview(overrides: Partial<PlatformOverviewResponse> = {}): PlatformOverviewResponse {
  return {
    accounts: {
      byRole: { candidates: 1840, enterpriseAdmins: 64, hr: 212 },
      byStatus: { active: 2041, inactive: 0, invited: 48, suspended: 27 },
      newInLast30Days: 64,
      newPerWeek: [
        { count: 9, from: "2026-08-17", to: "2026-08-23" },
        { count: 14, from: "2026-08-24", to: "2026-08-30" },
        { count: 11, from: "2026-08-31", to: "2026-09-06" },
        { count: 19, from: "2026-09-07", to: "2026-09-13" },
      ],
      total: 2116,
    },
    asOf: "2026-10-11T03:42:00.000Z",
    companies: { active: 58, approved: 61, oldestWaitingDays: 5, suspended: 3, waitingForReview: 2 },
    timeZone: "Asia/Ho_Chi_Minh",
    waitingForReview: [
      { companyName: "Pixel Labs", id: "reg-1", submittedAt: "2026-10-05T18:00:00.000Z", waitingDays: 5 },
      { companyName: "Kite Health", id: "reg-2", submittedAt: "2026-10-10T08:00:00.000Z", waitingDays: 1 },
    ],
    ...overrides,
  };
}
