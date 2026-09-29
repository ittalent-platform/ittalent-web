import { useState } from "react";

import { cn } from "@/lib/utils";

type EnterpriseLogoProps = {
  className?: string;
  logoUrl?: string;
  name: string;
};

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Company logo with a branded initials fallback when the image is missing or broken. */
export function EnterpriseLogo({
  className,
  logoUrl,
  name,
}: EnterpriseLogoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-[14px] border border-[var(--border)] bg-white",
        className,
      )}
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
        <span className="flex size-full items-center justify-center bg-[var(--primary-50)] text-[1.1em] font-bold text-[var(--primary)]">
          {initials(name) || "?"}
        </span>
      )}
    </div>
  );
}
