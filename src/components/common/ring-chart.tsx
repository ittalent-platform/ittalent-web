import { useId, type ReactNode } from "react";

import { cn } from "@/lib/utils";

import { TONE_FILL_CLASS, type ChartTone } from "./chart-tone";

export type RingSegment = {
  key: string;
  /** Read by assistive technology and shown as the hover title: "Scheduled: 6". */
  label: string;
  tone: ChartTone;
  value: number;
};

type RingChartProps = {
  ariaLabel: string;
  /** What sits in the hole: the total and its unit. */
  children?: ReactNode;
  /** A half ring (180°, flat side down) shows "how much of the whole" like a gauge. */
  half?: boolean;
  segments: readonly RingSegment[];
  /** Width of the chart in px; a full ring is square, a half ring is a little over half as tall. */
  size: number;
};

const FULL_SWEEP = 360;
const HALF_SWEEP = 180;
const GAP_DEGREES = 1;
const EDGE_MARGIN = 2;
// How thick the ring is relative to its outer radius (the design draws 26px on an 82px radius).
const INNER_RATIO = 56 / 82;
const HALF_INNER_RATIO = 70 / 98;
// A tiny segment keeps its gap to a quarter of its own width so it never disappears.
const GAP_SPAN_DIVISOR = 4;
const DASH_STROKE_WIDTH = 1.5;
const HALF_BOTTOM_MARGIN = 6;
const DECIMALS = 2;
const RADIANS_PER_DEGREE = Math.PI / 180;
const PATTERN_SIZE = 6;
const PATTERN_ROTATION = 45;
const PATTERN_STRIPE_WIDTH = 2.4;
const DASH_LENGTH = 3;
const MAX_ARC_WITHOUT_LARGE_FLAG = 180;

function point(cx: number, cy: number, radius: number, angle: number): string {
  const radians = angle * RADIANS_PER_DEGREE;
  return `${(cx + radius * Math.sin(radians)).toFixed(DECIMALS)},${(cy - radius * Math.cos(radians)).toFixed(DECIMALS)}`;
}

/** One ring segment between two angles (degrees clockwise from the top). */
function sectorPath(cx: number, cy: number, outer: number, inner: number, from: number, to: number): string {
  const large = to - from > MAX_ARC_WITHOUT_LARGE_FLAG ? 1 : 0;
  return [
    `M${point(cx, cy, outer, from)}`,
    `A${outer},${outer} 0 ${large} 1 ${point(cx, cy, outer, to)}`,
    `L${point(cx, cy, inner, to)}`,
    `A${inner},${inner} 0 ${large} 0 ${point(cx, cy, inner, from)}`,
    "Z",
  ].join(" ");
}

/** A whole ring in one segment: two circles drawn with the even-odd rule leave the hole empty. */
function fullRingPath(cx: number, cy: number, outer: number, inner: number): string {
  const circle = (radius: number, sweep: 0 | 1) =>
    `M${cx},${cy - radius} A${radius},${radius} 0 1 ${sweep} ${cx},${cy + radius} A${radius},${radius} 0 1 ${sweep} ${cx},${cy - radius} Z`;
  return `${circle(outer, 1)} ${circle(inner, 0)}`;
}

/**
 * A donut (or, with `half`, a gauge) drawn in SVG. Zero segments are left out, a single segment fills the whole ring,
 * and a total of zero shows an empty track. Hatched and dashed tones are patterns, so no state relies on colour alone.
 */
export function RingChart({ ariaLabel, children, half = false, segments, size }: RingChartProps) {
  const patternId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const outer = size / 2 - EDGE_MARGIN;
  const inner = outer * (half ? HALF_INNER_RATIO : INNER_RATIO);
  const cx = size / 2;
  const cy = half ? outer + EDGE_MARGIN : size / 2;
  const height = half ? cy + HALF_BOTTOM_MARGIN : size;
  const sweep = half ? HALF_SWEEP : FULL_SWEEP;
  const start = half ? -HALF_SWEEP / 2 : 0;
  const visible = segments.filter((segment) => segment.value > 0);
  const total = visible.reduce((sum, segment) => sum + segment.value, 0);
  const trackPath = half ? sectorPath(cx, cy, outer, inner, start, start + sweep) : fullRingPath(cx, cy, outer, inner);

  let cursor = start;
  const shapes = visible.map((segment) => {
    const span = (segment.value / total) * sweep;
    const from = cursor;
    cursor += span;
    const alone = visible.length === 1;
    const gap = alone ? 0 : Math.min(GAP_DEGREES, span / GAP_SPAN_DIVISOR);
    const path = alone && !half ? fullRingPath(cx, cy, outer, inner) : sectorPath(cx, cy, outer, inner, from + gap, from + span - gap);
    const title = <title>{segment.label}</title>;
    if (segment.tone === "stripe") {
      return (
        <path d={path} fill={`url(#${patternId})`} fillRule="evenodd" key={segment.key}>
          {title}
        </path>
      );
    }
    if (segment.tone === "dashed") {
      return (
        <path className="fill-card stroke-(--dash-dashed)" d={path} fillRule="evenodd" key={segment.key} strokeDasharray={`${DASH_LENGTH} ${DASH_LENGTH}`} strokeWidth={DASH_STROKE_WIDTH}>
          {title}
        </path>
      );
    }
    return (
      <path className={TONE_FILL_CLASS[segment.tone]} d={path} fillRule="evenodd" key={segment.key}>
        {title}
      </path>
    );
  });

  return (
    <div className="relative shrink-0" data-testid="ring-chart">
      <svg aria-label={ariaLabel} height={height} role="img" viewBox={`0 0 ${size} ${height}`} width={size}>
        <defs>
          <pattern height={PATTERN_SIZE} id={patternId} patternTransform={`rotate(${PATTERN_ROTATION})`} patternUnits="userSpaceOnUse" width={PATTERN_SIZE}>
            <rect className="fill-(--dash-stripe-a)" height={PATTERN_SIZE} width={PATTERN_SIZE} />
            <line className="stroke-(--dash-stripe-b)" strokeWidth={PATTERN_STRIPE_WIDTH} x1={0} x2={0} y1={0} y2={PATTERN_SIZE} />
          </pattern>
        </defs>
        {total === 0 ? <path className="fill-(--dash-track)" d={trackPath} fillRule="evenodd" /> : shapes}
      </svg>
      {children ? (
        <div className={cn("pointer-events-none absolute flex flex-col items-center gap-0.5", half ? "inset-x-0 bottom-0 justify-end" : "inset-0 justify-center")}>{children}</div>
      ) : null}
    </div>
  );
}
