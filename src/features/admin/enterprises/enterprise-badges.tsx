import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { LogoTile, type LogoTileSize } from "@/components/common/logo-tile";
import { cn } from "@/lib/utils";

const STATUS_VARIANTS = {
  active: "success",
  pending: "warning",
  suspended: "destructive",
  rejected: "destructive",
} as const;

/** Same Badge variants as the Users screens, so both status tags look alike. */
export function EnterpriseStatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const normalized = status?.toLowerCase() ?? "";
  const variant = STATUS_VARIANTS[normalized as keyof typeof STATUS_VARIANTS] ?? "neutral";
  const label = normalized
    ? t(`adminEnterprises.status.${normalized}`, { defaultValue: status })
    : t("adminEnterprises.status.inactive");
  return <Badge variant={variant}>{label}</Badge>;
}

export function CompanyTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;
  return <Badge variant="neutral">{type}</Badge>;
}

export function formatEnterpriseId(id?: string): string {
  if (!id) return "ENT-0000";
  if (id.startsWith("ENT-")) return id;
  return `ENT-${id.slice(-4).toUpperCase()}`;
}

type EnterpriseAvatarProps = {
  name?: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

export function EnterpriseAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: EnterpriseAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const tileSizes: Record<string, LogoTileSize> = {
    sm: "sm",
    md: "md",
    lg: "lg",
    xl: "xl",
  };

  const imgSizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-9 rounded-[10px]",
    lg: "size-14 rounded-2xl",
    xl: "size-[52px] rounded-[14px]",
  }[size];

  if (logoUrl && !imageError) {
    return (
      <img
        alt={name ?? "Enterprise logo"}
        className={cn(
          imgSizeClasses,
          "object-cover border border-border shrink-0 bg-card shadow-2xs",
          className,
        )}
        onError={() => setImageError(true)}
        src={logoUrl}
      />
    );
  }

  return (
    <LogoTile
      className={className}
      name={name ?? "Enterprise"}
      size={tileSizes[size] ?? "md"}
    />
  );
}
