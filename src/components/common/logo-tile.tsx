import { cn } from "@/lib/utils";

// Static class names so Tailwind can see them; the palette itself lives in globals.css (--logo-n).
const LOGO_TONES = ["bg-(--logo-1)", "bg-(--logo-2)", "bg-(--logo-3)", "bg-(--logo-4)", "bg-(--logo-5)", "bg-(--logo-6)"] as const;
const LOGO_SIZES = {
  sm: "size-[22px] rounded-md text-[7px]",
  md: "size-9 rounded-[10px] text-xs",
  lg: "size-14 rounded-2xl text-lg",
  xl: "size-[52px] rounded-[14px] text-[17px]",
} as const;
const INITIALS_LENGTH = 2;

export type LogoTileSize = keyof typeof LOGO_SIZES;

export function companyInitials(name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  // A single CamelCase word ("DataWave") reads as two words; otherwise use each word's first letter.
  const parts = words.length === 1 ? (words[0]!.match(/[A-Z][a-z0-9]*|[a-z0-9]+/g) ?? words) : words;
  const initials = parts.map((part) => part[0]).join("");
  return (initials.length >= INITIALS_LENGTH ? initials : (words[0] ?? "").slice(0, INITIALS_LENGTH)).slice(0, INITIALS_LENGTH).toUpperCase();
}

function toneIndex(seed: string): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % LOGO_TONES.length;
}

/** Company mark: initials on a deterministic colour. Every job is shown with its company (DESIGN.md). */
export function LogoTile({ name, size = "md", className }: { name: string; size?: LogoTileSize; className?: string }) {
  return (
    <span aria-hidden className={cn("itt-display grid shrink-0 place-items-center font-bold text-white", LOGO_TONES[toneIndex(name)], LOGO_SIZES[size], className)}>
      {companyInitials(name)}
    </span>
  );
}
