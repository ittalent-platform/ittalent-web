import { cn } from "@/lib/utils";
import {
  companyInitials,
  logoPalette,
} from "@/features/public-site/career/career-format";

/** Company mark shared with the Jobs and Companies pages: initials on the marketplace logo palette. */
export function CompanyMark({
  name,
  seed,
  className,
}: {
  name: string;
  seed?: string;
  className?: string;
}) {
  const palette = logoPalette(seed ?? name);
  return (
    <span
      aria-hidden
      className={cn(
        "itt-display flex shrink-0 items-center justify-center font-bold",
        className,
      )}
      style={{
        background: palette.bg,
        color: palette.fg,
      }} /* dynamic: runtime value */
    >
      {companyInitials(name)}
    </span>
  );
}
