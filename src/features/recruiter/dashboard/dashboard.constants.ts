import type { GetApiV1DashboardCompanyData } from "@/api/generated/types.gen";
import type { ChartTone } from "@/components/common/chart-tone";

export type DashboardRange = NonNullable<NonNullable<GetApiV1DashboardCompanyData["query"]>["range"]>;
export type PresetRange = Exclude<DashboardRange, "custom">;

/** The presets in the order the period menu lists them; "custom" opens the date form instead. */
export const PRESET_RANGES: readonly PresetRange[] = ["last_7_days", "last_30_days", "last_90_days", "this_month"];
export const DASHBOARD_RANGES: readonly DashboardRange[] = [...PRESET_RANGES, "custom"];
export const DEFAULT_RANGE: PresetRange = "last_30_days";
export const PRESET_DAYS: Readonly<Partial<Record<PresetRange, number>>> = { last_7_days: 7, last_30_days: 30, last_90_days: 90 };
/** The longest period the API answers for. */
export const MAX_RANGE_DAYS = 366;

/** Every date on the dashboard is a whole day in this zone; the API ignores any other. */
export const DASHBOARD_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** URL query-param keys: the period lives in the address so a link or a reload shows the same numbers. */
export const DASHBOARD_PARAMS = { from: "from", range: "range", timeZone: "tz", to: "to" } as const;
/** A link may carry another company's id; it is never sent and never changes what is shown. */
export const FOREIGN_COMPANY_PARAMS = ["company", "companyId", "enterprise", "enterpriseId"] as const;

export const FORBIDDEN_STATUS = 403;
export const NOT_A_MEMBER_CODE = "DASHBOARD_NOT_A_MEMBER";
export const COMPANY_NOT_ACTIVE_CODE = "DASHBOARD_COMPANY_NOT_ACTIVE";

export const DAYS_PER_WEEK = 7;

// ---- where this period's applications are now ----

export type PipelineKey = "submitted" | "underReview" | "interviewing" | "offered" | "hired";

export const PIPELINE_SEGMENTS: readonly { key: PipelineKey; apiStatus: string; bg: string; ink: string }[] = [
  { apiStatus: "submitted", bg: "bg-(--dash-pipe-submitted)", ink: "text-(--dash-pipe-submitted-ink)", key: "submitted" },
  { apiStatus: "under_review", bg: "bg-(--dash-pipe-review)", ink: "text-(--dash-pipe-review-ink)", key: "underReview" },
  { apiStatus: "interviewing", bg: "bg-(--dash-pipe-interviewing)", ink: "text-white", key: "interviewing" },
  { apiStatus: "offered", bg: "bg-(--dash-pipe-offered)", ink: "text-white", key: "offered" },
  { apiStatus: "hired", bg: "bg-(--dash-pipe-hired)", ink: "text-white", key: "hired" },
];
/** Applications still being worked on. */
export const IN_PROGRESS_KEYS: readonly PipelineKey[] = ["submitted", "underReview", "interviewing", "offered"];
/** Applications that ended without a hire, and the list statuses they open. */
export const CLOSED_API_STATUSES = ["rejected", "withdrawn", "position_filled"] as const;
export const STATUS_LIST_SEPARATOR = ",";
/** A segment narrower than this share of the bar has no room for its number. */
export const MIN_LABEL_SHARE = 0.045;

// ---- applications received per week ----

export const WEEKLY_CHART = {
  barMaxWidth: 48,
  barRadius: 5,
  barSlotShare: 0.43,
  baseline: 190,
  height: 220,
  left: 30,
  minLabelSlot: 64,
  minValueSlot: 26,
  right: 596,
  top: 16,
  valueGap: 7,
  width: 600,
  avgPillWidth: 116,
  avgPillHeight: 18,
  avgPillGap: 4,
} as const;
/** Ticks are drawn at 0, half and the top; the top is the smallest of these steps (times a power of ten) that fits the data. */
export const NICE_TOP_STEPS = [1, 2, 4, 6, 8, 10] as const;
export const MIN_CHART_TOP = 2;

// ---- when interviews happen ----

export const HEATMAP = {
  cell: 26,
  gap: 4,
  /** Columns up to this many show every Monday label; beyond, only every other one, and past `sparseColumns` every fourth. */
  denseColumns: 6,
  sparseColumns: 14,
} as const;
export const HEAT_MAX_LEVEL = 4;
/** Cell colour per level: none, 1, 2, 3 and 4 or more interviews that day. */
export const HEAT_LEVEL_CLASS: readonly string[] = ["bg-(--dash-track)", "bg-(--dash-heat-1)", "bg-(--dash-heat-2)", "bg-(--dash-heat-3)", "bg-(--dash-heat-4)"];
export const WEEKDAY_BAR_MAX_HEIGHT = 92;
export const WEEKDAY_BAR_EMPTY_HEIGHT = 2;
/** Monday-first weekday keys, matching the order of the grid rows and the bars. */
export const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

// ---- statuses ----

export const INTERVIEW_STATUS_ROWS: readonly { key: "scheduled" | "completed" | "rescheduleRequested" | "noShow" | "cancelled"; tone: ChartTone }[] = [
  { key: "scheduled", tone: "amber" },
  { key: "completed", tone: "green" },
  { key: "rescheduleRequested", tone: "blue" },
  { key: "noShow", tone: "red" },
  { key: "cancelled", tone: "stripe" },
];

export const JOB_STATUS_ROWS: readonly { key: "published" | "closed" | "draft" | "archived"; tone: ChartTone }[] = [
  { key: "published", tone: "green" },
  { key: "closed", tone: "stripe" },
  { key: "draft", tone: "dashed" },
  { key: "archived", tone: "violet" },
];

/** How many jobs the "most applications" list shows (the API's own limit). */
export const DASHBOARD_TOP_JOBS = 5;

export const RING_SIZE = { donut: 168, gauge: 200 } as const;
