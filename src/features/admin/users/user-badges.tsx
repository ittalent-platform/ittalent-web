import { useTranslation } from "react-i18next";

import { Badge } from "@/components/ui/badge";

import type { EmailBadgeKind } from "./user-display";

export function RoleBadge({ role }: { role?: string }) {
  const { t } = useTranslation();
  const variant = role === "admin" ? "inverse" : role === "enterprise_admin" ? "blocked" : role === "recruiter" ? "info" : "neutral";
  return <Badge variant={variant}>{role ? t(`adminUsers.role.${role}`, { defaultValue: role }) : t("adminUsers.role.user")}</Badge>;
}

const EMAIL_BADGE_VARIANT = { inviteFailed: "destructive", overdue: "destructive", unverified: "warning", verified: "success" } as const;

const EMAIL_BADGE_LABEL_KEY = {
  inviteFailed: "adminUsers.table.emailInviteFailed",
  overdue: "adminUsers.table.emailOverdue",
  unverified: "adminUsers.emailStatus.unverified",
  verified: "adminUsers.emailStatus.verified",
} as const;

export function EmailStatusBadge({ kind, verified }: { kind?: EmailBadgeKind; verified?: boolean }) {
  const { t } = useTranslation();
  kind ??= verified ? "verified" : "unverified";
  return <Badge variant={EMAIL_BADGE_VARIANT[kind]}>{t(EMAIL_BADGE_LABEL_KEY[kind])}</Badge>;
}

export function StatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  const variant = status === "active" ? "success" : status === "invited" ? "warning" : status === "suspended" ? "destructive" : status === "blocked" ? "blocked" : "neutral";
  const label = status ? t(`adminUsers.status.${status}`, { defaultValue: status }) : t("adminUsers.status.inactive");
  return <Badge variant={variant}>{label}</Badge>;
}
