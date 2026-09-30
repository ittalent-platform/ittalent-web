import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { LogoTile, type LogoTileSize } from "@/components/common/logo-tile";
import { cn } from "@/lib/utils";

export function EnterpriseStatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const normalized = status?.toLowerCase() ?? "pending";

  if (normalized === "active") {
    return (
      <Badge className="bg-(--status-success-bg) text-(--status-success-fg) border-(--status-success-border) font-semibold px-2.5 py-0.5 rounded-full text-xs">
        {t("adminEnterprises.status.active")}
      </Badge>
    );
  }

  if (normalized === "suspended") {
    return (
      <Badge className="bg-(--danger-bg) text-(--danger-fg) border-(--danger-border) font-semibold px-2.5 py-0.5 rounded-full text-xs">
        {t("adminEnterprises.status.suspended")}
      </Badge>
    );
  }

  if (normalized === "pending") {
    return (
      <Badge className="bg-(--status-warning-bg) text-(--status-warning-fg) border-(--status-warning-border) font-semibold px-2.5 py-0.5 rounded-full text-xs">
        {t("adminEnterprises.status.pending")}
      </Badge>
    );
  }

  if (normalized === "rejected") {
    return (
      <Badge className="bg-(--danger-bg) text-(--danger-fg) border-(--danger-border) font-semibold px-2.5 py-0.5 rounded-full text-xs">
        {t("adminEnterprises.status.rejected")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-muted text-muted-foreground border-border font-semibold px-2.5 py-0.5 rounded-full text-xs">
      {status ? t(`adminEnterprises.status.${status}`, { defaultValue: status }) : t("adminEnterprises.status.inactive")}
    </Badge>
  );
}

export function CompanyTypeBadge({ type }: { type?: string | null }) {
  if (!type) return null;

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary text-secondary-foreground border border-border/40 whitespace-nowrap">
      {type}
    </span>
  );
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
    xl: "lg",
  };

  const imgSizeClasses = {
    sm: "size-8 rounded-lg",
    md: "size-9 rounded-[10px]",
    lg: "size-14 rounded-2xl",
    xl: "size-16 rounded-2xl",
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
