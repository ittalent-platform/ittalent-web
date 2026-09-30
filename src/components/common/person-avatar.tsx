import { cn } from "@/lib/utils";

const tones = [
  "bg-(--application-review-bg) text-(--application-review)",
  "bg-(--application-hired-bg) text-(--application-hired)",
  "bg-(--application-withdrawn-bg) text-(--application-withdrawn)",
  "bg-muted text-muted-foreground",
];

export function personInitials(name?: string) {
  return (name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** `peach` fixes one Ember tint (admin user accounts); the default varies by name. */
export function PersonAvatar({ className, name, seed = name ?? "", src, tone }: { className?: string; name?: string; seed?: string; src?: string | null; tone?: "peach" }) {
  const lastCharacter = seed.charCodeAt(Math.max(0, seed.length - 1)) || 0;
  return (
    <span className={cn("grid shrink-0 place-items-center overflow-hidden rounded-full font-bold", tone === "peach" ? "bg-(--status-peach-bg) text-(--status-peach-fg)" : tones[lastCharacter % tones.length], className)}>
      {src ? <img alt="" className="size-full object-cover" src={src} /> : personInitials(name)}
    </span>
  );
}
