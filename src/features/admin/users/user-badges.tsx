import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

export function RoleBadge({ role }: { role?: string }) {
  const { t } = useTranslation();
  return <Badge variant={role === "admin" ? "peach" : "neutral"}>{role === "admin" ? t("adminUsers.role.admin") : t("adminUsers.role.user")}</Badge>;
}

export function StatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const variant = status === "active" ? "success" : status === "suspended" ? "destructive" : "neutral";
  const label = status ? t(`adminUsers.status.${status}`, { defaultValue: status }) : t("adminUsers.status.inactive");
  return <Badge variant={variant}>{label}</Badge>;
}
