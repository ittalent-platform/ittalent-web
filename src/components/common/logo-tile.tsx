import { useState } from "react";

import { cn } from "@/lib/utils";

// Static class names so Tailwind can see them; the palette itself lives in globals.css (--logo-n).
const LOGO_TONES = ["bg-(--logo-1)", "bg-(--logo-2)", "bg-(--logo-3)", "bg-(--logo-4)", "bg-(--logo-5)", "bg-(--logo-6)"] as const;
// Same five pairs and hash as the marketplace Jobs / Companies marks, so a company keeps one colour everywhere.
const TINT_TONES = [
  "bg-mkt-accent-soft text-mkt-accent-hover",
  "bg-mkt-green-bg text-mkt-green-fg",
  "bg-mkt-blue-bg text-mkt-blue-fg",
  "bg-mkt-chip text-mkt-ink-2",
  "bg-mkt-violet-bg text-mkt-violet-fg",
] as const;
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

function toneIndex(seed: string, count: number): number {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % count;
}

/** The tint classes (bg + fg) a company always gets, e.g. for hand-placed decorative tiles. */
export function companyTint(seed: string): string {
  return TINT_TONES[toneIndex(seed, TINT_TONES.length)];
}

type LogoTileProps = {
  className?: string;
  /** Shown instead of the initials when it loads. */
  logoUrl?: string;
  name: string;
  /** Keeps a company's colour stable everywhere (its id); defaults to the name. */
  seed?: string;
  size?: LogoTileSize;
  tone?: "solid" | "tint";
};

/** Company mark: initials on a deterministic colour (`tint` matches the marketplace marks, `solid` the admin screens), or the company's logo. Every job is shown with its company (DESIGN.md). */
export function LogoTile({ className, logoUrl, name, seed = name, size = "md", tone = "solid" }: LogoTileProps) {
  const [failed, setFailed] = useState(false);
  const showLogo = Boolean(logoUrl) && !failed;
  const colour = showLogo ? "bg-card" : tone === "tint" ? companyTint(seed) : cn("text-white", LOGO_TONES[toneIndex(seed, LOGO_TONES.length)]);
  return (
    <span aria-hidden={!showLogo} className={cn("itt-display grid shrink-0 place-items-center overflow-hidden font-bold", colour, LOGO_SIZES[size], className)}>
      {showLogo ? <img alt={`${name} logo`} className="size-full object-contain p-2" loading="lazy" onError={() => setFailed(true)} src={logoUrl} /> : companyInitials(name)}
    </span>
  );
}
