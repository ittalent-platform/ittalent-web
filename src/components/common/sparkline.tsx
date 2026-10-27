const WIDTH = 96;
const HEIGHT = 30;
const PADDING_X = 4;
const LINE_TOP = 4;
const LINE_BOTTOM = 26;
const FLAT_Y = 15;
const MIN_POINTS = 2;
const DOT_RADIUS = 3.5;
const DECIMALS = 1;

/**
 * A 96×30 trend line with its area and a dot on the latest point. It draws shape only (no axis, no numbers), so it is
 * hidden from assistive technology and omitted when there are fewer than two points to connect.
 */
export function Sparkline({ values }: { values: readonly number[] }) {
  if (values.length < MIN_POINTS) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const step = (WIDTH - PADDING_X * 2) / (values.length - 1);
  const points = values.map((value, index) => ({
    x: PADDING_X + index * step,
    y: max === min ? FLAT_Y : LINE_BOTTOM - ((value - min) / (max - min)) * (LINE_BOTTOM - LINE_TOP),
  }));
  const at = (point: { x: number; y: number }) => `${point.x.toFixed(DECIMALS)},${point.y.toFixed(DECIMALS)}`;
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${at(point)}`).join(" ");
  const last = points[points.length - 1];
  const first = points[0];
  if (!last || !first) return null;
  const area = `${line} L${last.x.toFixed(DECIMALS)},${HEIGHT} L${first.x.toFixed(DECIMALS)},${HEIGHT} Z`;

  return (
    <svg aria-hidden className="shrink-0" height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH}>
      <path className="fill-(--dash-spark-fill)" d={area} />
      <path className="fill-none stroke-brand" d={line} strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <circle className="fill-brand stroke-card" cx={last.x} cy={last.y} r={DOT_RADIUS} strokeWidth={1.5} />
    </svg>
  );
}
