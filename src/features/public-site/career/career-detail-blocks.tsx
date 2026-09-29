import { cn } from "@/lib/utils";

export function DetailTextBlock({ text }: { text?: string }) {
  if (!text) return null;
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const bulletLines = lines.filter((l) => /^[-*]\s+/.test(l));
  const isBulletList =
    bulletLines.length >= Math.ceil(lines.length * 0.6) && lines.length > 1;

  if (isBulletList) {
    return (
      <ul className="flex flex-col gap-3">
        {lines.map((line, i) => (
          <li
            className="flex items-start gap-3 text-[14.5px] leading-[1.55] text-(--fg-muted)"
            key={i}
            /* static list */
          >
            <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-full bg-[var(--primary)]" />
            <span>{line.replace(/^[-*]\s+/, "")}</span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {lines.map((line, i) => (
        <p
          className="text-[14.5px] leading-[1.55] text-(--fg-muted)"
          key={i} /* static list */
        >
          {line}
        </p>
      ))}
    </div>
  );
}

export function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex items-center justify-between gap-4 text-[13.5px]">
      <span className="text-[var(--fg-muted)]">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function Stat({
  value,
  label,
  highlight = false,
}: {
  value: string;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div
        className={cn(
          "text-[34px] font-bold",
          highlight && "text-[var(--primary)]",
        )}
      >
        {value}
      </div>
      <div className="itt-mono text-[11.5px] uppercase tracking-[0.06em] text-[#8C8D94]">
        {label}
      </div>
    </div>
  );
}

export function PhoneFallback() {
  return <span className="text-[var(--primary)]">☎</span>;
}
