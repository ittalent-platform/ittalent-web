// Concentric arcs of the auth hero, listed outermost first. Every ring is 57 wide and centred on x = 280 of a
// 560 x 520 viewBox, so the artwork keeps its shape while the aside grows or shrinks.
export const HERO_VIEWBOX = { width: 560, height: 520 } as const;
export const HERO_RING_STROKE_WIDTH = 57;
const RING_CENTER_X = 280;
const RING_STEP = 56;
const OUTER_RADIUS = 476;
const RING_COUNT = 9;
const RING_PULSE_STAGGER_SECONDS = 0.35;

// Full class names so Tailwind can see them; the colours are the `--hero-ring-*` tokens.
const RING_STROKE_CLASSES = [
  "stroke-(--hero-ring-1)",
  "stroke-(--hero-ring-2)",
  "stroke-(--hero-ring-3)",
  "stroke-(--hero-ring-4)",
  "stroke-(--hero-ring-5)",
  "stroke-(--hero-ring-6)",
  "stroke-(--hero-ring-7)",
  "stroke-(--hero-ring-8)",
  "stroke-(--hero-ring-9)",
] as const;

export const HERO_RINGS = Array.from({ length: RING_COUNT }, (_, index) => {
  const radius = OUTER_RADIUS - index * RING_STEP;
  const left = RING_CENTER_X - radius;
  const right = RING_CENTER_X + radius;
  return {
    id: index,
    path: `M${left} ${HERO_VIEWBOX.height} A${radius} ${radius} 0 0 1 ${right} ${HERO_VIEWBOX.height}`,
    strokeClass: RING_STROKE_CLASSES[index],
    // The innermost ring starts first, so the swell travels outward.
    pulseDelaySeconds: (RING_COUNT - 1 - index) * RING_PULSE_STAGGER_SECONDS,
  };
});

export const AUTH_ASIDE_WIDTH_CLASS = "lg:grid-cols-[640px_1fr]";
