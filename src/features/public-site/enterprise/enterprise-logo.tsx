import { useState } from "react";

import { cn } from "@/lib/utils";
import {
  companyInitials,
  logoPalette,
} from "@/features/public-site/career/career-format";

type EnterpriseLogoProps = {
  className?: string;
  logoUrl?: string;
  name: string;
  /** Keeps the fallback colour identical to the job cards (enterprise id). */
  seed?: string;
};

/** Company logo; falls back to a marketplace-palette initials tile. */
export function EnterpriseLogo({
  className,
  logoUrl,
  name,
  seed,
}: EnterpriseLogoProps) {
  const [failed, setFailed] = useState(false);
  const palette = logoPalette(seed ?? name);

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden font-['Space_Grotesk',sans-serif] font-bold",
        className,
      )}
      style={
        logoUrl && !failed
          ? { background: "#ffffff" }
          : { background: palette.bg, color: palette.fg }
      }
    >
      {logoUrl && !failed ? (
        <img
          alt={`${name} logo`}
          className="size-full object-contain p-2"
          loading="lazy"
          onError={() => setFailed(true)}
          src={logoUrl}
        />
      ) : (
        <span aria-hidden="true">{companyInitials(name)}</span>
      )}
    </span>
  );
}