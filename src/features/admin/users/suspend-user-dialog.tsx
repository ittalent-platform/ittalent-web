import { Ban } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { UserDto } from "@/api/generated/types.gen";
import { ActionConfirmDialog } from "@/components/common/action-confirm-dialog";

/** Suspend confirmation (Users design). There is no suspend endpoint yet, so confirming stays disabled. */
export function SuspendUserDialog({ onOpenChange, open, user }: { onOpenChange: (open: boolean) => void; open: boolean; user: UserDto }) {
  const { t } = useTranslation();
  return (
    <ActionConfirmDialog
      action={t("adminUsers.suspend.confirm")}
      cancelLabel={t("actions.cancel")}
      description={t("adminUsers.suspend.description")}
      confirmDisabled
      icon={Ban}
      onConfirm={() => onOpenChange(false)}
      onOpenChange={onOpenChange}
      open={open}
      title={t("adminUsers.suspend.title", { name: user.username })}
      variant="destructive-solid"
    >
      <p className="text-[12.5px] text-muted-foreground">{t("adminUsers.form.unavailable")}</p>
    </ActionConfirmDialog>
  );
}
