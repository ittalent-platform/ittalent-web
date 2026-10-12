import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

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
