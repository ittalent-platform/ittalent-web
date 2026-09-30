import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export function RoleBadge({ role }: { role?: string }) {
  const { t } = useTranslation();
  if (role === "admin") {
    return (
      <Badge className="bg-(--primary-50) text-(--primary-700) border-(--primary-200)">
        {t("adminUsers.role.admin")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-secondary text-secondary-foreground">
      {t("adminUsers.role.user")}
    </Badge>
  );
}

export function StatusBadge({ status }: { status?: string }) {
  const { t } = useTranslation();
  if (status === "active") {
    return (
      <Badge className="bg-(--status-success-bg) text-(--status-success-fg) border-(--status-success-border)">
        {t("adminUsers.status.active")}
      </Badge>
    );
  }

  if (status === "suspended") {
    return (
      <Badge className="bg-(--danger-bg) text-(--danger-fg) border-(--danger-border)">
        {t("adminUsers.status.suspended")}
      </Badge>
    );
  }

  return (
    <Badge className="bg-muted text-muted-foreground">
      {status ? t(`adminUsers.status.${status}`, { defaultValue: status }) : t("adminUsers.status.inactive")}
    </Badge>
  );
}
