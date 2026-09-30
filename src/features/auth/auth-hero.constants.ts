// Concentric rings of the auth hero, listed outermost first. Every ring is 57 wide and centred on x = 280 of a
// 560 x 520 artwork box, so the artwork keeps its shape while the aside grows or shrinks.
export const HERO_VIEWBOX = { width: 560, height: 520 } as const;
export const HERO_RING_STROKE_WIDTH = 57;
const RING_CENTER_X = 280;
const RING_STEP = 56;
const OUTER_RADIUS = 476;
const RING_COUNT = 9;
const RING_PULSE_STAGGER_SECONDS = 0.35;

// Full class names so Tailwind can see them; the colours are the `--hero-ring-*` tokens.
const RING_BORDER_CLASSES = [
  "border-(--hero-ring-1)",
  "border-(--hero-ring-2)",
  "border-(--hero-ring-3)",
  "border-(--hero-ring-4)",
  "border-(--hero-ring-5)",
  "border-(--hero-ring-6)",
  "border-(--hero-ring-7)",
  "border-(--hero-ring-8)",
  "border-(--hero-ring-9)",
] as const;

// Rings are plain circles (border only) instead of SVG strokes: transforms on HTML layers run on the compositor, so
// the pulse stays smooth where animated SVG paths repaint every frame. Sizes are `cqw` of the hero artwork box
// (`container-type: inline-size`), so the artwork scales with the aside.
const toCqw = (units: number): string => `${((units / HERO_VIEWBOX.width) * 100).toFixed(4)}cqw`;

export const HERO_RINGS = Array.from({ length: RING_COUNT }, (_, index) => {
  const radius = OUTER_RADIUS - index * RING_STEP;
  const outerRadius = radius + HERO_RING_STROKE_WIDTH / 2;
  return {
    id: index,
    size: toCqw(outerRadius * 2),
    left: toCqw(RING_CENTER_X - outerRadius),
    bottom: toCqw(-outerRadius),
    borderWidth: toCqw(HERO_RING_STROKE_WIDTH),
    borderClass: RING_BORDER_CLASSES[index],
    // The innermost ring starts first, so the swell travels outward.
    pulseDelaySeconds: (RING_COUNT - 1 - index) * RING_PULSE_STAGGER_SECONDS,
  };
});

export const AUTH_ASIDE_WIDTH_CLASS = "lg:grid-cols-[720px_1fr]";
