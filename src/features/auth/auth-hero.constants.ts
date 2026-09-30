// Concentric rings of the auth hero, listed outermost first. Every ring is 57 wide and centred on x = 280 of a
// 560 x 520 artwork box, so the artwork keeps its shape while the aside grows or shrinks.
export const HERO_VIEWBOX = { width: 560, height: 520 } as const;
const RING_STROKE_WIDTH = 57;
const RING_CENTER_X = 280;
const RING_STEP = 56;
const OUTER_RADIUS = 476;
const RING_COUNT = 9;
const RING_PULSE_STAGGER_SECONDS = 0.35;

// Full class names so Tailwind can see them; the colours are the `--hero-ring-*` tokens.
const RING_FILL_CLASSES = [
  "bg-(--hero-ring-1)",
  "bg-(--hero-ring-2)",
  "bg-(--hero-ring-3)",
  "bg-(--hero-ring-4)",
  "bg-(--hero-ring-5)",
  "bg-(--hero-ring-6)",
  "bg-(--hero-ring-7)",
  "bg-(--hero-ring-8)",
  "bg-(--hero-ring-9)",
] as const;

// Rings are solid discs stacked outermost first (a border-only ring shows the hero background through the gap that
// opens between neighbours while they scale by different amounts). They are HTML layers instead of SVG strokes: transforms on HTML layers run on the compositor, so
// the pulse stays smooth where animated SVG paths repaint every frame. Sizes are `cqw` of the hero artwork box
// (`container-type: inline-size`), so the artwork scales with the aside.
const toCqw = (units: number): string => `${((units / HERO_VIEWBOX.width) * 100).toFixed(4)}cqw`;

export const HERO_RINGS = Array.from({ length: RING_COUNT }, (_, index) => {
  const radius = OUTER_RADIUS - index * RING_STEP;
  const outerRadius = radius + RING_STROKE_WIDTH / 2;
  return {
    id: index,
    size: toCqw(outerRadius * 2),
    left: toCqw(RING_CENTER_X - outerRadius),
    bottom: toCqw(-outerRadius),
    fillClass: RING_FILL_CLASSES[index],
    // The innermost ring starts first, so the swell travels outward.
    pulseDelaySeconds: (RING_COUNT - 1 - index) * RING_PULSE_STAGGER_SECONDS,
  };
});

export const AUTH_ASIDE_WIDTH_CLASS = "lg:grid-cols-[720px_1fr]";
// Result and recovery screens keep the Ember panel and rings but drop the sales copy.
export const AUTH_ASIDE_COMPACT_WIDTH_CLASS = "lg:grid-cols-[400px_1fr]";
