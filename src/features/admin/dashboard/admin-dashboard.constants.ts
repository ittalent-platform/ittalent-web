import type { ChartTone } from "@/components/common/chart-tone";

export const FORBIDDEN_STATUS = 403;

/** The three kinds of account the platform counts, in the order the ring and its legend list them. */
export const ROLE_ROWS: readonly { key: "candidates" | "hr" | "enterpriseAdmins"; tone: ChartTone }[] = [
  { key: "candidates", tone: "brand" },
  { key: "hr", tone: "blue" },
  { key: "enterpriseAdmins", tone: "green" },
];

/** Account statuses under the ring, each with the dot that marks it. The design lists active, invited and suspended; inactive appears only when some account is, so the numbers still add up. */
export const ACCOUNT_STATUS_ROWS: readonly { dot: string; hideWhenEmpty?: boolean; key: "active" | "invited" | "inactive" | "suspended" }[] = [
  { dot: "bg-(--dash-green)", key: "active" },
  { dot: "bg-(--dash-amber)", key: "invited" },
  { dot: "bg-(--dash-axis)", hideWhenEmpty: true, key: "inactive" },
  { dot: "bg-(--dash-red)", key: "suspended" },
];

export const ROLE_RING_SIZE = 150;

/** A sign-up that has waited this many days or more is highlighted. */
export const WAITING_ALERT_DAYS = 5;

export const LINE_CHART = {
  baseline: 186,
  dotRadius: 2.5,
  height: 210,
  labelY: 204,
  lastDotRadius: 4,
  left: 26,
  pillHeight: 20,
  pillOffsetX: 58,
  pillOffsetY: 30,
  pillWidth: 52,
  plotHeight: 146.5,
  plotRight: 630,
  right: 636,
  tickLabelX: 20,
  width: 640,
} as const;
