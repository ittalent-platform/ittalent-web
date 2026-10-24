/**
 * The colours a statistics chart can use, as the classes that paint a legend swatch and a ring segment.
 * `stripe` (closed, cancelled) and `dashed` (draft) are patterns, so a state never relies on colour alone.
 */
export type ChartTone = "amber" | "blue" | "brand" | "dashed" | "green" | "red" | "stripe" | "violet";

/** Classes of the 12px square beside a legend row. */
export const TONE_SWATCH_CLASS: Record<ChartTone, string> = {
  amber: "bg-(--dash-amber)",
  blue: "bg-(--dash-blue)",
  brand: "bg-brand",
  dashed: "border-[1.5px] border-dashed border-(--dash-dashed)",
  green: "bg-(--dash-green)",
  red: "bg-(--dash-red)",
  stripe: "dash-stripe",
  violet: "bg-(--dash-violet)",
};

/** SVG fill of a solid ring segment; the patterned tones are drawn by the ring itself. */
export const TONE_FILL_CLASS: Record<Exclude<ChartTone, "dashed" | "stripe">, string> = {
  amber: "fill-(--dash-amber)",
  blue: "fill-(--dash-blue)",
  brand: "fill-brand",
  green: "fill-(--dash-green)",
  red: "fill-(--dash-red)",
  violet: "fill-(--dash-violet)",
};
