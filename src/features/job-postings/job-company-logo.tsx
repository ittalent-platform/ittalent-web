import { useState } from "react";

import { LogoTile, type LogoTileSize } from "@/components/common/logo-tile";
import { cn } from "@/lib/utils";

const IMAGE_SIZES: Record<LogoTileSize, string> = {
  sm: "size-[22px] rounded-md",
  md: "size-9 rounded-[10px]",
  lg: "size-14 rounded-2xl",
  xl: "size-[52px] rounded-[14px]",
};

/** Every job is shown with its company: the uploaded logo when there is one, initials on a tile otherwise. */
export function JobCompanyLogo({
  className,
  logoUrl,
  name,
  size = "md",
}: {
  className?: string;
  logoUrl?: string | null;
  name: string;
  size?: LogoTileSize;
}) {
  const [failed, setFailed] = useState(false);
  if (logoUrl && !failed) {
    return (
      <img
        alt=""
        className={cn(
          IMAGE_SIZES[size],
          "shrink-0 border border-border bg-card object-cover",
          className,
        )}
        onError={() => setFailed(true)}
        src={logoUrl}
      />
    );
  }
  return <LogoTile className={className} name={name} size={size} />;
}
